#!/bin/bash
# ============================================
# School Management System - Database Restore
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="$PROJECT_DIR/backups/database"

# MySQL Configuration
MYSQL_CONTAINER="school-mysql-hybrid"
MYSQL_DATABASE="school_management"
MYSQL_USER="school_user"
MYSQL_PASSWORD="school_pass"
MYSQL_ROOT_PASSWORD="rootpassword"

echo ""
echo " ========================================"
echo "  Database Restore"
echo " ========================================"
echo ""

# List available backups
echo " Available backups:"
echo ""
ls -lht "$BACKUP_DIR"/*.sql.gz 2>/dev/null | head -10
echo ""

# Check for non-interactive mode
SKIP_CONFIRM=0
if [[ "$1" == "-y" ]] || [[ "$1" == "--yes" ]]; then
    SKIP_CONFIRM=1
    # Shift arguments so $1 becomes the backup file if provided
    shift
fi

# If backup file is not provided after shift, and we have arguments
if [ -n "$1" ]; then
    BACKUP_FILE="$1"
fi
# ... logic to select backup file if empty ...

# Validate backup file exists
if [ -z "$BACKUP_FILE" ]; then 
     echo " Usage: $0 [-y] <backup_file.sql.gz>"
     exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    # Try relative to backup dir
    if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
        BACKUP_FILE="$BACKUP_DIR/$BACKUP_FILE"
    else
        echo " [!] Backup file not found: $BACKUP_FILE"
        exit 1
    fi
fi

echo " Selected backup: $BACKUP_FILE"

if [ "$SKIP_CONFIRM" -eq 0 ]; then
    echo ""
    echo " ⚠️  WARNING: This will REPLACE all current data!"
    echo ""
    read -p " Are you sure you want to continue? (type 'yes' to confirm): " CONFIRM

    if [ "$CONFIRM" != "yes" ]; then
        echo " Restore cancelled."
        exit 0
    fi
else
    echo " [INFO] Non-interactive mode: skipping confirmation."
fi

# Check if MySQL container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${MYSQL_CONTAINER}$"; then
    echo " [!] MySQL container is not running. Starting..."
    docker start "$MYSQL_CONTAINER"
    sleep 10
fi

# Create a backup of current data before restore
echo ""
echo " Creating safety backup of current data..."
"$SCRIPT_DIR/backup-database.sh" || true

echo ""
echo " Restoring database..."

# Decompress and restore
if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | docker exec -i "$MYSQL_CONTAINER" mysql \
        -u"root" \
        -p"$MYSQL_ROOT_PASSWORD"
else
    docker exec -i "$MYSQL_CONTAINER" mysql \
        -u"root" \
        -p"$MYSQL_ROOT_PASSWORD" < "$BACKUP_FILE"
fi

echo ""
echo " [OK] Database data restored!"
echo ""

# ============================================
# Sync Schema (Handle New Features)
# ============================================
# This ensures any new tables/columns added AFTER the backup
# are created in the restored database

echo " Syncing database schema with current codebase..."
echo " (This adds any new tables/columns added after the backup)"
echo ""

cd "$PROJECT_DIR/backend"

# Generate Prisma client
npx prisma generate --schema=prisma/schema.prisma 2>/dev/null

# Push schema changes (creates new tables/columns, keeps existing data)
# --accept-data-loss is generally safe here as we just restored the DB
# but it's needed if there are drift changes
npx prisma db push --accept-data-loss 2>/dev/null

echo ""
echo " ========================================"
echo "  Restore Complete!"
echo " ========================================"
echo ""
echo " ✅ Database data restored from backup"
echo " ✅ Schema synced with current codebase"
echo ""
echo " IMPORTANT: Restart the backend to apply changes:"
echo "   cd backend && npm run start:dev"
