# 🔄 Data Synchronization

The heartbeat of our **Offline-First** architecture.

## Concept
The application writes data to a local database (IndexedDB) first, ensuring an instant UI response. A background process then syncs this data to the server when connection is available.

## Sync Queue System
Implemented in `lib/db.ts`:

1. **Action Trigger**: User creates a student, pays a fee, etc.
2. **Local Write**: Data saved to specific Dexie table (e.g., `students`).
3. **Queue Entry**: A record is added to `syncQueue` table:
   - `tableName`: Target table
   - `operation`: CREATE / UPDATE / DELETE
   - `data`: The payload
   - `timestamp`: Time of action

## Sync Process (The "Loop")
- **Detection**: The app listens for `window.online` events.
- **Processing**:
  - Iterates through `syncQueue`.
  - Sends appropriate API request to backend.
  - On Success: Removes item from queue.
  - On Failure: Increments retry count (stops after N attempts).

## Conflict Resolution
- **Strategy**: Last-Write-Wins.
- Since the offline client is the primary source of truth for the user session, its timestamped actions generally override server state during a sync push.
