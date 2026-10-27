#!/usr/bin/env bash
#
# Switch the VPS deploy user from levelup → monkei without locking yourself out.
#
# Renaming the logged-in account in place fails (usermod: user is currently
# used). Creating monkei beside levelup, copying the SSH key, then deleting
# levelup is the reliable path. Container processes often run as uid 1000 —
# never `pkill -u levelup` or you will kill the Node apps.
#
#   sudo bash scripts/rename-deploy-user.sh
#
# Then from your laptop:
#
#   ssh -i ~/.ssh/monkei_vps monkei@<vps-ip>

set -euo pipefail

OLD_USER="${OLD_USER:-levelup}"
NEW_USER="${NEW_USER:-monkei}"
APP_DIR="${APP_DIR:-/srv/monkei}"

die() { echo "ERROR: $*" >&2; exit 1; }
log() { echo "[rename-user] $*"; }

[ "$(id -u)" -eq 0 ] || die "run as root (sudo bash scripts/rename-deploy-user.sh)"

if id -u "$NEW_USER" >/dev/null 2>&1 && ! id -u "$OLD_USER" >/dev/null 2>&1; then
  log "already done — only $NEW_USER exists"
  id "$NEW_USER"
  exit 0
fi

id -u "$OLD_USER" >/dev/null 2>&1 || die "source user $OLD_USER does not exist"

if ! id -u "$NEW_USER" >/dev/null 2>&1; then
  log "creating $NEW_USER"
  useradd --create-home --user-group --shell /bin/bash --password '*' "$NEW_USER"
fi
usermod -aG sudo,docker "$NEW_USER"

OLD_HOME="$(getent passwd "$OLD_USER" | cut -d: -f6)"
NEW_HOME="$(getent passwd "$NEW_USER" | cut -d: -f6)"
[ -n "$OLD_HOME" ] && [ -n "$NEW_HOME" ] || die "could not resolve home directories"

log "copying SSH authorized_keys"
install -d -m 0700 -o "$NEW_USER" -g "$NEW_USER" "$NEW_HOME/.ssh"
if [ -f "$OLD_HOME/.ssh/authorized_keys" ]; then
  install -m 0600 -o "$NEW_USER" -g "$NEW_USER" \
    "$OLD_HOME/.ssh/authorized_keys" "$NEW_HOME/.ssh/authorized_keys"
else
  die "$OLD_HOME/.ssh/authorized_keys missing — refuse to leave $NEW_USER without a key"
fi

log "sudoers"
printf '# Managed by scripts/rename-deploy-user.sh.\n%s ALL=(ALL:ALL) NOPASSWD:ALL\n' "$NEW_USER" \
  > "/etc/sudoers.d/90-${NEW_USER}-deploy"
chmod 440 "/etc/sudoers.d/90-${NEW_USER}-deploy"
visudo -cf "/etc/sudoers.d/90-${NEW_USER}-deploy" >/dev/null
rm -f "/etc/sudoers.d/90-${OLD_USER}-deploy"
if [ -f /etc/sudoers.d/90-cloud-init-users ]; then
  sed -i "s/\\b${OLD_USER}\\b/${NEW_USER}/g" /etc/sudoers.d/90-cloud-init-users || true
fi

[ -f "/etc/ssh/sshd_config.d/00-${OLD_USER}-hardening.conf" ] && \
  mv "/etc/ssh/sshd_config.d/00-${OLD_USER}-hardening.conf" \
     "/etc/ssh/sshd_config.d/00-${NEW_USER}-hardening.conf"
[ -f "/etc/fail2ban/jail.d/${OLD_USER}-sshd.local" ] && \
  mv "/etc/fail2ban/jail.d/${OLD_USER}-sshd.local" \
     "/etc/fail2ban/jail.d/${NEW_USER}-sshd.local"

if [ -d "$APP_DIR" ]; then
  log "chown $APP_DIR → $NEW_USER"
  chown -R "$NEW_USER:$NEW_USER" "$APP_DIR"
fi

log "locking and removing $OLD_USER"
passwd -l "$OLD_USER" >/dev/null 2>&1 || true
usermod -s /usr/sbin/nologin "$OLD_USER" || true
# Serial console (ttyS0) may hold a login shell — kill only shells/sshd, never -u.
while read -r pid tty; do
  [ -n "$pid" ] || continue
  case "$tty" in
    ttyS*|tty1|pts/*|?) kill -9 "$pid" 2>/dev/null || true ;;
  esac
done < <(ps -u "$OLD_USER" -o pid=,tty=,cmd= | awk '/bash|sshd|login/{print $1, $2}')
sleep 1
userdel -f -r "$OLD_USER"

id "$NEW_USER" >/dev/null
getent passwd "$OLD_USER" >/dev/null 2>&1 && die "$OLD_USER still present"
sudo -u "$NEW_USER" -n true
sudo -u "$NEW_USER" docker ps >/dev/null

cat <<EOF

[rename-user] DONE.

  SSH as:  ssh ${NEW_USER}@<vps-ip>
  Home:    ${NEW_HOME}
  App dir: ${APP_DIR}

Confirm a fresh session as ${NEW_USER} before closing any remaining ${OLD_USER} window.
EOF
