#!/usr/bin/env bash
# Sonkhang ERP — backup DB hàng đêm.
# Cron mẫu (chạy 2h sáng mỗi ngày, giữ log):
#   0 2 * * * cd /opt/sonkhang-erp && ./scripts/backup-db.sh >> /var/log/sonkhang-backup.log 2>&1
set -euo pipefail

BACKUP_DIR="$(cd "$(dirname "$0")/.." && pwd)/backups"
mkdir -p "$BACKUP_DIR"

STAMP="$(date +%F)"
docker compose exec -T postgres pg_dump -U "${POSTGRES_USER:-postgres}" sonkhang_erp \
  | gzip > "$BACKUP_DIR/dump-$STAMP.sql.gz"

# Giữ bản backup 30 ngày gần nhất
find "$BACKUP_DIR" -name 'dump-*.sql.gz' -mtime +30 -delete

echo "[backup-db] OK: $BACKUP_DIR/dump-$STAMP.sql.gz"
