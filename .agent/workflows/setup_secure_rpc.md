---
description: Setup Secure HTTPS RPC using Nginx and Certbot
---
# Secure RPC Setup Guide

Exposing your raw IP (`http://161.97.150.119:8545`) is insecure. Follow these steps to set up `https://rpc.smartchain.fun`.

## 1. DNS Configuration

Go to your Domain Registrar (where you bought `smartchain.fun`) and add an **A Record**:

- **Name/Host**: `rpc`
- **Value/IP**: `161.97.150.119`

## 2. Configure Nginx on VPS

Login to your VPS (`ssh root@vmi2980338`) and create a new Nginx configuration:

```bash
nano /etc/nginx/sites-available/smartchain-rpc
```

Paste the following configuration:

```nginx
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
```

## 3. Enable and Restart Nginx

```bash
ln -s /etc/nginx/sites-available/smartchain-rpc /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## 4. Enable SSL (HTTPS) with Certbot

Secure your RPC with a free Let's Encrypt certificate:

```bash
apt-get install python3-certbot-nginx -y
certbot --nginx -d rpc.smartchain.fun
```

## 5. Update MetaMask

You can now connect securely:

- **RPC URL**: `https://rpc.smartchain.fun`
- **Chain ID**: `7001`
