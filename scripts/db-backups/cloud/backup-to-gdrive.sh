#!/bin/bash
# ============================================
# Upload Backups to Google Drive
# ============================================
# Prerequisites: rclone configured with 'gdrive' remote
# Run: rclone config (to setup)

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKUP_DIR="$PROJECT_DIR/backups"

# Google Drive folder name
GDRIVE_FOLDER="School-Management-Backups"

echo ""
echo " ========================================"
echo "  Uploading Backups to Google Drive"
echo " ========================================"
echo ""

# Check rclone
if ! command -v rclone &> /dev/null; then
    echo " [!] rclone not installed."
    echo " Install: brew install rclone"
    echo " Then run: rclone config (to setup Google Drive)"
    exit 1
fi

# Check if gdrive remote exists
if ! rclone listremotes | grep -q "gdrive:"; then
    echo " [!] Google Drive remote 'gdrive' not configured."
    echo " Run: rclone config"
    exit 1
fi

# Run local backup first
"$SCRIPT_DIR/../local/backup-all.sh"

# Sync to Google Drive
echo ""
echo " Syncing to Google Drive..."

# Upload database backups
rclone sync "$BACKUP_DIR/database" "gdrive:$GDRIVE_FOLDER/database" \
    --progress \
    --transfers 4

# Upload file backups
rclone sync "$BACKUP_DIR/files" "gdrive:$GDRIVE_FOLDER/files" \
    --progress \
    --transfers 4

echo ""
echo " [OK] Backups uploaded to Google Drive: $GDRIVE_FOLDER/"
echo ""

# Show what's in Google Drive
echo " Google Drive backup contents:"
rclone ls "gdrive:$GDRIVE_FOLDER" 2>/dev/null | head -10
