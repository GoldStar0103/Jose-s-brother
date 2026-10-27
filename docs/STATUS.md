# Monkei project status

Single checklist for what is done on production (`monkei.mx`) and what still
needs a human. Updated 2026-10-27. Ops detail lives in [RUNBOOK.md](RUNBOOK.md);
brand separation lives in [ISOLATION.md](ISOLATION.md); the owner's Spanish
guide is [MANUAL.md](MANUAL.md).

## Production snapshot

| Check | State |
|---|---|
| Store + panel + worker + Postgres + Caddy | Healthy |
| Smoke test (`scripts/smoke.mjs`) | 17 passed, 0 failed, 0 warnings (flyers resolve) |
| Public brand | MONKEI (title, logos, favicons) |
| Package scope on VPS | `@monkei/*` |
| Nightly backup cron (root) | Installed (`15 10 * * *` → `/srv/monkei`) |
| Off-box Drive folder | `gdrive:monkei-backups` (rclone configured) |
| Uptime cron (root, every 5 min) | Installed; Telegram on flip |
| External uptime | GitHub Actions `uptime.yml` → store + panel `/api/health` |
| Telegram alert credentials | Set in `.env` |
| GSC Domain + sitemap | Verified; `sitemap.xml` submitted |
| Stripe / Mercado Pago / Meta | Keys present in `.env` |
| Campaign flyers (5/5) | Uploaded under `uploads/flyers/{campaign}/…` |

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
- [x] External uptime via GitHub Actions (`.github/workflows/uptime.yml`)
- [x] Google Search Console: Domain property + HTML tag + `sitemap.xml` submitted
- [x] Smoke suite green including flyer image resolution
- [x] Real Mega Oferta E2E — `LU-261027-EB9H` (`mega_10`, $15 MXN): transfer +
      comprobante → admin approved → provider tx `1112191` succeeded → order
      `completed` (player `6584541958`, nickname MTミ★TRUENO★彡)
- [x] Off-box backup verified end-to-end — `done (local + gdrive:monkei-backups)`
- [x] `@monkei/*` rename + isolation docs committed / pushed to `origin/main`
- [x] Compose project `name: monkei`, volumes `monkei_*`, deploy path
      `/srv/monkei` (migrated live via `scripts/migrate-infra-names.sh`)
- [x] Deploy SSH user `monkei` (`levelup` removed via
      `scripts/rename-deploy-user.sh`)
- [x] All five campaign flyers live on storefront + `/promociones`

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

## Remaining (owner / brother — not blocking the stack)

| Item | Who | Notes |
|---|---|---|
| Flyer art ↔ catalog amounts/prices | Brother | SUPER PACKS + PACKS MEGA PRIME match. MINI PACKS / ENERGÍA INSANA / ¿DULCE O DIAMANTES? are marketing art that does not match catalog tiers exactly — confirm or replace. |
| Facebook / Instagram / TikTok URLs | Brother | Env keys empty; homepage correctly hides those icons until set. WhatsApp VIP + channel already set. |
| RecargasAmérica wallet top-up | Brother | Check panel Inicio “Saldo” when fulfilment pauses; fund before it hits zero. |

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
| `scripts/uptime-check.sh` | On-box health → Telegram |
| `.github/workflows/uptime.yml` | Off-box health probe (Actions) |

Git and production both carry the `@monkei` rename and Monkei brand assets.
