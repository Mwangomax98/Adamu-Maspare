# ADAMU MASPARE

POS + inventory for auto spare parts (Swahili UI). React frontend + Express API + MySQL.

## Stack

- React 19 + Vite + TypeScript + Tailwind
- Express + JWT auth (`bcryptjs`)
- MySQL 8
- Deploy target: VPS `169.58.51.195`

## Local development

1. Copy env:

```bash
cp .env.example .env
```

2. Install & create DB:

```bash
npm install
# Start MySQL locally, then:
npm run db:seed
```

3. Run API + frontend (two terminals):

```bash
npm run dev:api
npm run dev
```

Open http://localhost:3000

**Demo logins** (password `password123`): `admin`, `store`, `cashier`, `wholesale`, `retail`

Without MySQL, the UI falls back to browser `localStorage` mode.

## VPS deploy (`169.58.51.195`)

The folder `/var/www/adamu-maspare` does **not** exist until you create it (clone or run the setup script).

### One-shot setup (recommended)

SSH into the VPS, then run:

```bash
ssh root@169.58.51.195

curl -fsSL https://raw.githubusercontent.com/Mwangomax98/Adamu-Maspare/main/deploy/setup-vps.sh -o /tmp/setup-vps.sh
bash /tmp/setup-vps.sh
```

That script will:

1. `mkdir -p /var/www` and `git clone` into `/var/www/adamu-maspare`
2. Install Node 20, MySQL, Nginx, PM2
3. Create the MySQL database + `.env`
4. `npm install`, `db:seed`, `build`
5. Start the API with PM2 and configure Nginx

Open **http://169.58.51.195** — login with `admin` / `password123` (or the seed password printed at the end).

### Manual steps (if you prefer)

```bash
sudo mkdir -p /var/www
cd /var/www
sudo git clone https://github.com/Mwangomax98/Adamu-Maspare.git adamu-maspare
cd adamu-maspare
# Then: Node, MySQL, .env, npm install, db:seed, build, pm2, nginx
# Or: bash deploy/setup-vps.sh
```

### Nginx

Use [`deploy/nginx.conf`](deploy/nginx.conf) (copied automatically by the setup script).

```bash
# Firewall: allow SSH/HTTP/HTTPS only — keep MySQL closed to the world
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable
```

Then open http://169.58.51.195

## API overview

| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/auth/login` | `{ username, password }` → JWT |
| GET | `/api/bootstrap` | Full app data snapshot |
| POST | `/api/sales` | Transactional sale + stock |
| POST | `/api/stock/in` | Goods received |
| PUT | `/api/settings` | Business settings |

## Phase 1 fixes included

- Settings field names aligned with `BusinessSettings`
- Route-level RBAC in `App.tsx`
- Safe `localStorage` JSON parse
- Oversell rejected (client + server transactions)
- Real JSON backup/restore download
