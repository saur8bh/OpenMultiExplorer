import asyncio
import time
import uuid
from typing import Dict, List, Optional, Any
from pydantic import BaseModel

from backend.config import CHUNK_SIZE
from backend.accounts import account_manager
from backend.crypto import encrypt_bytes, decrypt_bytes, is_encrypted_file, encrypt_filename


class TransferJob(BaseModel):
    id: str
    source_account_id: str
    source_account_name: str
    source_path: str
    target_account_id: str
    target_account_name: str
    target_path: str
    filename: str
    size: int = 0
    bytes_transferred: int = 0
    status: str = "pending"  # pending, transferring, paused, completed, failed, cancelled
    speed_bps: float = 0.0
    progress: float = 0.0
    error_message: Optional[str] = None
    created_at: float
    encrypt_on_upload: bool = False
    decrypt_on_download: bool = False
    passphrase: Optional[str] = None


class TransferManager:
    def __init__(self):
        self.jobs: Dict[str, TransferJob] = {}
        self.max_concurrent_jobs: int = 3
        self.speed_limit_bytes_per_sec: int = 0  # 0 = unlimited
        self._worker_task: Optional[asyncio.Task] = None
        self._running = True

    def set_speed_limit(self, bytes_per_sec: int):
        self.speed_limit_bytes_per_sec = max(0, bytes_per_sec)

    def set_concurrency(self, limit: int):
        self.max_concurrent_jobs = max(1, min(10, limit))

    def add_job(
        self,
        source_account_id: str,
        source_path: str,
        target_account_id: str,
        target_path: str,
        filename: str,
        size: int = 0,
        encrypt_on_upload: bool = False,
        decrypt_on_download: bool = False,
        passphrase: Optional[str] = None
    ) -> TransferJob:
        job_id = str(uuid.uuid4())[:8]
        src_acc = account_manager.get_account_config(source_account_id)
        dst_acc = account_manager.get_account_config(target_account_id)

        job = TransferJob(
            id=job_id,
            source_account_id=source_account_id,
            source_account_name=src_acc.get("name", "Source") if src_acc else "Source",
            source_path=source_path,
            target_account_id=target_account_id,
            target_account_name=dst_acc.get("name", "Target") if dst_acc else "Target",
            target_path=target_path,
            filename=filename,
            size=size,
            status="pending",
            created_at=time.time(),
            encrypt_on_upload=encrypt_on_upload,
            decrypt_on_download=decrypt_on_download,
            passphrase=passphrase
        )
        self.jobs[job_id] = job
        return job

    def list_jobs(self) -> List[TransferJob]:
        return sorted(list(self.jobs.values()), key=lambda j: j.created_at, reverse=True)

    def pause_job(self, job_id: str) -> bool:
        if job_id in self.jobs and self.jobs[job_id].status in ("pending", "transferring"):
            self.jobs[job_id].status = "paused"
            return True
        return False

    def resume_job(self, job_id: str) -> bool:
        if job_id in self.jobs and self.jobs[job_id].status == "paused":
            self.jobs[job_id].status = "pending"
            return True
        return False

    def cancel_job(self, job_id: str) -> bool:
        if job_id in self.jobs and self.jobs[job_id].status not in ("completed", "failed"):
            self.jobs[job_id].status = "cancelled"
            return True
        return False

    def clear_completed(self):
        self.jobs = {k: v for k, v in self.jobs.items() if v.status not in ("completed", "cancelled")}

    async def start_worker(self):
        if self._worker_task is None or self._worker_task.done():
            self._worker_task = asyncio.create_task(self._process_queue())

    async def _process_queue(self):
        while self._running:
            try:
                active_count = sum(1 for j in self.jobs.values() if j.status == "transferring")
                if active_count < self.max_concurrent_jobs:
                    # Find next pending job
                    pending = [j for j in self.jobs.values() if j.status == "pending"]
                    if pending:
                        next_job = pending[0]
                        asyncio.create_task(self._execute_transfer(next_job))
            except Exception:
                pass
            await asyncio.sleep(0.5)

    async def _execute_transfer(self, job: TransferJob):
        job.status = "transferring"
        start_time = time.time()
        try:
            src_provider = account_manager.get_provider(job.source_account_id)
            dst_provider = account_manager.get_provider(job.target_account_id)

            # Read source bytes
            data = await src_provider.read_bytes(job.source_path)
            total_bytes = len(data)
            job.size = total_bytes

            # Apply Client-Side Encryption if requested
            if job.encrypt_on_upload and job.passphrase:
                data = encrypt_bytes(data, job.passphrase)
                total_bytes = len(data)
                job.size = total_bytes
            # Or Decrypt if downloading an encrypted file
            elif job.decrypt_on_download and job.passphrase and is_encrypted_file(data[:8]):
                data = decrypt_bytes(data, job.passphrase)
                total_bytes = len(data)
                job.size = total_bytes

            # Target destination path
            dst_path = job.target_path.rstrip("/")
            dst_filename = job.filename
            if job.encrypt_on_upload and job.passphrase:
                dst_filename = encrypt_filename(job.filename, job.passphrase)
            
            final_dst = f"{dst_path}/{dst_filename}".replace("//", "/")

            # Simulate chunked transfer with speed throttling and progress reporting
            chunk_size = min(64 * 1024, max(4096, total_bytes // 20 or 4096))
            bytes_sent = 0
            
            while bytes_sent < total_bytes:
                if job.status == "paused":
                    await asyncio.sleep(0.5)
                    continue
                if job.status == "cancelled":
                    return

                next_chunk_end = min(bytes_sent + chunk_size, total_bytes)
                current_chunk_size = next_chunk_end - bytes_sent
                bytes_sent = next_chunk_end
                job.bytes_transferred = bytes_sent
                job.progress = round((bytes_sent / total_bytes) * 100, 1) if total_bytes > 0 else 100.0

                elapsed = max(0.001, time.time() - start_time)
                job.speed_bps = round(bytes_sent / elapsed, 1)

                # Speed limiter
                if self.speed_limit_bytes_per_sec > 0:
                    expected_time = bytes_sent / self.speed_limit_bytes_per_sec
                    delay = expected_time - elapsed
                    if delay > 0:
                        await asyncio.sleep(min(delay, 0.2))
                else:
                    await asyncio.sleep(0.01)

            # Write data to destination provider
            await dst_provider.write_bytes(final_dst, data)

            job.status = "completed"
            job.progress = 100.0
            job.bytes_transferred = total_bytes
        except Exception as e:
            job.status = "failed"
            job.error_message = str(e)


# Global singleton transfer manager
transfer_manager = TransferManager()
