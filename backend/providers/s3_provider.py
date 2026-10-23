import io
import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from typing import List, Optional, Dict, Any

from backend.providers.base import StorageProvider, StorageItem
from backend.crypto import is_encrypted_file


class S3Provider(StorageProvider):
    """
    S3 & S3-Compatible Provider.
    Supports AWS S3, Wasabi, Backblaze B2, MinIO, Cloudflare R2, Ceph, etc.
    """

    def __init__(self, account_config: Dict[str, Any]):
        super().__init__(account_config)
        self.endpoint_url = account_config.get("endpoint_url") or None
        self.access_key = account_config.get("access_key", "")
        self.secret_key = account_config.get("secret_key", "")
        self.region = account_config.get("region", "us-east-1")
        self.bucket = account_config.get("bucket", "")
        self.client = None
        self._init_client()

    def _init_client(self):
        config = Config(
            signature_version="s3v4",
            s3={"addressing_style": "path" if self.endpoint_url else "auto"}
        )
        self.client = boto3.client(
            "s3",
            endpoint_url=self.endpoint_url,
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            region_name=self.region,
            config=config,
        )

    async def test_connection(self) -> bool:
        try:
            if self.bucket:
                self.client.head_bucket(Bucket=self.bucket)
            else:
                self.client.list_buckets()
            return True
        except Exception:
            return False

    async def list_dir(self, path: str = "/") -> List[StorageItem]:
        items: List[StorageItem] = []
        # If no bucket is selected, list buckets as top-level folders
        if not self.bucket:
            try:
                response = self.client.list_buckets()
                for b in response.get("Buckets", []):
                    bname = b["Name"]
                    items.append(
                        StorageItem(
                            name=bname,
                            path=f"/{bname}",
                            is_dir=True,
                            size=0,
                            modified=b.get("CreationDate", "").strftime("%Y-%m-%d %H:%M:%S") if b.get("CreationDate") else "",
                            account_id=self.account_id,
                            account_name=self.account_name,
                            account_type=self.account_type,
                        )
                    )
                return items
            except Exception:
                return []

        # Normal bucket listing with delimiter
        clean_path = path.strip("/ ")
        prefix = f"{clean_path}/" if clean_path else ""
        
        try:
            paginator = self.client.get_paginator("list_objects_v2")
            pages = paginator.paginate(
                Bucket=self.bucket,
                Prefix=prefix,
                Delimiter="/",
            )
            for page in pages:
                # Subdirectories (CommonPrefixes)
                for cp in page.get("CommonPrefixes", []):
                    dir_prefix = cp.get("Prefix", "")
                    dir_name = dir_prefix.rstrip("/").split("/")[-1]
                    items.append(
                        StorageItem(
                            name=dir_name,
                            path=f"/{dir_prefix.rstrip('/')}",
                            is_dir=True,
                            size=0,
                            modified="",
                            account_id=self.account_id,
                            account_name=self.account_name,
                            account_type=self.account_type,
                        )
                    )
                # Files
                for obj in page.get("Contents", []):
                    key = obj.get("Key", "")
                    if key == prefix:  # Skip folder placeholder itself
                        continue
                    fname = key.split("/")[-1]
                    size = obj.get("Size", 0)
                    mtime = obj.get("LastModified", "")
                    modified = mtime.strftime("%Y-%m-%d %H:%M:%S") if hasattr(mtime, "strftime") else ""
                    
                    encrypted = fname.startswith("enc__") and fname.endswith(".omex")
                    items.append(
                        StorageItem(
                            name=fname,
                            path=f"/{key}",
                            is_dir=False,
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
        clean_key = path.strip("/") + "/"
        try:
            self.client.put_object(Bucket=self.bucket, Key=clean_key, Body=b"")
            return True
        except Exception:
            return False

    async def delete(self, path: str, is_dir: bool = False) -> bool:
        clean_path = path.strip("/")
        try:
            if is_dir:
                prefix = f"{clean_path}/"
                # Delete all objects under prefix
                paginator = self.client.get_paginator("list_objects_v2")
                for page in paginator.paginate(Bucket=self.bucket, Prefix=prefix):
                    objects_to_delete = [{"Key": obj["Key"]} for obj in page.get("Contents", [])]
                    if objects_to_delete:
                        self.client.delete_objects(
                            Bucket=self.bucket,
                            Delete={"Objects": objects_to_delete}
                        )
            else:
                self.client.delete_object(Bucket=self.bucket, Key=clean_path)
            return True
        except Exception:
            return False

    async def rename(self, old_path: str, new_path: str) -> bool:
        src = old_path.strip("/")
        dst = new_path.strip("/")
        try:
            # S3 copy + delete
            copy_source = {"Bucket": self.bucket, "Key": src}
            self.client.copy_object(CopySource=copy_source, Bucket=self.bucket, Key=dst)
            self.client.delete_object(Bucket=self.bucket, Key=src)
            return True
        except Exception:
            return False

    async def read_bytes(self, path: str) -> bytes:
        clean_key = path.strip("/")
        res = self.client.get_object(Bucket=self.bucket, Key=clean_key)
        return res["Body"].read()

    async def write_bytes(self, path: str, data: bytes) -> bool:
        clean_key = path.strip("/")
        self.client.put_object(Bucket=self.bucket, Key=clean_key, Body=data)
        return True

    async def get_metadata(self, path: str) -> Optional[StorageItem]:
        clean_key = path.strip("/")
        try:
            res = self.client.head_object(Bucket=self.bucket, Key=clean_key)
            fname = clean_key.split("/")[-1]
            size = res.get("ContentLength", 0)
            mtime = res.get("LastModified", "")
            modified = mtime.strftime("%Y-%m-%d %H:%M:%S") if hasattr(mtime, "strftime") else ""
            return StorageItem(
                name=fname,
                path=f"/{clean_key}",
                is_dir=False,
                size=size,
                modified=modified,
                is_encrypted=fname.startswith("enc__") and fname.endswith(".omex"),
                account_id=self.account_id,
                account_name=self.account_name,
                account_type=self.account_type,
            )
        except Exception:
            return None
