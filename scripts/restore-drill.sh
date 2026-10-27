#!/usr/bin/env bash
#
# One-shot restore drill: prove the off-box backup pair can be fetched,
# restored into a disposable Postgres, and that uploads extract — without
# touching production containers or volumes.
#
# Usage (on the VPS, as levelup):
#   bash scripts/restore-drill.sh [db-YYYYMMDD-HHMMSS.sql.gz]
# If no stamp file is given, uses the newest db-*.sql.gz on the remote.

set -euo pipefail

REMOTE="${BACKUP_RCLONE_REMOTE:-gdrive:monkei-backups}"
SCRATCH_NAME="monkei-restore-drill-pg"
SCRATCH_VOL="monkei_restore_drill_data"
PASS="drill-only-throwaway"
DRILL="$(mktemp -d /tmp/restore-drill.XXXXXX)"

cleanup() {
  echo "[drill] cleanup"
  docker rm -f "$SCRATCH_NAME" >/dev/null 2>&1 || true
  docker volume rm "$SCRATCH_VOL" >/dev/null 2>&1 || true
  rm -rf "$DRILL"
}
trap cleanup EXIT

if [ "${1:-}" != "" ]; then
  DB_FILE="$1"
else
  DB_FILE="$(sudo rclone lsf "$REMOTE" | grep -E '^db-[0-9]{8}-[0-9]{6}\.sql\.gz$' | sort | tail -n 1)"
fi
if [ -z "$DB_FILE" ]; then
  echo "[drill] FAIL: no db-*.sql.gz on $REMOTE" >&2
  exit 1
fi
STAMP="${DB_FILE#db-}"
STAMP="${STAMP%.sql.gz}"
UPLOADS_FILE="uploads-$STAMP.tar.gz"

echo "[drill] remote=$REMOTE stamp=$STAMP"
echo "[drill] 1/6 fetch off-box copies"
sudo rclone copy "$REMOTE/$DB_FILE" "$DRILL/"
sudo rclone copy "$REMOTE/$UPLOADS_FILE" "$DRILL/"
sudo chown -R "$(id -u):$(id -g)" "$DRILL"
ls -lh "$DRILL"

echo "[drill] 2/6 integrity: gzip + tar"
gunzip -t "$DRILL/$DB_FILE" && echo "db gzip: OK"
tar -tzf "$DRILL/$UPLOADS_FILE" >/dev/null && echo "uploads tar: OK"
echo "uploads top entries:"
tar -tzf "$DRILL/$UPLOADS_FILE" | head -n 15

echo "[drill] 3/6 scratch Postgres (isolated volume, not production)"
docker volume create "$SCRATCH_VOL" >/dev/null
docker run -d --name "$SCRATCH_NAME" \
  -e POSTGRES_USER=levelup \
  -e POSTGRES_PASSWORD="$PASS" \
  -e POSTGRES_DB=levelup \
  -v "$SCRATCH_VOL":/var/lib/postgresql/data \
  postgres:17-alpine >/dev/null

ready=0
for _ in $(seq 1 40); do
  if docker exec "$SCRATCH_NAME" pg_isready -U levelup -d levelup >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 1
done
if [ "$ready" -ne 1 ]; then
  echo "[drill] FAIL: scratch postgres did not become ready" >&2
  exit 1
fi
echo "scratch postgres: ready"

echo "[drill] 4/6 restore dump into scratch"
gunzip -c "$DRILL/$DB_FILE" \
  | docker exec -i "$SCRATCH_NAME" \
      psql --username levelup --dbname levelup -v ON_ERROR_STOP=1 \
      >"$DRILL/restore.log" 2>&1
echo "psql restore: OK (ON_ERROR_STOP)"
tail -n 8 "$DRILL/restore.log"

echo "[drill] 5/6 sanity queries (scratch only)"
docker exec "$SCRATCH_NAME" psql --username levelup --dbname levelup -v ON_ERROR_STOP=1 -c "
SELECT
  (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') AS public_tables,
  (SELECT count(*) FROM orders) AS orders,
  (SELECT count(*) FROM combos) AS combos,
  (SELECT count(*) FROM admin_users) AS admins;
"
docker exec "$SCRATCH_NAME" psql --username levelup --dbname levelup -v ON_ERROR_STOP=1 -c "
SELECT order_number, player_id, status, price_mxn_cents
FROM orders
ORDER BY created_at DESC
LIMIT 5;
"

echo "[drill] 6/6 extract uploads to scratch dir (not the live volume)"
mkdir -p "$DRILL/uploads-out"
tar -xzf "$DRILL/$UPLOADS_FILE" -C "$DRILL/uploads-out"
echo "extracted sample:"
find "$DRILL/uploads-out" -type f | head -n 20
echo "file count: $(find "$DRILL/uploads-out" -type f | wc -l)"

echo
echo "[drill] PASS — off-box pair is readable, DB restores into scratch Postgres, uploads extract"
echo "[drill] production containers were not stopped or written to"
