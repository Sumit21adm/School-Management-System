#!/bin/bash
# ============================================
# Verify Backup Integrity
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="$PROJECT_DIR/backups"

echo ""
echo " ========================================"
echo "  Backup Verification Report"
echo " ========================================"
echo ""

# Check database backups
echo " 📊 Database Backups:"
echo " --------------------"
DB_COUNT=$(ls -1 "$BACKUP_DIR/database/"*.sql.gz 2>/dev/null | wc -l)
if [ "$DB_COUNT" -gt 0 ]; then
    LATEST_DB=$(ls -t "$BACKUP_DIR/database/"*.sql.gz 2>/dev/null | head -1)
    echo "   Total backups: $DB_COUNT"
    echo "   Latest: $(basename "$LATEST_DB")"
    echo "   Size: $(du -h "$LATEST_DB" | cut -f1)"
    echo "   Date: $(stat -f "%Sm" "$LATEST_DB" 2>/dev/null || stat -c "%y" "$LATEST_DB" 2>/dev/null)"
    
    # Verify gzip integrity
    if gzip -t "$LATEST_DB" 2>/dev/null; then
        echo "   Status: ✅ Valid"
    else
        echo "   Status: ❌ Corrupted!"
    fi
else
    echo "   ⚠️  No database backups found!"
fi

echo ""
echo " 📁 File Backups:"
echo " ----------------"
FILE_COUNT=$(ls -1 "$BACKUP_DIR/files/"uploads_*.tar.gz 2>/dev/null | wc -l)
if [ "$FILE_COUNT" -gt 0 ]; then
    LATEST_FILE=$(ls -t "$BACKUP_DIR/files/"uploads_*.tar.gz 2>/dev/null | head -1)
    echo "   Total backups: $FILE_COUNT"
    echo "   Latest: $(basename "$LATEST_FILE")"
    echo "   Size: $(du -h "$LATEST_FILE" | cut -f1)"
    
    # Verify tar integrity
    if tar -tzf "$LATEST_FILE" > /dev/null 2>&1; then
        echo "   Status: ✅ Valid"
    else
        echo "   Status: ❌ Corrupted!"
    fi
else
    echo "   ⚠️  No file backups found!"
fi

echo ""
echo " 💾 Disk Space:"
echo " --------------"
if [ -d "$BACKUP_DIR" ]; then
    echo "   Backup directory size: $(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)"
    echo "   Available disk space: $(df -h "$BACKUP_DIR" | tail -1 | awk '{print $4}')"
else
    echo "   Backup directory does not exist yet."
fi
echo ""
