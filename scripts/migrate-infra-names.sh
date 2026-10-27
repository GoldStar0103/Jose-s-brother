#!/usr/bin/env bash
#
# One-shot: rename Compose project + /srv/levelup → Monkei on a live VPS
# without wiping Postgres or uploads.
#
# Safe sequence:
#   1. Fresh local+off-box backup
#   2. docker compose down (containers only; volumes kept)
#   3. Copy levelup_* Docker volumes → monkei_*
#   4. Move /srv/levelup → /srv/monkei
#   5. Rewrite UPLOAD_DIR in .env and root crontab paths
#   6. Bring the stack up from /srv/monkei with name: monkei
#   7. Smoke health checks
#
# Run as the deploy user with sudo, from the CURRENT tree (still /srv/levelup
# until step 4):
#
#   cd /srv/levelup && sudo bash scripts/migrate-infra-names.sh
#
# Re-run is refused once /srv/monkei exists and monkei_postgres_data is present.

set -euo pipefail

OLD_ROOT="${OLD_ROOT:-/srv/levelup}"
NEW_ROOT="${NEW_ROOT:-/srv/monkei}"
COMPOSE_FILE="docker-compose.prod.yml"
COMPOSE="docker compose -f $COMPOSE_FILE"

die() { echo "ERROR: $*" >&2; exit 1; }
log() { echo "[migrate] $*"; }

[ "$(id -u)" -eq 0 ] || die "run as root (sudo bash scripts/migrate-infra-names.sh)"
[ -d "$OLD_ROOT" ] || die "expected $OLD_ROOT (already migrated?)"
[ -f "$OLD_ROOT/$COMPOSE_FILE" ] || die "no $COMPOSE_FILE under $OLD_ROOT"
if [ -e "$NEW_ROOT" ]; then
  # A failed earlier attempt may have mkdir'd an empty backups dir via the new
  # backup.sh default DEST. Only refuse when the tree looks like a real deploy.
  if [ -f "$NEW_ROOT/$COMPOSE_FILE" ] || [ -d "$NEW_ROOT/apps" ]; then
    die "$NEW_ROOT already exists — refusing to clobber"
  fi
  log "removing incomplete $NEW_ROOT from a prior attempt"
  rm -rf "$NEW_ROOT"
fi

cd "$OLD_ROOT"

# Compose file in the tree we are about to move must already say name: monkei
# and monkei_* volume names (deploy the repo update first).
grep -q '^name: monkei' "$COMPOSE_FILE" || die "$COMPOSE_FILE must already have name: monkei"
grep -q 'name: monkei_postgres_data' "$COMPOSE_FILE" || die "$COMPOSE_FILE must declare monkei_postgres_data"

# While containers still belong to the historical project, force that name so
# compose talks to the running stack (the file already says name: monkei).
OLD_COMPOSE="docker compose -p levelup -f $COMPOSE_FILE"

log "pre-migration backup (against project levelup)"
COMPOSE_PROJECT_NAME=levelup bash scripts/backup.sh "$OLD_ROOT/backups"

log "stopping stack (volumes retained)"
$OLD_COMPOSE down

copy_vol() {
  local from="$1" to="$2" from_sz to_sz
  docker volume inspect "$from" >/dev/null 2>&1 || die "missing source volume $from"
  if docker volume inspect "$to" >/dev/null 2>&1; then
    from_sz="$(docker run --rm -v "$from":/d:ro alpine:3 sh -c 'du -s /d | cut -f1')"
    to_sz="$(docker run --rm -v "$to":/d alpine:3 sh -c 'du -s /d | cut -f1')"
    if [ "$from_sz" = "$to_sz" ] && [ "$to_sz" -gt 0 ]; then
      log "volume $to already matches $from ($to_sz blocks) — keeping"
      return 0
    fi
    log "removing incomplete $to (from=$from_sz to=$to_sz)"
    docker volume rm "$to" >/dev/null
  fi
  log "copy volume $from → $to"
  docker volume create "$to" >/dev/null
  docker run --rm \
    -v "$from":/from:ro \
    -v "$to":/to \
    alpine:3 \
    sh -c 'cd /from && cp -a . /to/'
  from_sz="$(docker run --rm -v "$from":/d:ro alpine:3 sh -c 'du -s /d | cut -f1')"
  to_sz="$(docker run --rm -v "$to":/d alpine:3 sh -c 'du -s /d | cut -f1')"
  [ "$from_sz" = "$to_sz" ] || die "size mismatch copying $from → $to ($from_sz vs $to_sz)"
}

copy_vol levelup_postgres_data monkei_postgres_data
copy_vol levelup_uploads        monkei_uploads
copy_vol levelup_caddy_data     monkei_caddy_data
copy_vol levelup_caddy_config   monkei_caddy_config

log "moving $OLD_ROOT → $NEW_ROOT"
mv "$OLD_ROOT" "$NEW_ROOT"
cd "$NEW_ROOT"

if [ -f .env ]; then
  # In-container path only — do not touch DATABASE_URL / POSTGRES_* role names.
  if grep -q '^UPLOAD_DIR=' .env; then
    sed -i 's#^UPLOAD_DIR=/srv/levelup/uploads#UPLOAD_DIR=/srv/monkei/uploads#' .env
  else
    printf '\nUPLOAD_DIR=/srv/monkei/uploads\n' >> .env
  fi
  if grep -q '^WORKER_HEARTBEAT_FILE=' .env; then
    sed -i 's#^WORKER_HEARTBEAT_FILE=/var/run/levelup/#WORKER_HEARTBEAT_FILE=/var/run/monkei/#' .env
  fi
fi

log "rewriting root crontab paths"
CRON_TMP="$(mktemp)"
crontab -l 2>/dev/null | \
  sed -e 's#/srv/levelup#/srv/monkei#g' \
      -e 's#/var/log/levelup-#/var/log/monkei-#g' \
  > "$CRON_TMP" || true
if [ -s "$CRON_TMP" ]; then
  crontab "$CRON_TMP"
fi
rm -f "$CRON_TMP"

# Preserve old log history under the new names when possible.
[ -f /var/log/levelup-backup.log ] && mv -n /var/log/levelup-backup.log /var/log/monkei-backup.log || true
[ -f /var/log/levelup-uptime.log ] && mv -n /var/log/levelup-uptime.log /var/log/monkei-uptime.log || true
mkdir -p /var/lib/monkei
[ -d /var/lib/levelup ] && cp -a /var/lib/levelup/. /var/lib/monkei/ 2>/dev/null || true

log "starting Monkei stack from $NEW_ROOT"
$COMPOSE up -d --build

log "waiting for health"
for i in $(seq 1 60); do
  web="$($COMPOSE ps web --format '{{.Status}}' 2>/dev/null || true)"
  admin="$($COMPOSE ps admin --format '{{.Status}}' 2>/dev/null || true)"
  worker="$($COMPOSE ps worker --format '{{.Status}}' 2>/dev/null || true)"
  pg="$($COMPOSE ps postgres --format '{{.Status}}' 2>/dev/null || true)"
  echo "  web=$web | admin=$admin | worker=$worker | postgres=$pg"
  echo "$web" | grep -qi healthy && \
  echo "$admin" | grep -qi healthy && \
  echo "$worker" | grep -qi healthy && \
  echo "$pg" | grep -qi healthy && break
  sleep 5
done

curl -fsS https://monkei.mx/api/health >/dev/null
curl -fsS https://panel.monkei.mx/api/health >/dev/null
log "store + panel /api/health ok"

# Order count smoke — proves Postgres data survived the volume copy.
ORDERS="$($COMPOSE exec -T postgres \
  psql -U "$(grep ^POSTGRES_USER= .env | cut -d= -f2-)" \
       -d "$(grep ^POSTGRES_DB= .env | cut -d= -f2-)" \
       -tAc 'SELECT count(*) FROM orders' | tr -d '[:space:]')"
[ -n "$ORDERS" ] && [ "$ORDERS" -ge 1 ] || die "orders table empty or unreachable after migration"
log "postgres ok ($ORDERS orders present)"

cat <<EOF

[migrate] DONE.

  Deploy path : $NEW_ROOT
  Compose     : name: monkei
  Volumes     : monkei_postgres_data, monkei_uploads, monkei_caddy_*

Old levelup_* volumes are still on disk as a safety net. After a quiet day
or two and another successful backup:

  docker volume rm levelup_postgres_data levelup_uploads levelup_caddy_data levelup_caddy_config

SSH user is unchanged (still whatever provisioned this host). New installs
from server-setup.sh default to deploy user monkei.
EOF
