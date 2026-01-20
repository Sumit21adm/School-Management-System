# How To Test Application

This document outlines the steps to test the **Production Release** of the School Management System.

## 🎯 Goal
Verify that the application runs correctly in a containerized Docker environment, simulating a real-world deployment.

## 📦 Prerequisites

*   **Docker Desktop** must be installed and running.
*   You must have already built the release (or downloaded the `school-management-system-docker.zip`).

## 🛠 Step 1: Locate the Release

### Option A: Manual Build (Local)
Run the build script to generate the release locally:
```bash
# Mac/Linux
./scripts/release-docker/build.sh
```
This will create `releases/school-management-system-docker.zip`.

### Option B: Download from GitHub Actions (Automated)
1.  Go to the **Actions** tab in the GitHub repository.
2.  Click on the latest **"Build Release"** workflow run.
3.  Scroll down to the **Artifacts** section.
4.  Click on `school-management-system-docker` to download the zip file.
5.  Move this zip file to your `releases` folder (optional, but keeps things organized).

## 📂 Step 2: Extract the Release

1.  **Unzip** the `school-management-system-docker.zip` file.
    *   *Note: GitHub Artifacts might double-zip. If you see another zip inside, unzip that one too.*
2.  This will create a folder named `school-management-docker`.
3.  Open this folder.

## 🚀 Step 3: Run the Application

Execute the startup script appropriate for your operating system:

### 🍎 Mac / 🐧 Linux
Double-click **`start_app_mac.command`**.

> **Note:** If it doesn't run, you may need to grant permission via terminal:
> ```bash
> chmod +x start_app_mac.command
> ./start_app_mac.command
> ```

### 🪟 Windows
Double-click **`start_app_windows.bat`**.

## 📝 Step 4: Verification Checklist

Once the script finishes, the application should automatically open in your browser.

| Component | URL | Expected Result |
|-----------|-----|-----------------|
| **Frontend** | [http://localhost:3000](http://localhost:3000) | Login page should load. |
| **Backend API** | [http://localhost:3001](http://localhost:3001) | Should show "Hello World" or API root message. |

### Functional Tests
1.  **Login**: specific credentials (e.g., `superadmin` / `admin123`) should work.
2.  **Navigation**: Click through sidebar items to ensure pages load (no 404s).
3.  **Data Persistence**: Create a test student, restart the application (stop/start scripts), and verify the student still exists.

## 🛑 How to Stop

To stop the application and remove containers:

*   **Mac/Linux**: Run **`stop_app_mac.command`**.
*   **Windows**: Run **`stop_app_windows.bat`**.

---

**Troubleshooting:**
*   **White Screen?** Check browser console (F12) for errors.
*   **Login Failed?** Ensure the backend container is running (`docker ps`).
*   **Ports Occupied?** Ensure ports `3000` and `3001` are free before running.
