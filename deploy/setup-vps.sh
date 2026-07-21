#!/usr/bin/env bash
# Run on the VPS as root (or with sudo):
#   curl -fsSL https://raw.githubusercontent.com/Mwangomax98/Adamu-Maspare/main/deploy/setup-vps.sh | bash
# Or after clone:
#   bash deploy/setup-vps.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/adamu-maspare}"
REPO_URL="${REPO_URL:-https://github.com/Mwangomax98/Adamu-Maspare.git}"
DB_NAME="${DB_NAME:-adamu_maspare}"
DB_USER="${DB_USER:-adamu}"
DB_PASS="${DB_PASS:-$(openssl rand -base64 18 | tr -dc 'A-Za-z0-9' | head -c 20)}"
JWT_SECRET="${JWT_SECRET:-$(openssl rand -hex 32)}"
SEED_PASSWORD="${SEED_PASSWORD:-password123}"
APP_PORT="${APP_PORT:-3001}"

echo "==> Installing packages (Node 20, MySQL, Nginx, Git, PM2)..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl ca-certificates gnupg git nginx mysql-server ufw

if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt 18 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

npm install -g pm2

echo "==> Creating app directory and cloning repo..."
mkdir -p /var/www
if [[ -d "$APP_DIR/.git" ]]; then
  cd "$APP_DIR"
  git fetch origin
  git reset --hard origin/main
else
  rm -rf "$APP_DIR"
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

echo "==> Configuring MySQL database..."
# Ensure MySQL is running
systemctl enable mysql
systemctl start mysql

mysql -e "CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"
mysql -e "ALTER USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"
mysql -e "GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost'; FLUSH PRIVILEGES;"

echo "==> Writing .env..."
cat > "$APP_DIR/.env" <<EOF
PORT=${APP_PORT}
JWT_SECRET=${JWT_SECRET}
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASS}
DB_NAME=${DB_NAME}
SEED_PASSWORD=${SEED_PASSWORD}
VITE_API_URL=/api
VITE_USE_API=true
APP_URL=http://169.58.51.195
EOF
chmod 600 "$APP_DIR/.env"

echo "==> npm install, seed DB, build frontend..."
cd "$APP_DIR"
npm install
npm run db:seed
npm run build

echo "==> Starting API with PM2..."
pm2 delete adamu-api 2>/dev/null || true
pm2 start npm --name adamu-api -- start
pm2 save
pm2 startup systemd -u root --hp /root >/tmp/pm2-startup.txt 2>&1 || true
# shellcheck disable=SC1091
bash /tmp/pm2-startup.txt 2>/dev/null || true

echo "==> Configuring Nginx..."
cp "$APP_DIR/deploy/nginx.conf" /etc/nginx/sites-available/adamu-maspare
ln -sfn /etc/nginx/sites-available/adamu-maspare /etc/nginx/sites-enabled/adamu-maspare
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo "==> Firewall (SSH + HTTP/HTTPS only)..."
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable || true

echo ""
echo "============================================"
echo " ADAMU MASPARE is deployed"
echo " URL:  http://169.58.51.195"
echo " App:  $APP_DIR"
echo " Login users: admin / store / cashier / wholesale / retail"
echo " Password:    $SEED_PASSWORD"
echo " DB user:     $DB_USER"
echo " DB pass:     $DB_PASS   (saved in $APP_DIR/.env)"
echo "============================================"
echo "Save the DB password above — it will not be shown again."
