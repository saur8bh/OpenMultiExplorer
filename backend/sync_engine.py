import asyncio
from typing import Dict, List, Any, Optional
from backend.accounts import account_manager
from backend.transfers import transfer_manager


class SyncEngine:
    """
    Folder Synchronization Engine.
    Supports Mirror, Update, and Bidirectional sync between any two cloud/local accounts.
    """

    async def analyze(
        self,
        source_account_id: str,
        source_path: str,
        target_account_id: str,
        target_path: str,
        mode: str = "mirror"  # mirror, update, bidirectional
    ) -> Dict[str, Any]:
        src_provider = account_manager.get_provider(source_account_id)
        dst_provider = account_manager.get_provider(target_account_id)

        src_items = await src_provider.list_dir(source_path)
        dst_items = await dst_provider.list_dir(target_path)

        src_map = {item.name: item for item in src_items if not item.is_dir}
        dst_map = {item.name: item for item in dst_items if not item.is_dir}

        actions: List[Dict[str, Any]] = []

        # Analyze files in source
        for name, s_item in src_map.items():
            if name not in dst_map:
                actions.append({
                    "action": "copy_to_target",
                    "filename": name,
                    "direction": "->",
                    "source_size": s_item.size,
                    "target_size": 0,
                    "description": "Copy new file to target"
                })
            else:
                d_item = dst_map[name]
                if s_item.size != d_item.size or s_item.modified > d_item.modified:
                    actions.append({
                        "action": "update_target",
                        "filename": name,
                        "direction": "->",
                        "source_size": s_item.size,
                        "target_size": d_item.size,
                        "description": "Update modified file on target"
                    })
                elif mode == "bidirectional" and d_item.modified > s_item.modified:
                    actions.append({
                        "action": "update_source",
                        "filename": name,
                        "direction": "<-",
                        "source_size": s_item.size,
                        "target_size": d_item.size,
                        "description": "Update newer file back to source"
                    })

        # Analyze files only in target
        for name, d_item in dst_map.items():
            if name not in src_map:
                if mode == "mirror":
                    actions.append({
                        "action": "delete_target",
                        "filename": name,
                        "direction": "x",
                        "source_size": 0,
                        "target_size": d_item.size,
                        "description": "Delete extraneous file on target (Mirror mode)"
                    })
                elif mode == "bidirectional":
                    actions.append({
                        "action": "copy_to_source",
                        "filename": name,
                        "direction": "<-",
                        "source_size": 0,
                        "target_size": d_item.size,
                        "description": "Copy new file to source"
                    })

        return {
            "source_account_id": source_account_id,
            "source_path": source_path,
            "target_account_id": target_account_id,
            "target_path": target_path,
            "mode": mode,
            "total_actions": len(actions),
            "actions": actions
        }

    async def execute(
        self,
        analysis: Dict[str, Any],
        encrypt_on_upload: bool = False,
        passphrase: Optional[str] = None
    ) -> Dict[str, Any]:
        src_acc_id = analysis["source_account_id"]
        src_path = analysis["source_path"]
        dst_acc_id = analysis["target_account_id"]
        dst_path = analysis["target_path"]
        dst_provider = account_manager.get_provider(dst_acc_id)

        scheduled_jobs = []

        for item in analysis.get("actions", []):
            action = item["action"]
            filename = item["filename"]

            if action in ("copy_to_target", "update_target"):
                job = transfer_manager.add_job(
                    source_account_id=src_acc_id,
                    source_path=f"{src_path.rstrip('/')}/{filename}".replace("//", "/"),
                    target_account_id=dst_acc_id,
                    target_path=dst_path,
                    filename=filename,
                    size=item.get("source_size", 0),
                    encrypt_on_upload=encrypt_on_upload,
                    passphrase=passphrase
                )
                scheduled_jobs.append(job.id)

            elif action in ("copy_to_source", "update_source"):
                job = transfer_manager.add_job(
                    source_account_id=dst_acc_id,
                    source_path=f"{dst_path.rstrip('/')}/{filename}".replace("//", "/"),
                    target_account_id=src_acc_id,
                    target_path=src_path,
                    filename=filename,
                    size=item.get("target_size", 0)
                )
                scheduled_jobs.append(job.id)

            elif action == "delete_target":
                try:
                    await dst_provider.delete(f"{dst_path.rstrip('/')}/{filename}".replace("//", "/"), is_dir=False)
                except Exception:
                    pass

        return {
            "status": "queued",
            "scheduled_jobs_count": len(scheduled_jobs),
            "job_ids": scheduled_jobs
        }


sync_engine = SyncEngine()
