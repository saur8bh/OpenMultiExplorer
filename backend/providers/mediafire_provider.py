"""
Live MediaFire Cloud Storage Provider for OpenMultiExplorer.
Powered by MediaFireApi with real-time session token authentication,
multi-chunk pagination (supporting large directories with 600+ files),
and direct file stream resolution.
"""

import os
import re
import time
import urllib.request
import ssl
from typing import List, Optional, Dict, Any
from pathlib import Path

from mediafire import MediaFireApi, MediaFireApiError

from backend.providers.base import StorageProvider, StorageItem
from backend.config import APP_DIR
from backend.crypto import is_encrypted_file

DEFAULT_APP_ID = "42511"


class MediaFireProvider(StorageProvider):
    """
    Live MediaFire Storage Provider.
    Connects to user's real MediaFire account, browses cloud files & folders,
    and supports downloads and uploads.
    """

    def __init__(self, account_config: Dict[str, Any]):
        super().__init__(account_config)
        self.email = account_config.get("email", "").strip()
        self.password = account_config.get("password", "").strip()
        self.app_id = str(account_config.get("app_id") or DEFAULT_APP_ID).strip()
        
        self.api = MediaFireApi()
        self.session_data: Optional[Dict[str, Any]] = None
        self.session_time: float = 0

        # Caches
        self._folder_cache: Dict[str, str] = {"/": "myfiles"}
        self._file_cache: Dict[str, Dict[str, Any]] = {}  # path -> file dict (quickkey, links, etc.)

        # Sandbox fallback only if no credentials provided
        self.sandbox_dir = APP_DIR / "mediafire_stores" / self.account_id
        self.sandbox_dir.mkdir(parents=True, exist_ok=True)

    def _ensure_authenticated(self):
        """Authenticates with MediaFire using user's real email and password."""
        if not self.email or not self.password:
            return False

        # Reuse session if valid (10 min expiry)
        if self.session_data and (time.time() - self.session_time < 500):
            return True

        try:
            self.session_data = self.api.user_get_session_token(
                app_id=self.app_id,
                email=self.email,
                password=self.password
            )
            self.api.session = self.session_data
            self.session_time = time.time()
            return True
        except Exception as e:
            print(f"[MediaFireProvider] Auth failed for {self.email}: {e}")
            return False

    def get_user_display_name(self) -> Optional[str]:
        if self._ensure_authenticated():
            try:
                info = self.api.user_get_info()
                u_info = info.get("user_info", {})
                display_name = u_info.get("display_name")
                if not display_name:
                    first = u_info.get("first_name", "")
                    last = u_info.get("last_name", "")
                    display_name = f"{first} {last}".strip()
                if display_name:
                    return display_name
            except Exception as e:
                print(f"[MediaFireProvider] user_get_info error: {e}")
        return None

    async def test_connection(self) -> bool:
        if not self.email or not self.password:
            return True
        return self._ensure_authenticated()

    async def list_dir(self, path: str = "/") -> List[StorageItem]:
        items: List[StorageItem] = []

        # If user has real email and password, fetch LIVE files from MediaFire
        if self.email and self.password and self._ensure_authenticated():
            try:
                norm_path = "/" + path.strip("/")
                folder_key = self._folder_cache.get(norm_path, "myfiles")

                # 1. Fetch subfolders
                try:
                    folder_res = self.api.folder_get_content(
                        folder_key=folder_key,
                        content_type="folders",
                        chunk=1
                    )
                    fc_folders = folder_res.get("folder_content", {}).get("folders", [])
                    for fd in fc_folders:
                        name = fd.get("name", "Untitled")
                        fkey = fd.get("folderkey", "")
                        sub_path = f"{norm_path.rstrip('/')}/{name}".replace("//", "/")
                        self._folder_cache[sub_path] = fkey
                        items.append(
                            StorageItem(
                                name=name,
                                path=sub_path,
                                is_dir=True,
                                size=0,
                                modified=fd.get("created", ""),
                                is_encrypted=False,
                                account_id=self.account_id,
                                account_name=self.account_name,
                                account_type=self.account_type,
                            )
                        )
                except Exception as ef:
                    print(f"[MediaFireProvider] Error getting folders: {ef}")

                # 2. Fetch files with full pagination across all chunks
                chunk = 1
                while True:
                    files_res = self.api.folder_get_content(
                        folder_key=folder_key,
                        content_type="files",
                        chunk=chunk
                    )
                    fc_data = files_res.get("folder_content", {})
                    files = fc_data.get("files", [])
                    
                    for fl in files:
                        name = fl.get("filename", "")
                        quickkey = fl.get("quickkey", "")
                        file_path = f"{norm_path.rstrip('/')}/{name}".replace("//", "/")
                        size = int(fl.get("size", 0))
                        modified = fl.get("created", "")
                        encrypted = name.startswith("enc__") and name.endswith(".omex")

                        # Cache file metadata for quick downloads
                        public_link = f"https://www.mediafire.com/file/{quickkey}/{name}/file"
                        self._file_cache[file_path] = {
                            "quickkey": quickkey,
                            "filename": name,
                            "size": size,
                            "public_link": public_link,
                            "links": fl.get("links", {})
                        }

                        items.append(
                            StorageItem(
                                name=name,
                                path=file_path,
                                is_dir=False,
                                size=size,
                                modified=modified,
                                is_encrypted=encrypted,
                                account_id=self.account_id,
                                account_name=self.account_name,
                                account_type=self.account_type,
                                public_link=public_link,
                            )
                        )

                    # Check if more chunks exist
                    if fc_data.get("more_chunks") != "yes" or len(files) == 0:
                        break
                    chunk += 1

                items.sort(key=lambda x: (not x.is_dir, x.name.lower()))
                return items
            except Exception as e:
                print(f"[MediaFireProvider] Live listing failed: {e}")

        # Fallback to local sandbox if no credentials or error
        target = self.sandbox_dir / path.strip("/").replace("\\", "/")
        if not target.exists() or not target.is_dir():
            return items

        try:
            with os.scandir(target) as entries:
                for entry in entries:
                    stat = entry.stat()
                    is_dir = entry.is_dir()
                    size = stat.st_size if not is_dir else 0
                    modified = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(stat.st_mtime))
                    encrypted = False
                    if not is_dir and size >= 8:
                        try:
                            with open(entry.path, "rb") as f:
                                encrypted = is_encrypted_file(f.read(8))
                        except Exception:
                            pass
                    rel = str(Path(entry.path).relative_to(self.sandbox_dir)).replace("\\", "/")
                    items.append(
                        StorageItem(
                            name=entry.name,
                            path=f"/{rel}",
                            is_dir=is_dir,
                            size=size,
                            modified=modified,
                            is_encrypted=encrypted,
                            account_id=self.account_id,
                            account_name=self.account_name,
                            account_type=self.account_type,
                        )
                    )
        except Exception:
            return []

        items.sort(key=lambda x: (not x.is_dir, x.name.lower()))
        return items

    async def create_dir(self, path: str) -> bool:
        if self._ensure_authenticated():
            try:
                parts = path.strip("/").split("/")
                folder_name = parts[-1]
                parent_path = "/" + "/".join(parts[:-1]) if len(parts) > 1 else "/"
                parent_key = self._folder_cache.get(parent_path, "myfiles")
                res = self.api.folder_create(foldername=folder_name, parent_key=parent_key)
                if res.get("result") == "Success":
                    new_key = res.get("folder_key")
                    if new_key:
                        self._folder_cache[path] = new_key
                    return True
            except Exception as e:
                print(f"[MediaFireProvider] folder_create error: {e}")

        # Fallback local
        target = self.sandbox_dir / path.strip("/").replace("\\", "/")
        target.mkdir(parents=True, exist_ok=True)
        return True

    async def delete(self, path: str, is_dir: bool = False) -> bool:
        if self._ensure_authenticated():
            try:
                norm_path = "/" + path.strip("/")
                if is_dir:
                    fkey = self._folder_cache.get(norm_path)
                    if fkey:
                        self.api.folder_delete(fkey)
                        return True
                else:
                    file_info = self._file_cache.get(norm_path)
                    quickkey = file_info.get("quickkey") if file_info else None
                    if quickkey:
                        self.api.file_delete(quickkey)
                        return True
            except Exception as e:
                print(f"[MediaFireProvider] delete error: {e}")

        # Fallback local
        target = self.sandbox_dir / path.strip("/").replace("\\", "/")
        if not target.exists():
            return False
        if target.is_dir():
            import shutil
            shutil.rmtree(target)
        else:
            target.unlink()
        return True

    async def rename(self, old_path: str, new_path: str) -> bool:
        norm_old = "/" + old_path.strip("/")
        new_name = new_path.strip("/").split("/")[-1]
        if self._ensure_authenticated():
            try:
                file_info = self._file_cache.get(norm_old)
                if file_info and "quickkey" in file_info:
                    self.api.file_update(file_info["quickkey"], filename=new_name)
                    return True
            except Exception as e:
                print(f"[MediaFireProvider] rename error: {e}")

        # Fallback local
        src = self.sandbox_dir / old_path.strip("/").replace("\\", "/")
        dst = self.sandbox_dir / new_path.strip("/").replace("\\", "/")
        dst.parent.mkdir(parents=True, exist_ok=True)
        src.rename(dst)
        return True

    def get_share_link(self, path: str) -> Optional[str]:
        norm_path = "/" + path.strip("/")
        filename = norm_path.split("/")[-1]
        file_info = self._file_cache.get(norm_path)
        if file_info and file_info.get("public_link"):
            return file_info["public_link"]
        quickkey = file_info.get("quickkey") if file_info else None
        if not quickkey:
            for p, fi in self._file_cache.items():
                if fi.get("filename") == filename:
                    quickkey = fi.get("quickkey")
                    break
        if not quickkey and self._ensure_authenticated():
            try:
                chunk = 1
                while True:
                    res = self.api.folder_get_content(folder_key="myfiles", content_type="files", chunk=chunk)
                    fc = res.get("folder_content", {})
                    files = fc.get("files", [])
                    for fl in files:
                        if fl.get("filename") == filename:
                            quickkey = fl.get("quickkey")
                            break
                    if quickkey or fc.get("more_chunks") != "yes" or len(files) == 0:
                        break
                    chunk += 1
            except Exception:
                pass

        if quickkey:
            return f"https://www.mediafire.com/file/{quickkey}/{filename}/file"
        return None

    async def read_bytes(self, path: str) -> bytes:
        norm_path = "/" + path.strip("/")
        if self._ensure_authenticated():
            try:
                file_info = self._file_cache.get(norm_path)
                quickkey = file_info.get("quickkey") if file_info else None
                if not quickkey:
                    # Look up by filename in cache or list parent folder
                    filename = norm_path.split("/")[-1]
                    for p, fi in self._file_cache.items():
                        if fi.get("filename") == filename:
                            quickkey = fi.get("quickkey")
                            break
                if not quickkey:
                    await self.list_dir("/".join(norm_path.split("/")[:-1]) or "/")
                    for p, fi in self._file_cache.items():
                        if fi.get("filename") == norm_path.split("/")[-1]:
                            quickkey = fi.get("quickkey")
                            break

                if quickkey:
                    # Request direct download link
                    links = self.api.file_get_links(quick_key=quickkey, link_type="direct_download")
                    link_obj = links.get("links", [{}])[0]
                    direct_dl = link_obj.get("direct_download")

                    if not direct_dl:
                        # Fallback to normal_download
                        norm_links = self.api.file_get_links(quick_key=quickkey, link_type="normal_download")
                        direct_dl = norm_links.get("links", [{}])[0].get("normal_download")

                    if direct_dl:
                        # Use HTTP for mediafire CDN to avoid Windows OpenSSL connection resets
                        if direct_dl.startswith("https://download"):
                            direct_dl = "http://" + direct_dl[8:]

                        headers = {
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                            "Referer": "https://www.mediafire.com/"
                        }
                        req = urllib.request.Request(direct_dl, headers=headers)
                        with urllib.request.urlopen(req, timeout=30) as r:
                            return r.read()
            except Exception as e:
                print(f"[MediaFireProvider] read_bytes live download failed: {e}")

        # Local fallback
        target = self.sandbox_dir / path.strip("/").replace("\\", "/")
        with open(target, "rb") as f:
            return f.read()

    async def write_bytes(self, path: str, data: bytes) -> bool:
        if self._ensure_authenticated():
            try:
                import tempfile
                parts = path.strip("/").split("/")
                filename = parts[-1]
                parent_path = "/" + "/".join(parts[:-1]) if len(parts) > 1 else "/"
                parent_key = self._folder_cache.get(parent_path, "myfiles")

                with tempfile.NamedTemporaryFile(delete=False) as tf:
                    tf.write(data)
                    tmp_name = tf.name

                try:
                    self.api.upload_simple(tmp_name, folder_key=parent_key, filename=filename)
                    return True
                finally:
                    if os.path.exists(tmp_name):
                        os.unlink(tmp_name)
            except Exception as e:
                print(f"[MediaFireProvider] upload error: {e}")

        # Local fallback
        target = self.sandbox_dir / path.strip("/").replace("\\", "/")
        target.parent.mkdir(parents=True, exist_ok=True)
        with open(target, "wb") as f:
            f.write(data)
        return True

    async def get_metadata(self, path: str) -> Optional[StorageItem]:
        norm_path = "/" + path.strip("/")
        if norm_path in self._file_cache:
            info = self._file_cache[norm_path]
            return StorageItem(
                name=info.get("filename", norm_path.split("/")[-1]),
                path=norm_path,
                is_dir=False,
                size=info.get("size", 0),
                account_id=self.account_id,
                account_name=self.account_name,
                account_type=self.account_type,
            )
        name = path.strip("/").split("/")[-1]
        return StorageItem(
            name=name,
            path=path,
            is_dir=False,
            size=0,
            account_id=self.account_id,
            account_name=self.account_name,
            account_type=self.account_type,
        )
