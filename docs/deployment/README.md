# Deployment Guide

## 📋 Yêu cầu

### Server Requirements

- **CPU**: 2+ cores
- **RAM**: 4GB+
- **Storage**: 20GB+
- **OS**: Ubuntu 20.04+ hoặc tương đương

### Software Requirements

- **Docker** >= 20.10
- **Docker Compose** >= 2.0
- **Node.js** >= 18 (nếu không dùng Docker)
- **Bun** >= 1.0 (nếu không dùng Docker)

## 🚀 Production Deployment

### 1. Chuẩn bị Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
```

### 2. Clone và Setup

```bash
# Clone repository
git clone https://github.com/DanielorRyker/say-2-hand.git
cd say-2-hand

# Tạo production environment files
cp apps/backend/.env.example apps/backend/.env.production
cp apps/web/.env.example apps/web/.env.production
```

### 3. Cấu hình Environment

#### Backend (.env.production)

```bash
NODE_ENV=production
PORT=8080

# Database - sử dụng production MongoDB
MONGODB_URI=mongodb://username:password@mongodb-server:27017/say2hand
REDIS_URL=redis://redis-server:6379

# JWT - tạo secret key mạnh
JWT_SECRET=your-super-secure-production-jwt-secret-key
JWT_EXPIRES_IN=24h

# Google Cloud Storage
GOOGLE_CLOUD_PROJECT_ID=your-production-project-id
GOOGLE_CLOUD_BUCKET_NAME=say2hand-production-uploads
GOOGLE_APPLICATION_CREDENTIALS=/app/config/gcp-service-account.json

# Email
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-production-email@gmail.com
MAIL_PASSWORD=your-app-password

# CORS
FRONTEND_URL=https://yourdomain.com
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

#### Frontend (.env.production)

```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-nextauth-production-secret
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### 4. Production Docker Compose

Tạo `docker-compose.prod.yml`:

```yaml
version: "3.8"

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend

  frontend:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    env_file:
      - apps/web/.env.production
    depends_on:
      - backend

  backend:
    build:
      context: .
      dockerfile: apps/backend/Dockerfile
    env_file:
      - apps/backend/.env.production
    depends_on:
      - mongodb
      - redis

  mongodb:
    image: mongo:7
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
      MONGO_INITDB_DATABASE: say2hand
    volumes:
      - mongodb_data:/data/db
      - ./tools/docker/mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data

volumes:
  mongodb_data:
  redis_data:
```

### 5. Nginx Configuration

Tạo `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:3000;
    }

    upstream backend {
        server backend:8080;
    }

    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;

        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl;
        server_name yourdomain.com www.yourdomain.com;

        ssl_certificate /etc/nginx/ssl/certificate.crt;
        ssl_certificate_key /etc/nginx/ssl/private.key;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Backend API
        location /api {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### 6. Deploy

```bash
# Build và start production
docker-compose -f docker-compose.prod.yml up -d --build

# Xem logs
docker-compose -f docker-compose.prod.yml logs -f

# Check status
docker-compose -f docker-compose.prod.yml ps
```

## 🔄 CI/CD với GitHub Actions

GitHub Actions đã được cấu hình trong `.github/workflows/`:

### Workflow Triggers

- **CI**: Chạy khi push/PR vào main/develop
- **Deploy Backend**: Chạy khi có thay đổi trong `apps/backend/`
- **Deploy Frontend**: Chạy khi có thay đổi trong `apps/web/`

### Setup Secrets

Trong GitHub Repository Settings > Secrets, thêm:

```
DOCKER_USERNAME=your-docker-username
DOCKER_PASSWORD=your-docker-password
```

## 🔧 Maintenance

### Backup Database

```bash
# MongoDB backup
docker exec mongodb-container mongodump --archive=backup.archive --gzip

# Copy backup từ container
docker cp mongodb-container:/backup.archive ./backup-$(date +%Y%m%d).archive
```

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild và restart
docker-compose -f docker-compose.prod.yml up -d --build

# Clean unused images
docker system prune -f
```

### Monitor Logs

```bash
# Xem logs của tất cả services
docker-compose -f docker-compose.prod.yml logs -f

# Logs của service cụ thể
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
```

### Health Checks

```bash
# Check backend health
curl https://api.yourdomain.com/health

# Check frontend
curl https://yourdomain.com

# Check database connection
docker exec backend-container bun run db:health
```

## 🔒 Security Checklist

- [ ] SSL certificates configured
- [ ] Strong passwords cho database
- [ ] Environment variables secured
- [ ] Firewall configured
- [ ] Regular security updates
- [ ] Backup strategy implemented
- [ ] Monitoring setup
- [ ] Rate limiting enabled

## 📊 Performance Optimization

### Database Indexing

```bash
# Connect to MongoDB và tạo indexes
docker exec -it mongodb-container mongo
use say2hand;
db.users.createIndex({ email: 1 });
db.posts.createIndex({ createdAt: -1 });
db.posts.createIndex({ category: 1 });
```

### Caching Strategy

- **Redis**: Session storage, API caching
- **CDN**: Static assets (images, CSS, JS)
- **Browser Caching**: Set proper cache headers

### Monitoring

- **Application**: Logs với structured logging
- **Infrastructure**: CPU, Memory, Disk usage
- **Database**: Query performance, connections
- **Network**: Response times, error rates
