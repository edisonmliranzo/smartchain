# SmartChain VPS Deployment Guide

This guide will help you deploy your SmartChain node to a VPS so the explorer works for everyone.

## Prerequisites

1. **A VPS** from any provider:
   - DigitalOcean ($6/mo droplet)
   - Contabo ($4.99/mo VPS)
   - Linode, Vultr, AWS EC2, etc.
   - **Minimum specs**: 1 vCPU, 1GB RAM, 20GB SSD, Ubuntu 22.04

2. **A domain** (optional but recommended for SSL):
   - e.g., `node.smartchain.yourdomain.com`

3. **SSH access** to your VPS

---

## Step 1: Connect to Your VPS

```bash
ssh root@YOUR_VPS_IP
```

---

## Step 2: Install Dependencies

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs

# Install PM2 (process manager)
npm install -g pm2

# Install Git
apt install -y git

# Verify installations
node -v  # Should show v20.x.x
npm -v
pm2 -v
```

---

## Step 3: Clone Your Repository

```bash
# Create app directory
mkdir -p /opt/smartchain
cd /opt/smartchain

# Clone your repo
git clone https://github.com/edisonmliranzo/smartchain.git .

# Install dependencies
npm install
```

---

## Step 4: Configure Environment

```bash
# Create .env file
cat > .env << 'EOF'
# OpenAI API Key (optional, for AI features)
OPENAI_API_KEY=your_openai_key_here

# Node Configuration
NODE_ENV=production
EOF
```

---

## Step 5: Start the Node with PM2

```bash
# Build TypeScript (if needed)
npm run build

# Start with PM2
pm2 start dist/index.js --name "smartchain"

# OR run directly with ts-node (development mode)
pm2 start npm --name "smartchain" -- start

# Save PM2 config (auto-restart on reboot)
pm2 save
pm2 startup
```

---

## Step 6: Configure Nginx as Reverse Proxy (for SSL)

```bash
# Install Nginx
apt install -y nginx

# Install Certbot for SSL
apt install -y certbot python3-certbot-nginx

# Create Nginx config
cat > /etc/nginx/sites-available/smartchain << 'EOF'
server {
    listen 80;
    server_name YOUR_DOMAIN;  # e.g., node.smartchain.edisonml.com

    location / {
        proxy_pass http://127.0.0.1:8545;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers for browser requests
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type' always;
    }
}
EOF

# Enable the site
ln -s /etc/nginx/sites-available/smartchain /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# Test and restart Nginx
nginx -t
systemctl restart nginx

# Get SSL certificate (replace YOUR_DOMAIN)
certbot --nginx -d YOUR_DOMAIN --non-interactive --agree-tos -m your@email.com
```

---

## Step 7: Configure Firewall

```bash
# Allow SSH, HTTP, HTTPS
ufw allow ssh
ufw allow 80
ufw allow 443
ufw allow 8545  # SmartChain RPC (optional, if not using Nginx)
ufw allow 8546  # SmartChain WebSocket (optional)
ufw enable
```

---

## Step 8: Update Explorer to Use Your VPS

After deployment, update the GitHub Actions workflow and redeploy the explorer:

1. Update `.github/workflows/firebase-hosting-merge.yml`:

```yaml
env:
  VITE_API_URL: "https://YOUR_DOMAIN"
  VITE_RPC_URL: "https://YOUR_DOMAIN"
```

1. Push and let CI redeploy the explorer.

---

## Useful PM2 Commands

```bash
# View logs
pm2 logs smartchain

# Restart node
pm2 restart smartchain

# Stop node
pm2 stop smartchain

# Monitor
pm2 monit
```

---

## Quick Test (No Domain)

If you don't have a domain, you can test with just the IP:

1. Skip the Nginx/SSL steps
2. Update explorer to use: `http://YOUR_VPS_IP:8545`
3. Note: This won't work with HTTPS explorer (mixed content)

---

## Troubleshooting

**Node not starting?**

```bash
cd /opt/smartchain
npm install
pm2 logs smartchain
```

**Port already in use?**

```bash
lsof -i :8545
kill -9 <PID>
```

**SSL not working?**

```bash
certbot renew --dry-run
nginx -t
```
