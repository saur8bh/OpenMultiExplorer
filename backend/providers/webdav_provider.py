import xml.etree.ElementTree as ET
from urllib.parse import urljoin, unquote, urlparse
from typing import List, Optional, Dict, Any
import httpx

from backend.providers.base import StorageProvider, StorageItem


class WebDAVProvider(StorageProvider):
    """WebDAV Provider (Nextcloud, ownCloud, 4shared, TeraCloud, Koofr, etc.)."""

    def __init__(self, account_config: Dict[str, Any]):
        super().__init__(account_config)
        self.url = account_config.get("url", "").rstrip("/")
        self.username = account_config.get("username", "")
        self.password = account_config.get("password", "")
        self.auth = (self.username, self.password) if self.username else None

    async def test_connection(self) -> bool:
        try:
            async with httpx.AsyncClient(auth=self.auth, verify=False, timeout=10.0) as client:
                res = await client.request("PROPFIND", self.url + "/", headers={"Depth": "0"})
                return res.status_code in (200, 207)
        except Exception:
            return False

    def _full_url(self, path: str) -> str:
        clean = path.strip("/")
        if not clean:
            return self.url + "/"
        return f"{self.url}/{clean}"

    async def list_dir(self, path: str = "/") -> List[StorageItem]:
        items: List[StorageItem] = []
        target_url = self._full_url(path)
        if not target_url.endswith("/"):
            target_url += "/"

        try:
            headers = {"Depth": "1"}
            async with httpx.AsyncClient(auth=self.auth, verify=False, timeout=15.0) as client:
                res = await client.request("PROPFIND", target_url, headers=headers)
                if res.status_code not in (200, 207):
                    return []

                # Parse XML response
                root = ET.fromstring(res.text)
                for response_el in root.findall(".//{DAV:}response"):
                    href_el = response_el.find("{DAV:}href")
                    if href_el is None or not href_el.text:
                        continue
                    href = unquote(href_el.text)
                    href_path = urlparse(href).path.rstrip("/")
                    target_path = urlparse(target_url).path.rstrip("/")

                    # Skip self directory
                    if href_path == target_path or href_path == "":
                        continue

                    name = href_path.split("/")[-1]
                    if not name:
                        continue

                    # Check is_dir
                    resourcetype = response_el.find(".//{DAV:}resourcetype")
                    is_dir = resourcetype is not None and resourcetype.find("{DAV:}collection") is not None

                    # Size
                    getcontentlength = response_el.find(".//{DAV:}getcontentlength")
                    size = int(getcontentlength.text) if getcontentlength is not None and getcontentlength.text else 0

                    # Modified
                    getlastmodified = response_el.find(".//{DAV:}getlastmodified")
                    modified = getlastmodified.text if getlastmodified is not None else ""

                    encrypted = name.startswith("enc__") and name.endswith(".omex")
                    
                    item_rel_path = f"/{path.strip('/')}/{name}".replace("//", "/")
                    items.append(
                        StorageItem(
                            name=name,
                            path=item_rel_path,
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
        target_url = self._full_url(path)
        try:
            async with httpx.AsyncClient(auth=self.auth, verify=False, timeout=10.0) as client:
                res = await client.request("MKCOL", target_url)
                return res.status_code in (200, 201)
        except Exception:
            return False

    async def delete(self, path: str, is_dir: bool = False) -> bool:
        target_url = self._full_url(path)
        try:
            async with httpx.AsyncClient(auth=self.auth, verify=False, timeout=10.0) as client:
                res = await client.delete(target_url)
                return res.status_code in (200, 204)
        except Exception:
            return False

    async def rename(self, old_path: str, new_path: str) -> bool:
        src_url = self._full_url(old_path)
        dst_url = self._full_url(new_path)
        try:
            async with httpx.AsyncClient(auth=self.auth, verify=False, timeout=10.0) as client:
                res = await client.request("MOVE", src_url, headers={"Destination": dst_url, "Overwrite": "T"})
                return res.status_code in (200, 201, 204)
        except Exception:
            return False

    async def read_bytes(self, path: str) -> bytes:
        target_url = self._full_url(path)
        async with httpx.AsyncClient(auth=self.auth, verify=False, timeout=30.0) as client:
            res = await client.get(target_url)
            res.raise_for_status()
            return res.content

    async def write_bytes(self, path: str, data: bytes) -> bool:
        target_url = self._full_url(path)
        async with httpx.AsyncClient(auth=self.auth, verify=False, timeout=30.0) as client:
            res = await client.put(target_url, content=data)
            return res.status_code in (200, 201, 204)

    async def get_metadata(self, path: str) -> Optional[StorageItem]:
        # Return basic item
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
