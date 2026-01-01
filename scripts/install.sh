#!/bin/bash
#
# SmartChain Validator Quick Install Script
# Usage: curl -sSL https://raw.githubusercontent.com/edisonmliranzo/smartchain/main/scripts/install.sh | bash
#

set -e

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║   ███████╗███╗   ███╗ █████╗ ██████╗ ████████╗               ║"
echo "║   ██╔════╝████╗ ████║██╔══██╗██╔══██╗╚══██╔══╝               ║"
echo "║   ███████╗██╔████╔██║███████║██████╔╝   ██║                  ║"
echo "║   ╚════██║██║╚██╔╝██║██╔══██║██╔══██╗   ██║                  ║"
echo "║   ███████║██║ ╚═╝ ██║██║  ██║██║  ██║   ██║                  ║"
echo "║   ╚══════╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝                  ║"
echo "║                                                               ║"
echo "║           Validator Node Quick Install                        ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (sudo)"
    exit 1
fi

echo "📦 Step 1/6: Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
apt-get install -y nodejs git > /dev/null 2>&1
echo "✅ Node.js installed: $(node --version)"

echo ""
echo "📦 Step 2/6: Installing PM2..."
npm install -g pm2 > /dev/null 2>&1
echo "✅ PM2 installed"

echo ""
echo "📦 Step 3/6: Cloning SmartChain..."
if [ -d "/opt/smartchain" ]; then
    cd /opt/smartchain
    git pull > /dev/null 2>&1
    echo "✅ SmartChain updated"
else
    git clone https://github.com/edisonmliranzo/smartchain.git /opt/smartchain > /dev/null 2>&1
    echo "✅ SmartChain cloned"
fi

echo ""
echo "📦 Step 4/6: Installing dependencies..."
cd /opt/smartchain
npm install > /dev/null 2>&1
echo "✅ Dependencies installed"

echo ""
echo "📦 Step 5/6: Configuring firewall..."
ufw allow 22 > /dev/null 2>&1
ufw allow 80 > /dev/null 2>&1
ufw allow 443 > /dev/null 2>&1
ufw allow 8545 > /dev/null 2>&1
ufw allow 8546 > /dev/null 2>&1
ufw allow 9545 > /dev/null 2>&1
ufw --force enable > /dev/null 2>&1
echo "✅ Firewall configured"

echo ""
echo "📦 Step 6/6: Setting up .env..."
if [ ! -f "/opt/smartchain/.env" ]; then
    cat > /opt/smartchain/.env << 'EOF'
# SmartChain Node Configuration
# Edit this file with your settings

# Your validator private key (KEEP SECRET!)
# Generate with: npm run wallet generate
VALIDATOR_PRIVATE_KEY=

# Connect to main network
P2P_SEEDS=ws://161.97.150.119:9545

# Ports (defaults)
RPC_PORT=8545
WS_PORT=8546
P2P_PORT=9545
EOF
    chmod 600 /opt/smartchain/.env
    echo "✅ .env template created"
else
    echo "✅ .env already exists"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "  ✅ SmartChain Validator Installation Complete!"
echo ""
echo "  📍 Location: /opt/smartchain"
echo ""
echo "  ⚠️  IMPORTANT: Before starting, you must:"
echo ""
echo "  1. Generate a wallet:"
echo "     cd /opt/smartchain && npm run wallet generate"
echo ""
echo "  2. Add your private key to .env:"
echo "     nano /opt/smartchain/.env"
echo ""
echo "  3. Start the node:"
echo "     cd /opt/smartchain && pm2 start npm --name smartchain -- start"
echo ""
echo "  4. Save PM2 config:"
echo "     pm2 save && pm2 startup"
echo ""
echo "  📖 Full guide: https://github.com/edisonmliranzo/smartchain/blob/main/docs/VALIDATORS.md"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
