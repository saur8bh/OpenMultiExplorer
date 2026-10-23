import os
from pathlib import Path

# Base data directory
APP_DIR = Path(os.environ.get("OPENMULTIEXPLORER_HOME", Path.home() / ".openmultiexplorer"))
APP_DIR.mkdir(parents=True, exist_ok=True)

ACCOUNTS_FILE = APP_DIR / "accounts.json"
SETTINGS_FILE = APP_DIR / "settings.json"
TEMP_DIR = APP_DIR / "temp"
TEMP_DIR.mkdir(parents=True, exist_ok=True)

DEFAULT_PORT = 8089
DEFAULT_HOST = "127.0.0.1"
CHUNK_SIZE = 1024 * 1024  # 1MB chunk size
