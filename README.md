# OpenMultiExplorer (Pro Multi-Cloud Manager)

[![Version](https://img.shields.io/badge/version-1.0-blue.svg)](https://github.com/saur8bh/OpenMultiExplorer/releases/tag/v1.0)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Web-cyan.svg)](https://github.com/saur8bh/OpenMultiExplorer)
[![Security](https://img.shields.io/badge/encryption-AES--256--GCM-emerald.svg)](https://github.com/saur8bh/OpenMultiExplorer)

**OpenMultiExplorer** is a modern, high-performance, 100% open-source multi-cloud file explorer, synchronizer, and migration manager. Designed as a free, transparent clean-room alternative to commercial tools like **Air Explorer Pro** ($42 lifetime license), it gives you complete ownership over your files, transparent client-side encryption, and seamless cloud-to-cloud transfers with unlimited accounts.

---

## ⚡ Feature Comparison (Air Explorer Pro vs OpenMultiExplorer)

| Feature | Air Explorer Pro ($42) | OpenMultiExplorer v1.0 (Free & Open Source) |
|---|---|---|
| **License Cost** | $42 / license | **100% Free & Open Source (MIT)** |
| **Accounts** | Unlimited accounts | **Unlimited accounts (Free forever)** |
| **Interface Layout** | Single & Dual Panels | **One Panel (Maximized) or Two Panels (Sync)** |
| **Tabbed Browsing** | Multi-tab with Explore dashboard | **Yes (Full tab bar with Connected Accounts Dashboard)** |
| **MediaFire Support** | Standard file hosting | **Yes (Direct Live MediaFire API with Auto-Account Fetch)** |
| **Client-Side Encryption** | AES-256 on the fly | **AES-256-GCM + PBKDF2 (600,000 rounds) + Filename Obfuscation** |
| **Folder Synchronization** | Mirror, Update, Bidirectional | **Mirror, Update, Bidirectional with diff preview** |
| **Mouse Drag Multi-Select** | Desktop marquee lasso | **Desktop-grade marquee drag selection + Shift/Ctrl click** |
| **Default Sorting** | Name / Date | **Last Modified Date (Newest first) by default** |
| **Bandwidth Limiter** | Speed throttling | **Configurable speed throttling (1 MB/s to Unlimited)** |
| **Direct Cloud-to-Cloud** | Yes | **Streaming pipeline without intermediate local disk bloat** |
| **Transfer Queue** | Pause, resume, retry | **Live real-time progress bars, MB/s speed, and pause/resume** |

---

## ☁️ Supported Clouds & Storage Protocols

1. **Major Public Clouds**:
   - **MediaFire** (Verified — Dedicated live REST API with session auth and chunked downloads)
   - **Local Computer** (Verified — Browse drives, SSDs, USB flash drives, and network shares)
   - **Google Drive** & Google Workspace
   - **Microsoft OneDrive** & OneDrive for Business / SharePoint
   - **MEGA** (Encrypted cloud storage with automatic email identification)
   - **Dropbox**
   - **Box**
   - **pCloud**
   - **Yandex Disk**

2. **S3-Compatible Object Storage**:
   - **Amazon S3 (AWS)**
   - **Wasabi Hot Cloud Storage**
   - **Backblaze B2 (S3 API)**
   - **MinIO** (Self-hosted)
   - **Cloudflare R2**
   - **DigitalOcean Spaces**

3. **Network Protocols**:
   - **WebDAV** (Nextcloud, ownCloud, Koofr, TeraCloud, InfiniCLOUD)
   - **FTP / FTPS** (File Transfer Protocol with optional TLS)

---

## 📥 Download & Installation

### Option 1: Standalone Portable Executable (Recommended for Windows)
No Python, Node.js, or dependencies required!
1. Go to the [**Releases**](https://github.com/saur8bh/OpenMultiExplorer/releases/tag/v1.0) page.
2. Download `OpenMultiExplorer.exe`.
3. Double-click `OpenMultiExplorer.exe` to run. Your default browser will automatically open at `http://127.0.0.1:8089`.

---

## 🔨 How to Build `.exe` from Source Code

You can easily build the standalone `OpenMultiExplorer.exe` binary yourself from the source code.

### Prerequisites
- **Python 3.10+** (with `pip`)
- **Node.js 18+** (with `npm`)

### Build Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/saur8bh/OpenMultiExplorer.git
   cd OpenMultiExplorer
   ```

2. **Set up Python Virtual Environment**:
   ```bash
   python -m venv .venv
   .\.venv\Scripts\activate
   pip install -r backend/requirements.txt
   pip install pyinstaller
   ```

3. **Install Frontend Dependencies**:
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Build the `.exe` (One-Click)**:
   - On Windows, simply double-click **`build.bat`**, or run:
     ```bash
     python build_exe.py
     ```
   - The automated build script will:
     - Compile the frontend bundle into `frontend/dist/`.
     - Embed static assets, icons, and backend modules with PyInstaller.
     - Generate the standalone executable at:
       ```
       dist/OpenMultiExplorer.exe
       ```

---

## 🚀 Running from Source Code (Developer Mode)

If you prefer to run directly from source without packaging:

1. **Start the App with Launcher**:
   - Double-click **`run.bat`** (or execute `.\run.ps1` in PowerShell).
2. **Or run manually**:
   ```bash
   # Activate environment
   .\.venv\Scripts\activate
   
   # Start the backend server
   python -m uvicorn backend.main:app --host 127.0.0.1 --port 8089
   ```
3. Open your browser at `http://localhost:8089`.

---

## 🗑️ Uninstall & Complete Data Removal Guide

OpenMultiExplorer is designed to be 100% transparent and portable. It does not install hidden background services or modify Windows registry keys.

To completely remove OpenMultiExplorer and all associated account data from your computer:

1. **Close the Application**:
   - Close your browser tab and terminate the running `OpenMultiExplorer.exe` or terminal process.

2. **Delete User Data & Stored Accounts**:
   - OpenMultiExplorer stores account configurations in your user profile directory at:
     ```
     C:\Users\<YourUsername>\.openmultiexplorer
     ```
   - **Via Windows Explorer**:
     - Press `Win + R`, type `%USERPROFILE%`, and press Enter.
     - Delete the `.openmultiexplorer` folder.
   - **Via PowerShell (One-liner)**:
     ```powershell
     Remove-Item -Recurse -Force "$env:USERPROFILE\.openmultiexplorer" -ErrorAction SilentlyContinue
     ```

3. **Delete Application Files / Executable**:
   - Simply delete the folder containing `OpenMultiExplorer.exe` (or the cloned source repository).

4. **Clear Browser Cache (Optional)**:
   - If you accessed the dashboard via browser, clear cache and local storage for `localhost:8089` to purge any saved layout preferences.

Your computer is now completely free of any OpenMultiExplorer files or credentials.

---

## 🔒 Security & Client-Side Encryption Architecture

OpenMultiExplorer features **Zero-Knowledge Transparent Encryption**:
- **Algorithm**: AES-256 in Galois/Counter Mode (AES-256-GCM) with 128-bit authentication tag.
- **Key Derivation**: PBKDF2 with SHA-256 and **600,000 iterations** combined with a unique cryptographic salt per file.
- **Filename Obfuscation**: Real filenames are encrypted into safe base64 tokens (`enc__<token>.omex`) so cloud providers cannot read file names or directory structures.
- **Client-Side Processing**: All encryption and decryption occurs strictly in local computer memory before packets hit the network. Cloud providers only receive unreadable encrypted ciphertext.

---

## 🤝 Contributing & Support

We welcome bug reports, pull requests, and feature suggestions!
- **Repository**: [https://github.com/saur8bh/OpenMultiExplorer](https://github.com/saur8bh/OpenMultiExplorer)
- **Issues & Suggestions**: [GitHub Issues Tracker](https://github.com/saur8bh/OpenMultiExplorer/issues)

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.
