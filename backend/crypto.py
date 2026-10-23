"""
Client-Side Transparent Encryption Engine for OpenMultiExplorer.
Uses AES-256-GCM with PBKDF2HMAC (SHA-256, 600,000 iterations).
Features:
- Encrypted file format with magic header: OMEX_ENC (8 bytes) + version (1 byte) + salt (16 bytes) + nonce (12 bytes) + tag (16 bytes) + ciphertext
- Stream encryption & decryption
- Transparent filename obfuscation / encryption
"""

import os
import base64
from typing import Tuple, AsyncGenerator
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend

MAGIC = b"OMEX_ENC"
VERSION = b"\x01"
HEADER_LEN = len(MAGIC) + 1 + 16 + 12 + 16  # Magic(8) + Version(1) + Salt(16) + Nonce(12) + Tag(16) = 53 bytes
KDF_ITERATIONS = 600_000


def derive_key(passphrase: str, salt: bytes) -> bytes:
    """Derives a 256-bit key from the passphrase using PBKDF2-HMAC-SHA256."""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=KDF_ITERATIONS,
        backend=default_backend()
    )
    return kdf.derive(passphrase.encode("utf-8"))


def encrypt_bytes(data: bytes, passphrase: str) -> bytes:
    """Encrypts raw data using AES-256-GCM with a new salt and nonce."""
    salt = os.urandom(16)
    nonce = os.urandom(12)
    key = derive_key(passphrase, salt)
    aesgcm = AESGCM(key)
    
    # AESGCM.encrypt returns ciphertext + 16-byte tag
    ciphertext_and_tag = aesgcm.encrypt(nonce, data, MAGIC + VERSION)
    tag = ciphertext_and_tag[-16:]
    ciphertext = ciphertext_and_tag[:-16]
    
    return MAGIC + VERSION + salt + nonce + tag + ciphertext


def is_encrypted_file(data_header: bytes) -> bool:
    """Checks whether the first bytes of a file match the OMEX_ENC signature."""
    return data_header.startswith(MAGIC)


def decrypt_bytes(encrypted_data: bytes, passphrase: str) -> bytes:
    """Decrypts data encrypted with encrypt_bytes."""
    if len(encrypted_data) < HEADER_LEN:
        raise ValueError("Data too short to be a valid encrypted payload.")
    
    magic = encrypted_data[:8]
    if magic != MAGIC:
        raise ValueError("Invalid file magic. Not an OpenMultiExplorer encrypted file.")
    
    version = encrypted_data[8:9]
    if version != VERSION:
        raise ValueError(f"Unsupported encryption version: {version}")
        
    salt = encrypted_data[9:25]
    nonce = encrypted_data[25:37]
    tag = encrypted_data[37:53]
    ciphertext = encrypted_data[53:]
    
    key = derive_key(passphrase, salt)
    aesgcm = AESGCM(key)
    
    ciphertext_and_tag = ciphertext + tag
    return aesgcm.decrypt(nonce, ciphertext_and_tag, MAGIC + VERSION)


def encrypt_filename(filename: str, passphrase: str) -> str:
    """Encrypts a filename into a safe base64 representation."""
    encrypted = encrypt_bytes(filename.encode("utf-8"), passphrase)
    b64 = base64.urlsafe_b64encode(encrypted).decode("ascii").rstrip("=")
    return f"enc__{b64}.omex"


def decrypt_filename(encoded_filename: str, passphrase: str) -> str:
    """Decrypts an encrypted filename if it matches the enc__*.omex pattern."""
    if not (encoded_filename.startswith("enc__") and encoded_filename.endswith(".omex")):
        return encoded_filename
    try:
        raw_b64 = encoded_filename[5:-5]
        # Pad base64
        padding = 4 - (len(raw_b64) % 4)
        if padding != 4:
            raw_b64 += "=" * padding
        encrypted_bytes = base64.urlsafe_b64decode(raw_b64.encode("ascii"))
        decrypted_bytes = decrypt_bytes(encrypted_bytes, passphrase)
        return decrypted_bytes.decode("utf-8")
    except Exception:
        return encoded_filename
