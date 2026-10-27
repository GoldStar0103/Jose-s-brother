# Monkei project status

Single checklist for what is done on production (`monkei.mx`) and what still
needs a human. Updated 2026-10-27 (tasks 2 / 5 / 6 closed). Ops detail lives
in [RUNBOOK.md](RUNBOOK.md); brand separation lives in
[ISOLATION.md](ISOLATION.md); the owner's Spanish guide is
[MANUAL.md](MANUAL.md).

## Production snapshot

| Check | State |
|---|---|
| Store + panel + worker + Postgres + Caddy | Healthy |
| Smoke test (`scripts/smoke.mjs`) | 16 passed, 0 failed, 1 warning (no flyers) |
| Public brand | MONKEI (title, logos, favicons) |
| Package scope on VPS | `@monkei/*` |
| Nightly backup cron (root) | Installed (`15 10 * * *`) |
| Off-box Drive folder | `gdrive:monkei-backups` (files present) |
| Uptime cron (root, every 5 min) | Installed; log shows `ok` |
| Telegram alert credentials | Set in `.env` |
| GSC HTML verification token | Set; property verified |
| Stripe / Mercado Pago / Meta | Keys present in `.env` |

Compose project, volumes and deploy path are **Monkei** (`name: monkei`,
`/srv/monkei`, `monkei_*` volumes). See [ISOLATION.md](ISOLATION.md). Migrate
an older `levelup_*` VPS with `scripts/migrate-infra-names.sh` — never flip
the compose name alone.

---

## Done

### Deploy & ops

- [x] DNS, TLS (Caddy), storefront + panel live
- [x] First admin, migrations, seed / catalog
- [x] Worker fulfilment loop running
- [x] Local backups under `/srv/monkei/backups`
- [x] Off-box rclone remote `gdrive:monkei-backups` (root rclone config)
- [x] Backup failure → Telegram (`scripts/backup.sh`)
- [x] Restore drill script (`scripts/restore-drill.sh`) — practise on scratch PG
- [x] Internal uptime watchdog → Telegram (`scripts/uptime-check.sh`)
- [x] Google Search Console: HTML tag verify + `sitemap.xml` submitted
- [x] Smoke suite green (legal pages complete, sitemap, noindex panel, etc.)
- [x] Real Mega Oferta E2E — `LU-261027-EB9H` (`mega_10`, $15 MXN): transfer +
      comprobante → admin approved → provider tx `1112191` succeeded → order
      `completed` (player `6584541958`, nickname MTミ★TRUENO★彡)
- [x] Off-box backup verified end-to-end — `scripts/backup.sh` log line
      `done (local + gdrive:monkei-backups)`; Drive holds
      `db-20261027-130546.sql.gz` + matching uploads tarball
- [x] `@monkei/*` rename + isolation docs committed / pushed to `origin/main`
- [x] Compose project `name: monkei`, volumes `monkei_*`, deploy path
      `/srv/monkei` (migrated live via `scripts/migrate-infra-names.sh`)
- [x] Deploy SSH user `monkei` (`levelup` removed via
      `scripts/rename-deploy-user.sh`)

### Brand & isolation (Monkei ≠ LevelUp Store)

- [x] Display name / OG / homepage → Monkei
- [x] Favicons + apple-icon from Monkei logo (`public/` + Docker `COPY`)
- [x] Admin panel icons match storefront
- [x] npm scope `@levelup/*` → `@monkei/*` (deployed to VPS)
- [x] Order prefix `MK-` (legacy `LU-` still looks up)
- [x] Cookies `monkei_customer_session` / `monkei_admin_session`
- [x] Payment idempotency keys `monkei-*`
- [x] Local compose Postgres on `:5433` / `monkei-postgres`
- [x] Compose / volumes / `/srv/monkei` infra names
- [x] Deploy SSH user `monkei`
- [x] `docs/ISOLATION.md` rulebook

---

## Open (needs a person — not more deploy code)

Priority order for whoever is closing the store for José's brother:

| # | Item | Who | Blocker / note |
|---|---|---|---|
| 1 | **Upload campaign flyers** in panel (Combos → campaign) | Owner | Smoke warning; store sells without them but looks unfinished |
| 3 | **GSC Owner invite** to `contactolevelupmexico@gmail.com` | Client | They must accept mail; password unknown to agent |
| 4 | **External uptime** (UptimeRobot / Better Stack → `/api/health`) | Operator | Internal cron cannot see a dead VPS |

~~2 / 5 / 6 closed 2026-10-27~~ — E2E order `LU-261027-EB9H`, off-box backup
`20261027-130546`, rename on `origin/main`.

Deliberately **not** automated (documented in RUNBOOK §6): Docker upgrades,
kernel reboot, migrations-on-deploy, certificate-expiry paging beyond
`TLS_EMAIL`.

---

## Repo hygiene (this checkout)

| Path | Role |
|---|---|
| `docs/STATUS.md` | This file — done vs open |
| `docs/ISOLATION.md` | Monkei vs LevelUp hard boundaries |
| `docs/RUNBOOK.md` | Deploy / restore / incidents |
| `docs/MANUAL.md` | Owner ops in Spanish |
| `scripts/rebuild-brand-icons.mjs` | Rebuild favicons/OG from `apps/web/src/assets/logo.png` |
| `scripts/restore-drill.sh` | Scratch restore practise |
| `scripts/uptime-check.sh` | Health → Telegram |

Git and production both carry the `@monkei` rename and Monkei brand assets.
