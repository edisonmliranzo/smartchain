#!/bin/bash

# SmartChain Secure RPC Setup Script
# Usage: sudo bash scripts/setup_secure_rpc.sh

echo "🔒 Starting SmartChain Secure RPC Setup..."

# 1. Install Nginx and Certbot
echo "📦 Installing Nginx and Certbot..."
apt-get update
apt-get install -y nginx python3-certbot-nginx

# 2. Create Nginx Configuration
echo "⚙️  Configuring Nginx..."
cat > /etc/nginx/sites-available/smartchain-rpc << 'EOL'
server {
    server_name rpc.smartchain.fun;

    location / {
        proxy_pass http://127.0.0.1:8545;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # CORS Setup
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range' always;
        
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            return 204;
        }
    }
}
EOL

# 3. Enable Site
ln -s -f /etc/nginx/sites-available/smartchain-rpc /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 4. Test and Restart Nginx
nginx -t
systemctl restart nginx

# 5. Run Certbot for SSL
echo "🛡️  Obtaining SSL Certificate..."
echo "👉 You may be asked to enter your email address. This is safe."
certbot --nginx -d rpc.smartchain.fun

echo "✅ Setup Complete!"
echo "Your Secure RPC is live at: https://rpc.smartchain.fun"
