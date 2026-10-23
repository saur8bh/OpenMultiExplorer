import os
import shutil
import string
import platform
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Dict, Any

from backend.providers.base import StorageProvider, StorageItem
from backend.crypto import is_encrypted_file


class LocalProvider(StorageProvider):
    """Local Filesystem Provider supporting Windows drives and Unix paths."""

    def __init__(self, account_config: Dict[str, Any]):
        super().__init__(account_config)
        self.root_path = account_config.get("root_path", "")

    async def test_connection(self) -> bool:
        if self.root_path and os.path.exists(self.root_path):
            return True
        return True

    def _resolve_path(self, rel_path: str) -> Path:
        rel_path = rel_path.strip().replace("\\", "/")
        if not rel_path or rel_path == "/":
            if self.root_path:
                return Path(self.root_path)
            return Path("/")

        if self.root_path:
            clean_rel = rel_path.lstrip("/")
            return Path(self.root_path) / clean_rel

        # Direct absolute path
        return Path(rel_path)

    async def list_dir(self, path: str = "/") -> List[StorageItem]:
        items: List[StorageItem] = []
        is_windows = platform.system() == "Windows"

        # If on Windows and at root ("/" or "") and no specific root_path is bound, list drive letters!
        if is_windows and not self.root_path and (not path or path == "/"):
            drives = []
            for letter in string.ascii_uppercase:
                drive = f"{letter}:\\"
                if os.path.exists(drive):
                    items.append(
                        StorageItem(
                            name=f"Drive ({letter}:)",
                            path=f"{letter}:/",
                            is_dir=True,
                            size=0,
                            modified="",
                            account_id=self.account_id,
                            account_name=self.account_name,
                            account_type=self.account_type,
                        )
                    )
            return items

        target = self._resolve_path(path)
        if not target.exists() or not target.is_dir():
            return items

        try:
            with os.scandir(target) as entries:
                for entry in entries:
                    try:
                        stat = entry.stat()
                        is_dir = entry.is_dir()
                        size = stat.st_size if not is_dir else 0
                        modified = datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M:%S")
                        
                        encrypted = False
                        if not is_dir and size >= 8:
                            try:
                                with open(entry.path, "rb") as f:
                                    header = f.read(8)
                                    encrypted = is_encrypted_file(header)
                            except Exception:
                                pass

                        norm_path = entry.path.replace("\\", "/")
                        items.append(
                            StorageItem(
                                name=entry.name,
                                path=norm_path,
                                is_dir=is_dir,
                                size=size,
                                modified=modified,
                                is_encrypted=encrypted,
                                account_id=self.account_id,
                                account_name=self.account_name,
                                account_type=self.account_type,
                            )
                        )
                    except (PermissionError, OSError):
                        continue
        except (PermissionError, OSError):
            return items

        # Sort: directories first, then alphabetical
        items.sort(key=lambda x: (not x.is_dir, x.name.lower()))
        return items

    async def create_dir(self, path: str) -> bool:
        target = self._resolve_path(path)
        target.mkdir(parents=True, exist_ok=True)
        return True

    async def delete(self, path: str, is_dir: bool = False) -> bool:
        target = self._resolve_path(path)
        if not target.exists():
            return False
        if target.is_dir():
            shutil.rmtree(target)
        else:
            target.unlink()
        return True

    async def rename(self, old_path: str, new_path: str) -> bool:
        src = self._resolve_path(old_path)
        dst = self._resolve_path(new_path)
        dst.parent.mkdir(parents=True, exist_ok=True)
        src.rename(dst)
        return True

    async def read_bytes(self, path: str) -> bytes:
        target = self._resolve_path(path)
        with open(target, "rb") as f:
            return f.read()

    async def write_bytes(self, path: str, data: bytes) -> bool:
        target = self._resolve_path(path)
        target.parent.mkdir(parents=True, exist_ok=True)
        with open(target, "wb") as f:
            f.write(data)
        return True

    async def get_metadata(self, path: str) -> Optional[StorageItem]:
        target = self._resolve_path(path)
        if not target.exists():
            return None
        stat = target.stat()
        is_dir = target.is_dir()
        size = stat.st_size if not is_dir else 0
        modified = datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M:%S")
        encrypted = False
        if not is_dir and size >= 8:
            try:
                with open(target, "rb") as f:
                    encrypted = is_encrypted_file(f.read(8))
            except Exception:
                pass
        return StorageItem(
            name=target.name,
            path=str(target).replace("\\", "/"),
            is_dir=is_dir,
            size=size,
            modified=modified,
            is_encrypted=encrypted,
            account_id=self.account_id,
            account_name=self.account_name,
            account_type=self.account_type,
        )
