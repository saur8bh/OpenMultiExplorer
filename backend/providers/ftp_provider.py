import io
import ftplib
from typing import List, Optional, Dict, Any
from backend.providers.base import StorageProvider, StorageItem


class FTPProvider(StorageProvider):
    """Standard FTP / FTPS Provider."""

    def __init__(self, account_config: Dict[str, Any]):
        super().__init__(account_config)
        self.host = account_config.get("host", "localhost")
        self.port = int(account_config.get("port", 21))
        self.username = account_config.get("username", "anonymous")
        self.password = account_config.get("password", "")
        self.use_tls = account_config.get("use_tls", False)

    def _get_ftp(self):
        if self.use_tls:
            ftp = ftplib.FTP_TLS()
        else:
            ftp = ftplib.FTP()
        ftp.connect(self.host, self.port, timeout=15)
        ftp.login(self.username, self.password)
        if self.use_tls:
            ftp.prot_p()
        return ftp

    async def test_connection(self) -> bool:
        try:
            ftp = self._get_ftp()
            ftp.quit()
            return True
        except Exception:
            return False

    async def list_dir(self, path: str = "/") -> List[StorageItem]:
        items: List[StorageItem] = []
        try:
            ftp = self._get_ftp()
            ftp.cwd(path or "/")
            
            lines = []
            ftp.dir(lines.append)
            
            for line in lines:
                parts = line.split()
                if not parts:
                    continue
                is_dir = parts[0].startswith("d")
                name = parts[-1]
                if name in (".", ".."):
                    continue
                size = int(parts[4]) if len(parts) > 4 and parts[4].isdigit() else 0
                item_path = f"/{path.strip('/')}/{name}".replace("//", "/")
                encrypted = name.startswith("enc__") and name.endswith(".omex")
                items.append(
                    StorageItem(
                        name=name,
                        path=item_path,
                        is_dir=is_dir,
                        size=size,
                        modified=" ".join(parts[5:8]) if len(parts) >= 8 else "",
                        is_encrypted=encrypted,
                        account_id=self.account_id,
                        account_name=self.account_name,
                        account_type=self.account_type,
                    )
                )
            ftp.quit()
        except Exception:
            return []

        items.sort(key=lambda x: (not x.is_dir, x.name.lower()))
        return items

    async def create_dir(self, path: str) -> bool:
        try:
            ftp = self._get_ftp()
            ftp.mkd(path)
            ftp.quit()
            return True
        except Exception:
            return False

    async def delete(self, path: str, is_dir: bool = False) -> bool:
        try:
            ftp = self._get_ftp()
            if is_dir:
                ftp.rmd(path)
            else:
                ftp.delete(path)
            ftp.quit()
            return True
        except Exception:
            return False

    async def rename(self, old_path: str, new_path: str) -> bool:
        try:
            ftp = self._get_ftp()
            ftp.rename(old_path, new_path)
            ftp.quit()
            return True
        except Exception:
            return False

    async def read_bytes(self, path: str) -> bytes:
        ftp = self._get_ftp()
        buffer = io.BytesIO()
        ftp.retrbinary(f"RETR {path}", buffer.write)
        ftp.quit()
        return buffer.getvalue()

    async def write_bytes(self, path: str, data: bytes) -> bool:
        ftp = self._get_ftp()
        buffer = io.BytesIO(data)
        ftp.storbinary(f"STOR {path}", buffer)
        ftp.quit()
        return True

    async def get_metadata(self, path: str) -> Optional[StorageItem]:
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
