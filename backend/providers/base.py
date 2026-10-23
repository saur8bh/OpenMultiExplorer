from abc import ABC, abstractmethod
from typing import List, Optional, AsyncGenerator, Dict, Any
from pydantic import BaseModel


class StorageItem(BaseModel):
    name: str
    path: str
    is_dir: bool
    size: int = 0
    modified: str = ""
    is_encrypted: bool = False
    display_name: Optional[str] = None
    account_id: Optional[str] = None
    account_name: Optional[str] = None
    account_type: Optional[str] = None
    public_link: Optional[str] = None


class StorageProvider(ABC):
    """Abstract Base Class for all cloud and local storage providers."""

    def __init__(self, account_config: Dict[str, Any]):
        self.config = account_config
        self.account_id = account_config.get("id", "")
        self.account_name = account_config.get("name", "")
        self.account_type = account_config.get("type", "local")

    @abstractmethod
    async def test_connection(self) -> bool:
        """Verify that credentials and endpoints are valid and reachable."""
        pass

    @abstractmethod
    async def list_dir(self, path: str = "/") -> List[StorageItem]:
        """List contents of a directory."""
        pass

    @abstractmethod
    async def create_dir(self, path: str) -> bool:
        """Create a new folder / directory."""
        pass

    @abstractmethod
    async def delete(self, path: str, is_dir: bool = False) -> bool:
        """Delete a file or folder."""
        pass

    @abstractmethod
    async def rename(self, old_path: str, new_path: str) -> bool:
        """Rename or move a file or folder."""
        pass

    @abstractmethod
    async def read_bytes(self, path: str) -> bytes:
        """Read the full content of a file."""
        pass

    @abstractmethod
    async def write_bytes(self, path: str, data: bytes) -> bool:
        """Write bytes to a file."""
        pass

    @abstractmethod
    async def get_metadata(self, path: str) -> Optional[StorageItem]:
        """Get file or directory metadata."""
        pass
