# 🚀 Quick Deployment Guide

## 📋 Prerequisites
- Docker and Docker Compose
- Domain name (optional)
- SSL certificates (for production)

## 🏃‍♂️ Quick Start (Development)

```bash
# Clone the repository
git clone https://github.com/jitenkr2030/Scan4Legal.git
cd Scan4Legal

# Start all services
docker-compose up -d

# Access the application
# Main app: http://localhost:3000
# Lawyer dashboard: http://localhost:3000/lawyer
# WebSocket: http://localhost:3003
```

## 🌐 Production Deployment

### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Domain Configuration
```bash
# Point your domain to server IP
# Update nginx.conf with your domain
```

### 3. SSL Setup
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 4. Environment Configuration
```bash
# Copy environment file
cp .env.example .env

# Edit production values
nano .env
```

### 5. Deploy
```bash
# Build and start services
docker-compose -f docker-compose.yml up -d --build

# Check logs
docker-compose logs -f

# Check services
curl http://localhost:3000
curl http://localhost:3003
```

## 🔧 Configuration

### Environment Variables
```env
# Production
NODE_ENV=production
DATABASE_URL=file:./db/custom.db
NEXT_PUBLIC_APP_URL=https://yourdomain.com
WEBSOCKET_PORT=3003
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /socket.io/ {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## 📊 Monitoring

### Health Checks
```bash
# Check application health
curl http://localhost:3000/api/health

# Check WebSocket
curl http://localhost:3003/health
```

### Logs
```bash
# Application logs
docker-compose logs app

# WebSocket logs
docker-compose logs websocket

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 🔒 Security

### Firewall Setup
```bash
# Configure UFW
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### Database Backup
```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec scan4legal_app_1 tar -czf /tmp/backup_$DATE.tar.gz /app/db
docker cp scan4legal_app_1:/tmp/backup_$DATE.tar.gz ./backups/
EOF

chmod +x backup.sh

# Add to crontab for daily backups
0 2 * * * /path/to/backup.sh
```

## 📈 Scaling

### Multiple Instances
```yaml
# docker-compose.scale.yml
version: '3.8'
services:
  app:
    scale: 3
    deploy:
      replicas: 3
    
  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx-load-balancer.conf:/etc/nginx/nginx.conf
```

### Load Balancer
```nginx
upstream app_servers {
    server app_1:3000;
    server app_2:3000;
    server app_3:3000;
}

server {
    listen 443 ssl;
    location / {
        proxy_pass http://app_servers;
    }
}
```

## 🚨 Troubleshooting

### Common Issues

#### WebSocket Connection Failed
```bash
# Check WebSocket service
docker-compose ps websocket
docker-compose logs websocket

# Verify port is open
netstat -tlnp | grep 3003
```

#### Database Connection Error
```bash
# Check database file
ls -la db/

# Reset database
docker-compose exec app bun run db:push
```

#### High Memory Usage
```bash
# Check memory usage
docker stats

# Optimize with limits
# Add to docker-compose.yml:
services:
  app:
    deploy:
      resources:
        limits:
          memory: 512M
```

### Performance Optimization

#### Enable Caching
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

#### Database Optimization
```sql
-- Add indexes for better performance
CREATE INDEX idx_cases_category ON cases(category);
CREATE INDEX idx_sessions_status ON call_sessions(status);
```

## 📞 Support

For deployment issues:
- 📧 Email: support@scan4legal.com
- 📞 Helpline: 1800-LEGAL-HELP
- 🐛 Issues: https://github.com/jitenkr2030/Scan4Legal/issues

---

**Note**: This is a social impact project. For enterprise deployments or custom requirements, please contact our team directly.