# Deployment Guide - School Management System

This guide covers different deployment scenarios for the School Management System.

## Table of Contents

1. [Local Development](#local-development)
2. [Shared Hosting (cPanel)](#shared-hosting-cpanel)
3. [VPS/Cloud Deployment](#vpscloud-deployment)
4. [Docker Deployment](#docker-deployment)
5. [Environment Variables](#environment-variables)

---

## Local Development

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- MySQL 8+ (via Docker or local installation)
- Git

### Quick Start

```bash
# Clone the repository
git clone https://github.com/Sumit21adm/School-Management-System.git
cd School-Management-System

# Run the setup script
chmod +x setup.sh
./setup.sh

# Start development servers
npm run dev
```

The setup script will:
- Install all dependencies
- Start MySQL and phpMyAdmin via Docker (if available)
- Generate Prisma client
- Create database schema
- Seed initial data

### Manual Setup

If you prefer manual setup or the script doesn't work:

```bash
# Install dependencies
npm install
cd apps/web && npm install
cd ../api && npm install

# Start MySQL (if using Docker)
cd ../..
docker-compose up -d

# Generate Prisma client and set up database
cd apps/api
npx prisma generate
npx prisma db push
npm run prisma:seed

# Start applications
# Terminal 1 - Backend
cd apps/api
npm run start:dev

# Terminal 2 - Frontend
cd apps/web
npm run dev
```

---

## Shared Hosting (cPanel)

### Prerequisites
- cPanel account with Node.js support
- MySQL database access
- FTP/File Manager access
- Domain or subdomain configured

### Step 1: Prepare the Build

On your local machine:

```bash
# Build frontend
cd apps/web
npm run build

# Build backend
cd ../api
npm run build
```

### Step 2: Create MySQL Database

1. Log in to cPanel
2. Go to **MySQL Databases**
3. Create a new database (e.g., `school_management`)
4. Create a database user
5. Assign the user to the database with all privileges
6. Note down the database name, username, and password

### Step 3: Upload Files

**Backend (API):**
1. Upload the entire `apps/api` folder to your account (e.g., `/home/username/api`)
2. Create `.env` file:

```env
DATABASE_URL="mysql://dbuser:dbpassword@localhost:3306/school_management"
JWT_SECRET="your-production-secret-key-change-this"
JWT_EXPIRATION="7d"
PORT=3001
NODE_ENV=production
```

**Frontend:**
1. Upload contents of `apps/web/dist` folder to `public_html` (or subdirectory)
2. Create `.htaccess` file in `public_html`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### Step 4: Set Up Node.js App (cPanel)

1. Go to **Setup Node.js App** in cPanel
2. Create new application:
   - Node.js version: 18.x or higher
   - Application mode: Production
   - Application root: `/home/username/api`
   - Application URL: `https://yourdomain.com` (or subdomain)
   - Application startup file: `dist/main.js`
3. Click **Create**

### Step 5: Install Dependencies and Setup Database

Using SSH (if available) or Terminal in cPanel:

```bash
cd ~/api
npm install --production
npx prisma generate
npx prisma db push
npm run prisma:seed
```

### Step 6: Set Up Cron Jobs

Add these cron jobs in cPanel:

```bash
# Run scheduled tasks every minute
* * * * * cd ~/api && node dist/schedule.js

# Restart Node.js app daily (optional)
0 3 * * * /home/username/nodevenv/api/18/bin/node ~/api/dist/main.js restart
```

### Step 7: Update Frontend API URL

Update the API URL in your frontend build to point to your backend:

Create `apps/web/.env.production`:
```env
VITE_API_URL=https://yourdomain.com/api/v1
```

Rebuild and re-upload:
```bash
cd apps/web
npm run build
# Upload dist/* to public_html
```

---

## VPS/Cloud Deployment

### Prerequisites
- Ubuntu 20.04+ or similar Linux distribution
- Root or sudo access
- Domain name configured

### Step 1: Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Install MySQL
sudo apt install -y mysql-server
sudo mysql_secure_installation

# Install PM2 globally
sudo npm install -g pm2

# Install Git
sudo apt install -y git
```

### Step 2: Create Database

```bash
sudo mysql

CREATE DATABASE school_management;
CREATE USER 'smsuser'@'localhost' IDENTIFIED BY 'strong-password';
GRANT ALL PRIVILEGES ON school_management.* TO 'smsuser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 3: Clone and Setup Application

```bash
# Create application directory
sudo mkdir -p /var/www/school-management
sudo chown -R $USER:$USER /var/www/school-management

# Clone repository
cd /var/www/school-management
git clone https://github.com/Sumit21adm/School-Management-System.git .

# Install dependencies
npm install
cd apps/web && npm install
cd ../api && npm install

# Build applications
cd /var/www/school-management/apps/web
npm run build

cd ../api
npm run build
```

### Step 4: Configure Environment

Create `/var/www/school-management/apps/api/.env`:

```env
DATABASE_URL="mysql://smsuser:strong-password@localhost:3306/school_management"
JWT_SECRET="your-production-secret-key"
JWT_EXPIRATION="7d"
PORT=3001
NODE_ENV=production
```

### Step 5: Setup Database

```bash
cd /var/www/school-management/apps/api
npx prisma generate
npx prisma db push
npm run prisma:seed
```

### Step 6: Configure PM2

```bash
cd /var/www/school-management/apps/api

# Start the API with PM2
pm2 start dist/main.js --name school-api

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Step 7: Configure Nginx

Create `/etc/nginx/sites-available/school-management`:

```nginx
# API server
upstream school_api {
    server localhost:3001;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend
    root /var/www/school-management/apps/web/dist;
    index index.html;

    # Frontend routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://school_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/school-management /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 8: Setup SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Docker Deployment

### Using Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - school-network

  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    restart: always
    environment:
      DATABASE_URL: mysql://${DB_USER}:${DB_PASSWORD}@mysql:3306/${DB_NAME}
      JWT_SECRET: ${JWT_SECRET}
      PORT: 3001
      NODE_ENV: production
    ports:
      - "3001:3001"
    depends_on:
      - mysql
    networks:
      - school-network

  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
    restart: always
    ports:
      - "80:80"
    depends_on:
      - api
    networks:
      - school-network

volumes:
  mysql_data:

networks:
  school-network:
    driver: bridge
```

Create `apps/api/Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

EXPOSE 3001

CMD ["node", "dist/main.js"]
```

Create `apps/web/Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

Deploy:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL="mysql://user:password@host:3306/database"

# JWT Authentication
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_EXPIRATION="7d"

# Application
PORT=3001
NODE_ENV=production

# Email (optional)
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="noreply@yourdomain.com"
SMTP_PASS="password"

# Payment Gateways (optional)
RAZORPAY_KEY_ID="your-key"
RAZORPAY_KEY_SECRET="your-secret"
STRIPE_SECRET_KEY="your-key"
```

### Frontend (.env.production)

```env
VITE_API_URL=https://yourdomain.com/api/v1
VITE_APP_NAME="School Management System"
```

---

## Post-Deployment Checklist

- [ ] Change default admin password
- [ ] Update JWT_SECRET in production
- [ ] Enable firewall (UFW on Ubuntu)
- [ ] Set up automated backups
- [ ] Configure monitoring (optional)
- [ ] Test all critical features
- [ ] Set up error logging (Sentry, etc.)
- [ ] Configure email notifications
- [ ] Review security headers
- [ ] Enable rate limiting
- [ ] Set up database backups

---

## Troubleshooting

### API Won't Start
- Check logs: `pm2 logs school-api`
- Verify database connection
- Check environment variables
- Ensure Prisma client is generated

### Frontend Shows Blank Page
- Check browser console for errors
- Verify API URL is correct
- Check Nginx configuration
- Verify build was successful

### Database Connection Issues
- Verify credentials
- Check if MySQL is running
- Test connection: `mysql -u user -p`
- Check firewall rules

---

## Support

For issues and questions:
- GitHub Issues: https://github.com/Sumit21adm/School-Management-System/issues
- Email: support@schoolms.com

---

**Last Updated:** 2024
