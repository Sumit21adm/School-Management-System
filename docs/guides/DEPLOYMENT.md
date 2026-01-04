# Deployment Workflow Guide

## Overview
This guide outlines the complete deployment workflow for the School Management System.

## Build Process

### Using the Build Script

```bash
# Make script executable (first time only)
chmod +x build.py

# Run build script
python3 build.py
```

**What the script does:**
1. ✅ Checks dependencies (Node.js, npm, Docker)
2. ✅ Cleans previous build directories
3. ✅ Installs npm dependencies (backend + frontend)
4. ✅ Generates Prisma client
5. ✅ Builds backend (NestJS)
6. ✅ Builds frontend (React)
7. ✅ Creates deployment package structure
8. ✅ Copies all necessary files
9. ✅ Creates deployment README
10. ✅ Creates version info
11. ✅ Generates compressed archive (.tar.gz)

**Output:**
- `build/` - Uncompressed deployment package
- `dist/school-management-system-v1.0.0-YYYYMMDD.tar.gz` - Compressed archive

## Deployment Environments

### Development
```bash
./run-mac.sh
```
- Hot reload enabled
- Debug mode
- Local database

### Staging
```bash
# Extract deployment package
tar -xzf school-management-system-v1.0.0-*.tar.gz
cd school-management-system

# Configure staging environment
cd api
cp .env.example .env
# Edit .env for staging database

# Run migrations
npx prisma migrate deploy

# Start services
npm run start:prod  # Backend
npx serve -s ../frontend -p 5173  # Frontend
```

### Production
See deployment package README for detailed steps.

## CI/CD Pipeline (Future)

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Build and Deploy

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
    
    - name: Setup Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Run Build Script
      run: python3 build.py
    
    - name: Upload Artifact
      uses: actions/upload-artifact@v3
      with:
        name: deployment-package
        path: dist/*.tar.gz
    
    - name: Run Tests (when available)
      run: |
        cd school-management-api
        npm test
  
  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Download Artifact
      uses: actions/download-artifact@v3
      with:
        name: deployment-package
    
    - name: Deploy to Staging
      run: |
        # Add deployment commands
        # e.g., scp to server, run deployment script
        echo "Deploy to staging server"
  
  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/tags/v')
    
    steps:
    - name: Download Artifact
      uses: actions/download-artifact@v3
      with:
        name: deployment-package
    
    - name: Deploy to Production
      run: |
        # Add production deployment commands
        echo "Deploy to production server"
```

## Manual Deployment Steps

### 1. Build Package
```bash
python3 build.py
```

### 2. Transfer to Server
```bash
# Using SCP
scp dist/school-management-system-v1.0.0-*.tar.gz user@server:/opt/

# Or upload via FTP/SFTP
```

### 3. Extract on Server
```bash
ssh user@server
cd /opt
tar -xzf school-management-system-v1.0.0-*.tar.gz
cd school-management-system
```

### 4. Configure Environment
```bash
cd api
cp .env.example .env
nano .env  # Edit configuration
```

### 5. Setup Database
```bash
# Run migrations
npx prisma migrate deploy

# Seed initial data (first time only)
npx prisma db seed
```

### 6. Start Services

**Using PM2 (Recommended):**
```bash
# Install PM2
npm install -g pm2

# Start backend
cd api
pm2 start dist/main.js --name school-api

# Start frontend (using serve)
pm2 start "npx serve -s frontend -p 5173" --name school-frontend

# Save PM2 configuration
pm2 save
pm2 startup
```

**Using systemd:**
Create `/etc/systemd/system/school-api.service`:
```ini
[Unit]
Description=School Management API
After=network.target mysql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/school-management-system/api
ExecStart=/usr/bin/node dist/main.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
systemctl enable school-api
systemctl start school-api
```

### 7. Configure Nginx (Production)

Create `/etc/nginx/sites-available/school-management`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /opt/school-management-system/frontend;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
ln -s /etc/nginx/sites-available/school-management /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 8. SSL/HTTPS Setup

Using Let's Encrypt:
```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

## Rollback Procedure

### Quick Rollback
```bash
# Stop current services
pm2 stop school-api school-frontend

# Restore previous version
cd /opt
mv school-management-system school-management-system-failed
tar -xzf school-management-system-v1.0.0-previous.tar.gz

# Restart services
pm2 start school-api school-frontend
```

### Database Rollback
```bash
# Restore database backup
mysql -u school_user -p school_management < backup-YYYYMMDD.sql

# Or use Prisma migrations
npx prisma migrate resolve --rolled-back <migration-name>
```

## Monitoring & Maintenance

### Health Checks
```bash
# Check API health
curl http://localhost:3001/health

# Check frontend
curl http://localhost:5173

# Check PM2 status
pm2 status

# View logs
pm2 logs school-api
pm2 logs school-frontend
```

### Database Backup
```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u school_user -p school_management > backup-$DATE.sql
gzip backup-$DATE.sql

# Add to crontab for daily backups
0 2 * * * /opt/scripts/backup-database.sh
```

### Log Rotation
```bash
# Configure PM2 log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## Troubleshooting

### Build Fails
- Check Node.js version (20+)
- Clear node_modules and reinstall
- Check disk space
- Review build logs

### Deployment Fails
- Verify database connection
- Check file permissions
- Verify environment variables
- Check firewall rules

### Application Won't Start
- Check PM2/systemd logs
- Verify database is running
- Check port availability
- Verify .env configuration

## Version Management

### Semantic Versioning
- **Major (1.x.x)**: Breaking changes
- **Minor (x.1.x)**: New features
- **Patch (x.x.1)**: Bug fixes

### Release Process
1. Update version in package.json files
2. Update CHANGELOG.md
3. Run build script
4. Tag release: `git tag -a v1.0.0 -m "Release v1.0.0"`
5. Push tag: `git push origin v1.0.0`
6. Deploy to staging
7. Test thoroughly
8. Deploy to production

## Security Checklist

- [ ] Change default admin password
- [ ] Configure firewall (allow only 80, 443, 22)
- [ ] Enable SSL/HTTPS
- [ ] Set secure JWT secret
- [ ] Configure database user permissions
- [ ] Enable database SSL connection
- [ ] Set up regular backups
- [ ] Configure fail2ban
- [ ] Update system packages
- [ ] Set up monitoring/alerting

---

**Last Updated:** December 23, 2024
