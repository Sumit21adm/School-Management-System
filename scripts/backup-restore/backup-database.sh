#!/bin/bash
# ============================================
# School Management System - Database Backup
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="$PROJECT_DIR/backups/database"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# MySQL Configuration
MYSQL_CONTAINER="school-mysql-hybrid"
MYSQL_DATABASE="school_management"
MYSQL_USER="school_user"
MYSQL_PASSWORD="school_pass"

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo ""
echo " ========================================"
echo "  Database Backup - $TIMESTAMP"
echo " ========================================"
echo ""

# Check if MySQL container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${MYSQL_CONTAINER}$"; then
    echo " [!] MySQL container is not running."
    exit 1
fi

# Create backup
BACKUP_FILE="$BACKUP_DIR/school_db_${TIMESTAMP}.sql"
echo " Creating backup: $BACKUP_FILE"

# Using mysqldump to backup the specific database
# proper flags for consistent backups
docker exec "$MYSQL_CONTAINER" mysqldump \
    -u"$MYSQL_USER" \
    -p"$MYSQL_PASSWORD" \
    --single-transaction \
    --routines \
    --triggers \
    --databases "$MYSQL_DATABASE" > "$BACKUP_FILE"

# Compress backup
echo " Compressing backup..."
gzip "$BACKUP_FILE"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

# Calculate size
SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)

echo ""
echo " [OK] Backup completed!"
echo "      File: $COMPRESSED_FILE"
echo "      Size: $SIZE"
echo ""

# Cleanup old backups (keep last 30 days)
echo " Cleaning up backups older than 30 days..."
find "$BACKUP_DIR" -name "school_db_*.sql.gz" -mtime +30 -delete

echo " [OK] Backup process complete!"
