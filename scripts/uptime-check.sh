#!/usr/bin/env bash
#
# Local uptime watchdog: hit the public health endpoints and Telegram a human
# when they flip to down (and once when they recover). Install in root's
# crontab every few minutes:
#
#   */5 * * * * cd /srv/levelup && bash scripts/uptime-check.sh >> /var/log/levelup-uptime.log 2>&1
#
# This catches "compose is up but the site is 503" and similar. It does NOT
# replace an external monitor: if the whole VPS is dead, this cron is dead too.
# Point UptimeRobot (or similar) at https://$PUBLIC_DOMAIN/api/health as well.
#
# .env is read, never sourced — same rule as scripts/backup.sh.

set -euo pipefail

env_file_value() {
  local key="$1" file=".env" line value
  [ -r "$file" ] || return 0
  line="$(grep -E "^[[:space:]]*${key}=" "$file" | tail -n 1 || true)"
  [ -n "$line" ] || return 0
  value="${line#*=}"
  value="${value%$'\r'}"
  case "$value" in
    \"*\") value="${value#\"}"; value="${value%\"}" ;;
    \'*\') value="${value#\'}"; value="${value%\'}" ;;
    *)
      value="${value%%[[:space:]]#*}"
      value="${value%"${value##*[![:space:]]}"}"
      ;;
  esac
  printf '%s' "$value"
}

setting() {
  local key="$1" default="$2" value
  value="${!key:-}"
  if [ -z "$value" ]; then
    value="$(env_file_value "$key")"
  fi
  printf '%s' "${value:-$default}"
}

PUBLIC_DOMAIN="$(setting PUBLIC_DOMAIN '')"
ADMIN_DOMAIN="$(setting ADMIN_DOMAIN '')"
TOKEN="$(setting TELEGRAM_BOT_TOKEN '')"
CHAT="$(setting TELEGRAM_ALERT_CHAT_ID '')"
STATE_DIR="$(setting UPTIME_STATE_DIR '/var/lib/levelup')"
STATE_FILE="$STATE_DIR/uptime-state"

if [ -z "$PUBLIC_DOMAIN" ]; then
  echo "[uptime] PUBLIC_DOMAIN unset; nothing to check" >&2
  exit 1
fi

mkdir -p "$STATE_DIR"

notify() {
  local text="$1"
  [ -n "$TOKEN" ] && [ -n "$CHAT" ] || {
    echo "[uptime] telegram unset; would have sent: $text" >&2
    return 0
  }
  curl -fsS --max-time 15 \
    -X POST "https://api.telegram.org/bot${TOKEN}/sendMessage" \
    --data-urlencode "chat_id=${CHAT}" \
    --data-urlencode "text=${text}" \
    >/dev/null 2>&1 || echo "[uptime] telegram alert could not be sent" >&2
}

check_url() {
  local url="$1"
  local code body
  # Two tries: a single blip should not page anyone.
  if body="$(curl -fsS --max-time 15 -o /tmp/levelup-uptime-body.$$ -w '%{http_code}' "$url" 2>/dev/null)"; then
    code="$body"
    if [ "$code" = "200" ] && grep -Eq '"status"[[:space:]]*:[[:space:]]*"ok"' /tmp/levelup-uptime-body.$$ 2>/dev/null; then
      rm -f /tmp/levelup-uptime-body.$$
      return 0
    fi
  fi
  sleep 3
  if body="$(curl -fsS --max-time 15 -o /tmp/levelup-uptime-body.$$ -w '%{http_code}' "$url" 2>/dev/null)"; then
    code="$body"
    if [ "$code" = "200" ] && grep -Eq '"status"[[:space:]]*:[[:space:]]*"ok"' /tmp/levelup-uptime-body.$$ 2>/dev/null; then
      rm -f /tmp/levelup-uptime-body.$$
      return 0
    fi
  fi
  rm -f /tmp/levelup-uptime-body.$$
  return 1
}

failures=""
if ! check_url "https://${PUBLIC_DOMAIN}/api/health"; then
  failures="${failures} store(https://${PUBLIC_DOMAIN}/api/health)"
fi
if [ -n "$ADMIN_DOMAIN" ]; then
  if ! check_url "https://${ADMIN_DOMAIN}/api/health"; then
    failures="${failures}${failures:+ }panel(https://${ADMIN_DOMAIN}/api/health)"
  fi
fi

prev="up"
if [ -f "$STATE_FILE" ]; then
  prev="$(cat "$STATE_FILE" 2>/dev/null || echo up)"
fi

now="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
if [ -z "$failures" ]; then
  echo "[uptime] $now ok"
  if [ "$prev" = "down" ]; then
    notify "✅ Uptime recovered on ${PUBLIC_DOMAIN} (store${ADMIN_DOMAIN:+ + panel} healthy again)"
  fi
  printf 'up\n' >"$STATE_FILE"
  exit 0
fi

echo "[uptime] $now DOWN: $failures" >&2
if [ "$prev" != "down" ]; then
  notify "🚨 Uptime DOWN on ${PUBLIC_DOMAIN}
Failed: ${failures}
(Local watchdog — also keep an external monitor on /api/health)"
fi
printf 'down\n' >"$STATE_FILE"
exit 1
