#!/bin/bash
# ============================================
# School Management System - Files Backup
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="$PROJECT_DIR/backups/files"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo ""
echo " ========================================"
echo "  Files Backup - $TIMESTAMP"
echo " ========================================"
echo ""

# Backup uploads directory
UPLOADS_DIR="$PROJECT_DIR/backend/uploads"
if [ -d "$UPLOADS_DIR" ]; then
    BACKUP_FILE="$BACKUP_DIR/uploads_${TIMESTAMP}.tar.gz"
    echo " Backing up uploads directory..."
    tar -czf "$BACKUP_FILE" -C "$PROJECT_DIR/backend" uploads
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo " [OK] Uploads backup: $BACKUP_FILE ($SIZE)"
else
    echo " [!] No uploads directory found, skipping..."
fi

# Backup environment files
echo " Backing up configuration files..."
CONFIG_BACKUP="$BACKUP_DIR/config_${TIMESTAMP}.tar.gz"
tar -czf "$CONFIG_BACKUP" \
    -C "$PROJECT_DIR" \
    backend/.env \
    frontend/.env 2>/dev/null || echo " [WARN] Some config files may not exist"

echo ""
echo " [OK] Files backup complete!"

# Cleanup old backups (keep last 30 days)
echo " Cleaning up backups older than 30 days..."
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete
