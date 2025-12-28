#!/bin/bash
# SmartChain VPS Deployment Script
# Run this script on your VPS (Ubuntu 22.04 LTS recommended)

set -e

echo "========================================"
echo "  SmartChain VPS Deployment Script"
echo "========================================"

# 1. Update System
echo "[1/6] Updating system..."
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js
echo "[2/6] Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs git build-essential

# 3. Install PM2
echo "[3/6] Installing PM2..."
sudo npm install -g pm2

# 4. Create SmartChain directory
echo "[4/6] Setting up SmartChain directory..."
mkdir -p ~/smartchain
cd ~/smartchain

# If no source exists, prompt user to upload it
if [ ! -f "package.json" ]; then
    echo ""
    echo "========================================="
    echo " IMPORTANT: Source code not found!"
    echo "========================================="
    echo " Please upload your SmartChain source code"
    echo " to this server using SCP or SFTP."
    echo ""
    echo " Example (from your local machine):"
    echo " scp -r ./smartchain root@YOUR_VPS_IP:~/"
    echo ""
    echo " Then run this script again."
    exit 1
fi

# 5. Install dependencies and build
echo "[5/6] Installing dependencies and building..."
npm install
npm run build

# Also build explorer
cd ~/smartchain/explorer
npm install
npm run build

# 6. Configure PM2 and start services
echo "[6/6] Starting services with PM2..."
cd ~/smartchain

# Create ecosystem config
cat > ecosystem.config.js << 'EOF'
module.exports = {
    apps: [
        {
            name: 'smartchain-node',
            script: 'dist/index.js',
            env: {
                RPC_PORT: 8545,
                WS_PORT: 8546,
                ENABLE_MINING: true,
                NODE_ENV: 'production'
            }
        }
    ]
};
EOF

pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo ""
echo "========================================="
echo "  SmartChain Deployed Successfully!"
echo "========================================="
echo " RPC Endpoint: http://YOUR_VPS_IP:8545"
echo " WS Endpoint:  ws://YOUR_VPS_IP:8546"
echo ""
echo " To view logs: pm2 logs smartchain-node"
echo " To stop:      pm2 stop smartchain-node"
echo "========================================="
