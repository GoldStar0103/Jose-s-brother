# Isolating Monkei from LevelUp Store

Monkei (`monkei.mx`) and LevelUp Store are **two businesses**. They share a
code lineage, not credentials, data, or customers. This file is the rulebook
so one store cannot silently affect the other.

## Hard boundaries (never cross)

| Asset | Monkei | LevelUp |
|---|---|---|
| Domain | `monkei.mx` / `panel.monkei.mx` | LevelUp's own domain |
| VPS / Hostinger account | Monkei's | LevelUp's |
| RecargasAmérica API key + wallet | Monkei's | LevelUp's |
| Stripe / Mercado Pago | Monkei's | LevelUp's |
| Telegram bot + alert chat | Monkei's | LevelUp's |
| Meta / TikTok pixels | Monkei's | LevelUp's |
| Postgres data | Monkei's volume / database | LevelUp's |
| Uploads (flyers, comprobantes) | Monkei's volume | LevelUp's |
| Admin accounts | Monkei's panel users | LevelUp's |
| Google Drive backup folder | Prefer `gdrive:monkei-backups` | LevelUp's own remote/folder |
| Git remote / checkout | This repo (brother / Monkei) | LevelUp's repo |

Copying a secret from one `.env` into the other is the most common failure
mode. Treat it as a security incident if it happens.

## Code / product identity (this repo)

- npm packages are scoped `@monkei/*` (not `@levelup/*`).
- New storefront orders use the `MK-` prefix (legacy `LU-` rows still look up).
- Session cookies are `monkei_*` so a browser logged into one panel does not
  ride into the other if both are open.
- Brand art: `apps/web/src/assets/logo.png`. Favicons and the OG logo data URL
  are rebuilt from it with `node scripts/rebuild-brand-icons.mjs`.
- "Level Pass" is a **product feature name**, not the LevelUp brand. Leave it.

## Infra names (also Monkei)

Compose project, Docker volumes, deploy path and in-container upload path are
**Monkei** — not LevelUp leftovers:

| Item | Value |
|---|---|
| Compose project | `name: monkei` |
| Volumes | `monkei_postgres_data`, `monkei_uploads`, `monkei_caddy_*` |
| Deploy path | `/srv/monkei` |
| Upload mount | `/srv/monkei/uploads` |
| Worker heartbeat | `/var/run/monkei/heartbeat` |
| Ops logs | `/var/log/monkei-backup.log`, `/var/log/monkei-uptime.log` |

Migrating an already-running VPS that still has `levelup_*` volumes /
`/srv/levelup` is **`scripts/migrate-infra-names.sh`** (copies volumes, moves
the tree, rewrites cron/.env, brings the stack back). Flipping `name:` alone
creates empty volumes and looks like a wiped store.

Still often left as historical Postgres plumbing inside `.env` (safe; not
shared with LevelUp Store):

- OS deploy user on an already-provisioned host may still be `levelup` (SSH);
  new installs from `server-setup.sh` default to `monkei`.
- `POSTGRES_USER` / `POSTGRES_DB` / `DATABASE_URL` may still say `levelup` if
  that is how the cluster was first initialised — renaming the role is a
  separate DB migration and is not required for brand isolation.

## Local development without collisions

If LevelUp and Monkei checkouts ever run on the **same** machine:

1. Use **different** `POSTGRES_PORT` (this `.env.example` defaults to `5433`).
2. Use the `monkei-postgres` compose service name (not LevelUp's container).
3. Never point `DATABASE_URL` at the other store's database.
4. Never set `WORKER_DRY_RUN` / dry-run flags against a remote production DB
   (see `packages/shared/src/dry-run.ts`).

## Backups

- Nightly job: `scripts/backup.sh` → local `/srv/monkei/backups` + off-box
  `BACKUP_RCLONE_REMOTE`.
- Prefer a Drive folder named for **this** store (`gdrive:monkei-backups`).
  Do not write Monkei dumps into a LevelUp backup folder.
- Restore drill: `bash scripts/restore-drill.sh` (scratch Postgres only).

## Operational checklist before sharing anything with LevelUp's operator

- [ ] Domains and DNS are only Monkei's
- [ ] Every `*_SECRET`, `*_KEY`, `*_TOKEN` in `.env` is Monkei's
- [ ] Panel admins are Monkei's people
- [ ] Telegram alerts go to Monkei's chat
- [ ] Backup remote is Monkei's folder
- [ ] No shared Hostinger root / deploy keys beyond intentional break-glass
