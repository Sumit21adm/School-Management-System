#!/bin/bash
# ============================================
# School Management System - Complete Backup
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo " ========================================"
echo "  Complete System Backup"
echo " ========================================"
echo ""

# Run database backup
"$SCRIPT_DIR/backup-database.sh"

# Run files backup
"$SCRIPT_DIR/backup-files.sh"

echo ""
echo " ========================================"
echo "  All Backups Completed Successfully!"
echo " ========================================"
echo ""
echo " Backup location: $SCRIPT_DIR/../../backups/"
echo ""
ls -lh "$SCRIPT_DIR/../../backups/database/" 2>/dev/null | tail -5
ls -lh "$SCRIPT_DIR/../../backups/files/" 2>/dev/null | tail -5
