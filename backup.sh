#!/bin/sh
# Legacy Vault - SQLite Backup Script
# Creates timestamped backups with configurable retention.
# Usage: ./backup.sh [backup_dir] [retain_count]
#   backup_dir   - where to store backups (default: /app/backups)
#   retain_count - how many backups to keep (default: 30)

set -e

DB_PATH="${DB_PATH:-/app/data/vault.db}"
BACKUP_DIR="${1:-/app/backups}"
RETAIN="${2:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/vault_${TIMESTAMP}.db"

if [ ! -f "$DB_PATH" ]; then
  echo "ERROR: Database not found at $DB_PATH"
  exit 1
fi

mkdir -p "$BACKUP_DIR"

# Use SQLite's .backup command for a safe, consistent copy (even with WAL mode)
sqlite3 "$DB_PATH" ".backup '${BACKUP_FILE}'"

# Verify the backup is valid
sqlite3 "$BACKUP_FILE" "PRAGMA integrity_check;" > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "ERROR: Backup integrity check failed"
  rm -f "$BACKUP_FILE"
  exit 1
fi

SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "OK: Backup created at ${BACKUP_FILE} (${SIZE})"

# Prune old backups beyond retention count
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/vault_*.db 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt "$RETAIN" ]; then
  REMOVE_COUNT=$((BACKUP_COUNT - RETAIN))
  ls -1t "$BACKUP_DIR"/vault_*.db | tail -n "$REMOVE_COUNT" | while read f; do
    rm -f "$f"
    echo "Pruned old backup: $f"
  done
fi
