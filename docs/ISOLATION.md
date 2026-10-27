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

## What stays named `levelup` on the live Monkei VPS (on purpose)

Renaming these on a running server creates **empty** Docker volumes and looks
like a wiped store:

- Compose project `name: levelup` → volumes `levelup_uploads`, `levelup_postgres_data`
- Deploy path `/srv/levelup`
- OS deploy user `levelup`
- Historical Postgres role/database name if that is what `.env` already uses

Public brand is Monkei; those names are only Docker/OS plumbing. Documented
again on `docker-compose.prod.yml`.

## Local development without collisions

If LevelUp and Monkei checkouts ever run on the **same** machine:

1. Use **different** `POSTGRES_PORT` (this `.env.example` defaults to `5433`).
2. Use the `monkei-postgres` compose service name (not LevelUp's container).
3. Never point `DATABASE_URL` at the other store's database.
4. Never set `WORKER_DRY_RUN` / dry-run flags against a remote production DB
   (see `packages/shared/src/dry-run.ts`).

## Backups

- Nightly job: `scripts/backup.sh` → local `/srv/levelup/backups` + off-box
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
