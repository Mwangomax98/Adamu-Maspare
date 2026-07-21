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

```bash
# SSH
ssh root@169.58.51.195

# Install Node 20, MySQL, Nginx, PM2 (Ubuntu example)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs mysql-server nginx
npm i -g pm2

# App
cd /var/www
git clone <your-repo-url> adamu-maspare
cd adamu-maspare
cp .env.example .env
# Edit .env — set DB_PASSWORD, JWT_SECRET, DB_USER

# MySQL
mysql -e "CREATE DATABASE adamu_maspare; CREATE USER 'adamu'@'localhost' IDENTIFIED BY 'your_mysql_password'; GRANT ALL ON adamu_maspare.* TO 'adamu'@'localhost'; FLUSH PRIVILEGES;"
npm run db:seed

npm install
npm run build
pm2 start npm --name adamu-api -- start
pm2 save
pm2 startup
```

### Nginx

```nginx
server {
  listen 80;
  server_name 169.58.51.195;

  location /api/ {
    proxy_pass http://127.0.0.1:3001/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }

  location / {
    proxy_pass http://127.0.0.1:3001/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
  }
}
```

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
