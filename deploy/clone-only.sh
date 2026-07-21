#!/usr/bin/env bash
# Minimal: only create /var/www/adamu-maspare from GitHub (run on VPS)
set -euo pipefail
apt-get update -y
apt-get install -y git
mkdir -p /var/www
if [[ -d /var/www/adamu-maspare/.git ]]; then
  cd /var/www/adamu-maspare && git pull origin main
else
  rm -rf /var/www/adamu-maspare
  git clone https://github.com/Mwangomax98/Adamu-Maspare.git /var/www/adamu-maspare
fi
echo "OK: /var/www/adamu-maspare is ready"
ls -la /var/www/adamu-maspare | head
