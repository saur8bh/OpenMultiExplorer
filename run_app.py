import os
import sys
import socket
import threading
import time
import webbrowser
from pathlib import Path

# Ensure bundled paths work in PyInstaller
if getattr(sys, 'frozen', False):
    BASE_DIR = Path(sys._MEIPASS)
else:
    BASE_DIR = Path(__file__).resolve().parent

sys.path.insert(0, str(BASE_DIR))

import uvicorn
from backend.main import app

def find_available_port(default_port=8089):
    for port in range(default_port, default_port + 20):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('127.0.0.1', port))
                return port
        except OSError:
            continue
    return default_port

def open_browser_later(port):
    time.sleep(1.5)
    url = f"http://127.0.0.1:{port}"
    print(f"\n[OpenMultiExplorer] Opening browser at {url} ...")
    webbrowser.open(url)

def main():
    port = find_available_port(8089)
    print("=" * 64)
    print("   OpenMultiExplorer Pro v1.0")
    print("   100% Free & Open-Source Multi-Cloud File Explorer")
    print(f"   Server listening on: http://127.0.0.1:{port}")
    print("   Repository: https://github.com/saur8bh/OpenMultiExplorer")
    print("   Press CTRL+C to close")
    print("=" * 64)

    threading.Thread(target=open_browser_later, args=(port,), daemon=True).start()
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="warning")

if __name__ == "__main__":
    main()
