# 🌐 Offline Capability

The system follows an "Offline-First" architecture, ensuring functionality even without an internet connection.

## Architecture

1. **Local Database (Frontend)**:
   - Uses `Dexie.js` wrapper for **IndexedDB**.
   - Stores a complete local copy of Students, Fees, and Settings.

2. **Synchronization**:
   - The app detects online status (`navigator.onLine`).
   - **Offline Mode**: Reads/Writes to IndexedDB. Actions are queued.
   - **Online Mode**: Background sync pushes queued actions to the backend (MySQL) and pulls latest updates.

## Supported Offline Actions
- ✅ Search View Students
- ✅ Create New Admission (queued)
- ✅ Collect Fee (queued)
- ✅ View Receipts

## Limitations
- PDF generation requires server connection.
- Reporting data might be stale until next sync.
