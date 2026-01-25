#!/bin/bash
# ============================================
# Download Backup from Google Drive
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKUP_DIR="$PROJECT_DIR/backups"
GDRIVE_FOLDER="School-Management-Backups"

echo ""
echo " ========================================"
echo "  Download Backup from Google Drive"
echo " ========================================"
echo ""

# List available backups on Google Drive
echo " Available backups on Google Drive:"
echo ""
# Check rclone config first
if ! command -v rclone &> /dev/null; then
    echo " [!] rclone not installed. Install with 'brew install rclone'"
    exit 1
fi
if ! rclone listremotes | grep -q "gdrive:"; then
    echo " [!] Google Drive remote 'gdrive' not configured."
    exit 1
fi

rclone ls "gdrive:$GDRIVE_FOLDER/database" 2>/dev/null | head -10
echo ""

if [ -z "$1" ]; then
    echo " Usage: $0 <backup_filename>"
    echo " Example: $0 school_db_20240109_020000.sql.gz"
    exit 1
fi

BACKUP_NAME="$1"

# Download from Google Drive
echo " Downloading $BACKUP_NAME from Google Drive..."
mkdir -p "$BACKUP_DIR/database"
rclone copy "gdrive:$GDRIVE_FOLDER/database/$BACKUP_NAME" "$BACKUP_DIR/database/" --progress

echo ""
echo " [OK] Downloaded to: $BACKUP_DIR/database/$BACKUP_NAME"
echo ""
echo " To restore, run:"
echo "   ./restore-database.sh $BACKUP_DIR/database/$BACKUP_NAME"
