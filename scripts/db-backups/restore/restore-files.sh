#!/bin/bash
# ============================================
# School Management System - Files Restore
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKUP_DIR="$PROJECT_DIR/backups/files"

echo ""
echo " ========================================"
echo "  Files Restore"
echo " ========================================"
echo ""

# List available backups
echo " Available backups:"
echo ""
ls -lht "$BACKUP_DIR"/uploads_*.tar.gz 2>/dev/null | head -10
echo ""

# Check for non-interactive mode
SKIP_CONFIRM=0
if [[ "$1" == "-y" ]] || [[ "$1" == "--yes" ]]; then
    SKIP_CONFIRM=1
    shift
fi

if [ -z "$1" ]; then
    echo " Usage: $0 [-y] <uploads_backup.tar.gz>"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
        BACKUP_FILE="$BACKUP_DIR/$BACKUP_FILE"
    else
        echo " [!] Backup file not found: $BACKUP_FILE"
        exit 1
    fi
fi

echo " Selected backup: $BACKUP_FILE"
echo ""

if [ "$SKIP_CONFIRM" -eq 0 ]; then
    read -p " This will replace uploads. Continue? (type 'yes'): " CONFIRM

    if [ "$CONFIRM" != "yes" ]; then
        echo " Restore cancelled."
        exit 0
    fi
else
    echo " [INFO] Non-interactive mode: skipping confirmation."
fi

# Backup current uploads
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
if [ -d "$PROJECT_DIR/backend/uploads" ]; then
    echo " Backing up current uploads..."
    mv "$PROJECT_DIR/backend/uploads" "$PROJECT_DIR/backend/uploads_backup_$TIMESTAMP"
fi

# Restore
echo " Restoring uploads..."
tar -xzf "$BACKUP_FILE" -C "$PROJECT_DIR/backend"

echo ""
echo " [OK] Files restored successfully!"
