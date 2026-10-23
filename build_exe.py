import os
import sys
import shutil
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

def build():
    print("=" * 60)
    print("  OpenMultiExplorer Pro v1.0 - Executable Builder")
    print("=" * 60)

    # 1. Build Frontend
    frontend_dir = BASE_DIR / "frontend"
    print("\n[1/3] Building Frontend with Vite...")
    subprocess.run(["npm", "run", "build"], cwd=str(frontend_dir), check=True, shell=True)

    dist_dir = frontend_dir / "dist"
    if not dist_dir.exists():
        raise RuntimeError("Frontend dist directory does not exist after build!")
    print("   [OK] Frontend bundled successfully to:", dist_dir)

    # 2. Prepare PyInstaller command
    print("\n[2/3] Building OpenMultiExplorer.exe with PyInstaller...")
    icon_path = frontend_dir / "public" / "favicon.ico"

    pyinstaller_cmd = [
        sys.executable, "-m", "PyInstaller",
        "--name=OpenMultiExplorer",
        "--onefile",
        "--clean",
        "--noconfirm",
        f"--add-data={dist_dir};frontend/dist",
        f"--icon={icon_path}",
        "--hidden-import=uvicorn.logging",
        "--hidden-import=uvicorn.loops",
        "--hidden-import=uvicorn.loops.auto",
        "--hidden-import=uvicorn.protocols",
        "--hidden-import=uvicorn.protocols.http",
        "--hidden-import=uvicorn.protocols.http.auto",
        "--hidden-import=uvicorn.protocols.websockets",
        "--hidden-import=uvicorn.protocols.websockets.auto",
        "--hidden-import=uvicorn.lifespan",
        "--hidden-import=uvicorn.lifespan.on",
        "--hidden-import=uvicorn.lifespan.off",
        "--hidden-import=fastapi",
        "--hidden-import=starlette",
        "--hidden-import=backend",
        "--hidden-import=backend.main",
        "--hidden-import=backend.accounts",
        "--hidden-import=backend.transfers",
        "--hidden-import=backend.sync_engine",
        "--hidden-import=backend.search_engine",
        "--hidden-import=backend.crypto",
        "--hidden-import=backend.providers.local_provider",
        "--hidden-import=backend.providers.mediafire_provider",
        "--hidden-import=backend.providers.s3_provider",
        "--hidden-import=backend.providers.webdav_provider",
        "--hidden-import=backend.providers.ftp_provider",
        "--hidden-import=backend.providers.cloud_generic",
        "--hidden-import=mediafire",
        "--hidden-import=cryptography",
        "--hidden-import=httpx",
        str(BASE_DIR / "run_app.py")
    ]

    subprocess.run(pyinstaller_cmd, cwd=str(BASE_DIR), check=True)

    output_exe = BASE_DIR / "dist" / "OpenMultiExplorer.exe"
    if output_exe.exists():
        size_mb = output_exe.stat().st_size / (1024 * 1024)
        print(f"\n[3/3] BUILD SUCCESSFUL!")
        print(f"   Standalone Executable: {output_exe}")
        print(f"   Size: {size_mb:.2f} MB")
        print("=" * 60)
    else:
        raise RuntimeError("Build finished but OpenMultiExplorer.exe was not found in dist/")

if __name__ == "__main__":
    build()
