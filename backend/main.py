import io
from contextlib import asynccontextmanager
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Query, Response
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.config import DEFAULT_PORT, DEFAULT_HOST
from backend.accounts import account_manager, SUPPORTED_PROVIDERS
from backend.transfers import transfer_manager
from backend.sync_engine import sync_engine
from backend.search_engine import search_engine
from backend.crypto import encrypt_bytes, decrypt_bytes, is_encrypted_file, encrypt_filename, decrypt_filename


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start background transfer worker
    await transfer_manager.start_worker()
    yield


app = FastAPI(
    title="OpenMultiExplorer API",
    description="Multi-Cloud Manager & Dual-Pane File Explorer with Client-Side Encryption",
    version="1.0",
    lifespan=lifespan
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get('/favicon.ico', include_in_schema=False)
def favicon():
    fav_ico = Path(__file__).resolve().parent.parent / "frontend" / "public" / "favicon.ico"
    if fav_ico.exists():
        return FileResponse(fav_ico, media_type="image/x-icon")
    fav_svg = Path(__file__).resolve().parent.parent / "frontend" / "public" / "favicon.svg"
    if fav_svg.exists():
        return FileResponse(fav_svg, media_type="image/svg+xml")
    raise HTTPException(status_code=404)


# --- ACCOUNT MANAGEMENT ---
@app.get("/api/providers/supported")
def get_supported_providers():
    return SUPPORTED_PROVIDERS


@app.get("/api/accounts")
def list_accounts():
    return account_manager.list_accounts()


@app.post("/api/accounts")
def add_account(data: Dict[str, Any]):
    return account_manager.add_account(data)


@app.put("/api/accounts/{account_id}")
def update_account(account_id: str, data: Dict[str, Any]):
    updated = account_manager.update_account(account_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Account not found")
    return updated


@app.delete("/api/accounts/{account_id}")
def delete_account(account_id: str):
    success = account_manager.delete_account(account_id)
    if not success:
        raise HTTPException(status_code=404, detail="Account not found")
    return {"success": True}


@app.post("/api/accounts/{account_id}/test")
async def test_account(account_id: str):
    try:
        provider = account_manager.get_provider(account_id)
        valid = await provider.test_connection()
        return {"success": valid}
    except Exception as e:
        return {"success": False, "error": str(e)}


# --- FILE OPERATIONS ---
@app.get("/api/files/list")
async def list_files(
    account_id: str = Query(...),
    path: str = Query("/"),
    passphrase: Optional[str] = Query(None)
):
    try:
        provider = account_manager.get_provider(account_id)
        items = await provider.list_dir(path)
        
        # Transparently decode encrypted file names if passphrase provided
        results = []
        for item in items:
            item_dict = item.model_dump()
            if passphrase and item.is_encrypted:
                try:
                    decrypted_name = decrypt_filename(item.name, passphrase)
                    if decrypted_name != item.name:
                        item_dict["display_name"] = decrypted_name
                except Exception:
                    pass
            results.append(item_dict)
            
        return {"path": path, "items": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class MkdirRequest(BaseModel):
    account_id: str
    path: str


@app.post("/api/files/mkdir")
async def create_folder(req: MkdirRequest):
    try:
        provider = account_manager.get_provider(req.account_id)
        success = await provider.create_dir(req.path)
        return {"success": success}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class DeleteRequest(BaseModel):
    account_id: str
    path: str
    is_dir: bool = False


@app.post("/api/files/delete")
async def delete_item(req: DeleteRequest):
    try:
        provider = account_manager.get_provider(req.account_id)
        success = await provider.delete(req.path, req.is_dir)
        return {"success": success}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class RenameRequest(BaseModel):
    account_id: str
    old_path: str
    new_path: str


@app.post("/api/files/rename")
async def rename_item(req: RenameRequest):
    try:
        provider = account_manager.get_provider(req.account_id)
        success = await provider.rename(req.old_path, req.new_path)
        return {"success": success}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/files/upload")
async def upload_file(
    account_id: str = Form(...),
    path: str = Form(...),
    encrypt: bool = Form(False),
    passphrase: Optional[str] = Form(None),
    file: UploadFile = File(...)
):
    try:
        provider = account_manager.get_provider(account_id)
        content = await file.read()
        filename = file.filename

        if encrypt and passphrase:
            content = encrypt_bytes(content, passphrase)
            filename = encrypt_filename(filename, passphrase)

        target_path = f"{path.rstrip('/')}/{filename}".replace("//", "/")
        success = await provider.write_bytes(target_path, content)
        return {"success": success, "filename": filename, "size": len(content)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/files/download")
async def download_file(
    account_id: str = Query(...),
    path: str = Query(...),
    decrypt: bool = Query(False),
    passphrase: Optional[str] = Query(None)
):
    try:
        provider = account_manager.get_provider(account_id)
        content = await provider.read_bytes(path)
        filename = path.rstrip("/").split("/")[-1]

        if decrypt and passphrase and is_encrypted_file(content[:8]):
            content = decrypt_bytes(content, passphrase)
            decrypted_name = decrypt_filename(filename, passphrase)
            if decrypted_name != filename:
                filename = decrypted_name

        return Response(
            content=content,
            media_type="application/octet-stream",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/files/share-link")
async def get_share_link(
    account_id: str = Query(...),
    path: str = Query(...)
):
    try:
        provider = account_manager.get_provider(account_id)
        if hasattr(provider, "get_share_link"):
            link = provider.get_share_link(path)
            if link:
                return {"success": True, "share_link": link, "filename": path.rstrip("/").split("/")[-1]}
        
        # Fallback to direct download URL
        return {
            "success": True,
            "share_link": f"/api/files/download?account_id={account_id}&path={path}",
            "filename": path.rstrip("/").split("/")[-1]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- TRANSFERS & QUEUE ---
class CreateTransferRequest(BaseModel):
    source_account_id: str
    source_path: str
    target_account_id: str
    target_path: str
    filename: str
    size: int = 0
    encrypt_on_upload: bool = False
    decrypt_on_download: bool = False
    passphrase: Optional[str] = None


@app.post("/api/transfers")
def create_transfer(req: CreateTransferRequest):
    job = transfer_manager.add_job(
        source_account_id=req.source_account_id,
        source_path=req.source_path,
        target_account_id=req.target_account_id,
        target_path=req.target_path,
        filename=req.filename,
        size=req.size,
        encrypt_on_upload=req.encrypt_on_upload,
        decrypt_on_download=req.decrypt_on_download,
        passphrase=req.passphrase
    )
    return job


@app.get("/api/transfers")
def list_transfers():
    return {
        "jobs": transfer_manager.list_jobs(),
        "speed_limit_bps": transfer_manager.speed_limit_bytes_per_sec,
        "max_concurrent": transfer_manager.max_concurrent_jobs
    }


@app.post("/api/transfers/{job_id}/pause")
def pause_transfer(job_id: str):
    return {"success": transfer_manager.pause_job(job_id)}


@app.post("/api/transfers/{job_id}/resume")
def resume_transfer(job_id: str):
    return {"success": transfer_manager.resume_job(job_id)}


@app.post("/api/transfers/{job_id}/cancel")
def cancel_transfer(job_id: str):
    return {"success": transfer_manager.cancel_job(job_id)}


@app.post("/api/transfers/clear")
def clear_transfers():
    transfer_manager.clear_completed()
    return {"success": True}


class TransferSettingsRequest(BaseModel):
    speed_limit_kbps: Optional[int] = None
    concurrency: Optional[int] = None


@app.post("/api/transfers/settings")
def update_transfer_settings(req: TransferSettingsRequest):
    if req.speed_limit_kbps is not None:
        transfer_manager.set_speed_limit(req.speed_limit_kbps * 1024)
    if req.concurrency is not None:
        transfer_manager.set_concurrency(req.concurrency)
    return {
        "speed_limit_bps": transfer_manager.speed_limit_bytes_per_sec,
        "max_concurrent": transfer_manager.max_concurrent_jobs
    }


# --- SYNCHRONIZATION ---
class SyncAnalyzeRequest(BaseModel):
    source_account_id: str
    source_path: str
    target_account_id: str
    target_path: str
    mode: str = "mirror"


@app.post("/api/sync/analyze")
async def analyze_sync(req: SyncAnalyzeRequest):
    try:
        analysis = await sync_engine.analyze(
            source_account_id=req.source_account_id,
            source_path=req.source_path,
            target_account_id=req.target_account_id,
            target_path=req.target_path,
            mode=req.mode
        )
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class SyncExecuteRequest(BaseModel):
    analysis: Dict[str, Any]
    encrypt_on_upload: bool = False
    passphrase: Optional[str] = None


@app.post("/api/sync/execute")
async def execute_sync(req: SyncExecuteRequest):
    try:
        result = await sync_engine.execute(
            analysis=req.analysis,
            encrypt_on_upload=req.encrypt_on_upload,
            passphrase=req.passphrase
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- MULTI-CLOUD SEARCH ---
@app.get("/api/search")
async def multi_cloud_search(
    q: str = Query(...),
    account_ids: Optional[str] = Query(None)
):
    try:
        acc_list = account_ids.split(",") if account_ids else None
        results = await search_engine.search_all(query=q, account_ids=acc_list)
        return {"query": q, "total": len(results), "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


import sys
from pathlib import Path
from fastapi.staticfiles import StaticFiles

# Serve built frontend if available
if getattr(sys, 'frozen', False):
    dist_dir = Path(sys._MEIPASS) / "frontend" / "dist"
else:
    dist_dir = Path(__file__).resolve().parent.parent / "frontend" / "dist"

if dist_dir.exists():
    app.mount("/", StaticFiles(directory=str(dist_dir), html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=DEFAULT_HOST, port=DEFAULT_PORT, reload=True)
