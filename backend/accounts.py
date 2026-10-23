import json
import uuid
from typing import Dict, List, Optional, Any
from pathlib import Path

from backend.config import ACCOUNTS_FILE
from backend.providers.base import StorageProvider
from backend.providers.local_provider import LocalProvider
from backend.providers.s3_provider import S3Provider
from backend.providers.webdav_provider import WebDAVProvider
from backend.providers.ftp_provider import FTPProvider
from backend.providers.mediafire_provider import MediaFireProvider
from backend.providers.cloud_generic import CloudGenericProvider

SUPPORTED_PROVIDERS = [
    {
        "type": "local",
        "name": "Local Computer",
        "category": "Local",
        "icon": "hard-drive",
        "verified": True,
        "description": "Browse local hard drives, USB drives, and folders",
        "fields": [
            {"key": "root_path", "label": "Root Folder (Leave blank for all drives)", "type": "text", "required": False}
        ]
    },
    {
        "type": "mediafire",
        "name": "MediaFire",
        "category": "Consumer Cloud",
        "icon": "flame",
        "verified": True,
        "description": "MediaFire cloud storage and high-speed file hosting (Live API tested)",
        "fields": [
            {"key": "email", "label": "MediaFire Account Email", "type": "text", "required": True},
            {"key": "password", "label": "MediaFire Password", "type": "password", "required": True},
            {"key": "app_id", "label": "Application ID (optional, defaults to official ID)", "type": "text", "required": False},
            {"key": "api_key", "label": "API Key (optional, defaults to official key)", "type": "password", "required": False}
        ]
    },
    {
        "type": "gdrive",
        "name": "Google Drive",
        "category": "Consumer Cloud",
        "icon": "cloud",
        "description": "Google Drive cloud storage (Personal / Workspace)",
        "fields": [
            {"key": "client_id", "label": "Client ID (optional)", "type": "text", "required": False},
            {"key": "client_secret", "label": "Client Secret (optional)", "type": "password", "required": False}
        ]
    },
    {
        "type": "onedrive",
        "name": "Microsoft OneDrive",
        "category": "Consumer Cloud",
        "icon": "cloud",
        "description": "OneDrive & OneDrive for Business",
        "fields": [
            {"key": "account_type", "label": "Account Type (Personal / Business)", "type": "text", "default": "personal"}
        ]
    },
    {
        "type": "dropbox",
        "name": "Dropbox",
        "category": "Consumer Cloud",
        "icon": "box",
        "description": "Dropbox Personal or Business storage",
        "fields": []
    },
    {
        "type": "mega",
        "name": "MEGA",
        "category": "Consumer Cloud",
        "icon": "cloud",
        "description": "MEGA Encrypted cloud storage",
        "fields": [
            {"key": "email", "label": "Email", "type": "text", "required": True},
            {"key": "password", "label": "Password", "type": "password", "required": True}
        ]
    },
    {
        "type": "box",
        "name": "Box",
        "category": "Enterprise Cloud",
        "icon": "box",
        "description": "Box.com enterprise cloud storage",
        "fields": []
    },
    {
        "type": "s3",
        "name": "Amazon S3",
        "category": "Object Storage",
        "icon": "database",
        "description": "AWS S3 and compatible object storage",
        "fields": [
            {"key": "access_key", "label": "Access Key ID", "type": "text", "required": True},
            {"key": "secret_key", "label": "Secret Access Key", "type": "password", "required": True},
            {"key": "region", "label": "Region", "type": "text", "default": "us-east-1"},
            {"key": "bucket", "label": "Bucket (leave empty to list all)", "type": "text", "required": False},
            {"key": "endpoint_url", "label": "Custom Endpoint URL (for Wasabi, MinIO, B2)", "type": "text", "required": False}
        ]
    },
    {
        "type": "wasabi",
        "name": "Wasabi Cloud",
        "category": "Object Storage",
        "icon": "database",
        "description": "Wasabi hot cloud storage",
        "fields": [
            {"key": "access_key", "label": "Access Key", "type": "text", "required": True},
            {"key": "secret_key", "label": "Secret Key", "type": "password", "required": True},
            {"key": "region", "label": "Region", "type": "text", "default": "us-east-1"},
            {"key": "bucket", "label": "Bucket", "type": "text", "required": False}
        ]
    },
    {
        "type": "backblaze",
        "name": "Backblaze B2",
        "category": "Object Storage",
        "icon": "database",
        "description": "Backblaze B2 S3-compatible cloud storage",
        "fields": [
            {"key": "access_key", "label": "Key ID", "type": "text", "required": True},
            {"key": "secret_key", "label": "Application Key", "type": "password", "required": True},
            {"key": "endpoint_url", "label": "S3 Endpoint URL", "type": "text", "required": True},
            {"key": "bucket", "label": "Bucket", "type": "text", "required": False}
        ]
    },
    {
        "type": "webdav",
        "name": "WebDAV (Nextcloud / ownCloud)",
        "category": "Protocols",
        "icon": "server",
        "description": "WebDAV, Nextcloud, ownCloud, Koofr, TeraCloud",
        "fields": [
            {"key": "url", "label": "WebDAV URL", "type": "text", "required": True},
            {"key": "username", "label": "Username", "type": "text", "required": False},
            {"key": "password", "label": "Password / App Token", "type": "password", "required": False}
        ]
    },
    {
        "type": "ftp",
        "name": "FTP / FTPS",
        "category": "Protocols",
        "icon": "server",
        "description": "File Transfer Protocol with optional TLS",
        "fields": [
            {"key": "host", "label": "Host / Server", "type": "text", "required": True},
            {"key": "port", "label": "Port (default: 21)", "type": "number", "default": 21},
            {"key": "username", "label": "Username", "type": "text", "default": "anonymous"},
            {"key": "password", "label": "Password", "type": "password", "required": False},
            {"key": "use_tls", "label": "Use FTPS (TLS)", "type": "checkbox", "default": False}
        ]
    },
    {
        "type": "pcloud",
        "name": "pCloud",
        "category": "Consumer Cloud",
        "icon": "cloud",
        "description": "pCloud encrypted Swiss cloud storage",
        "fields": []
    },
    {
        "type": "yandex",
        "name": "Yandex Disk",
        "category": "Consumer Cloud",
        "icon": "cloud",
        "description": "Yandex Disk cloud storage",
        "fields": []
    }
]


class AccountManager:
    def __init__(self):
        self.accounts: List[Dict[str, Any]] = []
        self._provider_cache: Dict[str, StorageProvider] = {}
        self.load()

    def load(self):
        if ACCOUNTS_FILE.exists():
            try:
                with open(ACCOUNTS_FILE, "r", encoding="utf-8") as f:
                    raw_accounts = json.load(f)
            except Exception:
                raw_accounts = []
            
            # Remove all dummy/demo pre-saved accounts; keep only This PC and user-added accounts
            self.accounts = [a for a in raw_accounts if not a.get("id", "").startswith("demo-")]
        else:
            self.accounts = []

        # Ensure "This PC" is present
        if not any(a.get("id") == "local-pc" for a in self.accounts):
            self.accounts.insert(0, {
                "id": "local-pc",
                "name": "This PC",
                "type": "local",
                "root_path": "",
                "color": "#3B82F6",
            })

        self.save()

    def save(self):
        with open(ACCOUNTS_FILE, "w", encoding="utf-8") as f:
            json.dump(self.accounts, f, indent=2)

    def list_accounts(self) -> List[Dict[str, Any]]:
        # Return accounts without leaking raw secrets in list, formatting names nicely
        sanitized = []
        needs_save = False

        for acc in self.accounts:
            copy_acc = dict(acc)
            acc_type = copy_acc.get("type", "local")

            # 1. MediaFire: auto-fetch account display name
            if acc_type == "mediafire" and copy_acc.get("email") and copy_acc.get("password"):
                if not copy_acc.get("display_name"):
                    try:
                        provider = self.get_provider(copy_acc["id"])
                        if hasattr(provider, "get_user_display_name"):
                            disp = provider.get_user_display_name()
                            if disp:
                                copy_acc["display_name"] = disp
                                acc["display_name"] = disp
                                # If name was default or generic, use the real display name
                                if not acc.get("name") or acc["name"] in ("GPLASTR", "MediaFire Account", "MediaFire (Cloud)", "New MEDIAFIRE"):
                                    acc["name"] = disp
                                    copy_acc["name"] = disp
                                needs_save = True
                    except Exception:
                        pass
                else:
                    if not acc.get("name") or acc["name"] in ("GPLASTR", "MediaFire Account", "MediaFire (Cloud)", "New MEDIAFIRE"):
                        acc["name"] = copy_acc["display_name"]
                        copy_acc["name"] = copy_acc["display_name"]

            # 2. MEGA: show email
            elif acc_type == "mega":
                email = copy_acc.get("email", "")
                if email:
                    copy_acc["subtitle"] = email
                    if not copy_acc.get("name") or copy_acc["name"] in ("MEGA Account", "MEGA (Vault)", "New MEGA"):
                        copy_acc["name"] = email

            # 3. S3 / Wasabi / B2 / R2: show endpoint if custom alias name not given
            elif acc_type in ("s3", "wasabi", "backblaze"):
                endpoint = copy_acc.get("endpoint_url", "")
                bucket = copy_acc.get("bucket", "")
                sub = f"{bucket} ({endpoint})" if bucket and endpoint else (endpoint or bucket)
                copy_acc["subtitle"] = sub
                if not copy_acc.get("name") or copy_acc["name"] in ("Amazon S3 Account", "Wasabi Cloud Account", "Backblaze B2 Account", "New S3"):
                    if sub:
                        copy_acc["name"] = sub

            # 4. Local PC: display "This PC"
            elif acc_type == "local":
                copy_acc["name"] = "This PC"

            if "password" in copy_acc:
                copy_acc["password"] = "••••••••" if copy_acc["password"] else ""
            if "secret_key" in copy_acc:
                copy_acc["secret_key"] = "••••••••" if copy_acc["secret_key"] else ""
            sanitized.append(copy_acc)

        if needs_save:
            self.save()

        return sanitized

    def get_account_config(self, account_id: str) -> Optional[Dict[str, Any]]:
        for acc in self.accounts:
            if acc["id"] == account_id:
                return acc
        return None

    def add_account(self, data: Dict[str, Any]) -> Dict[str, Any]:
        account_id = str(uuid.uuid4())[:8]
        new_account = {
            "id": account_id,
            "name": data.get("name") or f"New {data.get('type', 'Cloud').upper()}",
            "type": data.get("type", "local"),
            "color": data.get("color", "#6366F1"),
            **data
        }
        new_account["id"] = account_id
        self.accounts.append(new_account)
        self.save()
        if account_id in self._provider_cache:
            del self._provider_cache[account_id]
        return new_account

    def update_account(self, account_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        for i, acc in enumerate(self.accounts):
            if acc["id"] == account_id:
                # Do not overwrite with masked password
                for k in ["password", "secret_key"]:
                    if data.get(k) == "••••••••":
                        data[k] = acc.get(k, "")
                updated = {**acc, **data, "id": account_id}
                self.accounts[i] = updated
                self.save()
                if account_id in self._provider_cache:
                    del self._provider_cache[account_id]
                return updated
        return None

    def delete_account(self, account_id: str) -> bool:
        initial_len = len(self.accounts)
        self.accounts = [a for a in self.accounts if a["id"] != account_id]
        if len(self.accounts) < initial_len:
            self.save()
            if account_id in self._provider_cache:
                del self._provider_cache[account_id]
            return True
        return False

    def get_provider(self, account_id: str) -> StorageProvider:
        if account_id in self._provider_cache:
            return self._provider_cache[account_id]

        acc = self.get_account_config(account_id)
        if not acc:
            raise ValueError(f"Account {account_id} not found.")

        acc_type = acc.get("type", "local")
        if acc_type == "local":
            provider = LocalProvider(acc)
        elif acc_type in ("s3", "wasabi", "backblaze"):
            # Set endpoint url automatically for Wasabi if not provided
            if acc_type == "wasabi" and not acc.get("endpoint_url"):
                acc["endpoint_url"] = f"https://s3.{acc.get('region', 'us-east-1')}.wasabisys.com"
            provider = S3Provider(acc)
        elif acc_type == "webdav":
            provider = WebDAVProvider(acc)
        elif acc_type == "ftp":
            provider = FTPProvider(acc)
        elif acc_type == "mediafire":
            provider = MediaFireProvider(acc)
        else:
            # Google Drive, OneDrive, Dropbox, MEGA, Box, pCloud, Yandex
            provider = CloudGenericProvider(acc)

        self._provider_cache[account_id] = provider
        return provider


# Global singleton instance
account_manager = AccountManager()
