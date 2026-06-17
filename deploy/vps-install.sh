#!/usr/bin/env bash
# One-time VPS bootstrap for Supereye.
# Run as root on a fresh Ubuntu/Debian VPS:
#   curl -fsSL https://raw.githubusercontent.com/YOUR_USER/supereye/main/deploy/vps-install.sh | bash
# Or after cloning:
#   sudo bash deploy/vps-install.sh

set -euo pipefail

APP_DIR="/opt/supereye"
REPO_URL="${REPO_URL:-}"

echo "==> Installing Docker..."
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
fi

echo "==> Installing Docker Compose plugin..."
if ! docker compose version &>/dev/null; then
  apt-get update -qq
  apt-get install -y docker-compose-plugin git
fi

echo "==> Creating app directory: $APP_DIR"
mkdir -p "$APP_DIR"

if [ -n "$REPO_URL" ] && [ ! -d "$APP_DIR/.git" ]; then
  echo "==> Cloning repository..."
  git clone "$REPO_URL" "$APP_DIR"
elif [ ! -d "$APP_DIR/.git" ]; then
  echo "Clone the repo manually into $APP_DIR, then re-run."
  echo "  git clone https://github.com/YOUR_USER/supereye.git $APP_DIR"
fi

if [ ! -f "$APP_DIR/.env" ]; then
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  echo ""
  echo "==> Created $APP_DIR/.env from template."
  echo "    Edit it with your secrets before starting:"
  echo "    nano $APP_DIR/.env"
  echo ""
fi

echo "==> Opening firewall ports 80 and 443 (if ufw is active)..."
if command -v ufw &>/dev/null && ufw status | grep -q active; then
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw allow 22/tcp
fi

echo ""
echo "==> VPS bootstrap complete."
echo ""
echo "Next steps:"
echo "  1. Point DNS A record: your domain → $(curl -4 -s ifconfig.me 2>/dev/null || echo 'YOUR_VPS_IP')"
echo "  2. Edit $APP_DIR/.env (see DEPLOYMENT.md)"
echo "  3. Configure GitHub secrets for CI/CD (see DEPLOYMENT.md)"
echo "  4. cd $APP_DIR && docker compose -f docker-compose.prod.yml up -d"
echo ""
