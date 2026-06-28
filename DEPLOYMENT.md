# DMS - Production Deployment Guide

This guide walks you through deploying the Discipline Management System to production.

## 📋 Pre-Deployment Checklist

- [ ] All tests passing
- [ ] No console errors or warnings
- [ ] Environment variables configured
- [ ] Database backups set up
- [ ] SSL/HTTPS certificate obtained
- [ ] Domain name configured
- [ ] Email service configured (optional)
- [ ] Monitoring and alerting set up
- [ ] Disaster recovery plan documented

## 🔐 Security Hardening

### 1. Environment Configuration

Create production `.env` file:
```bash
# Database
DB_HOST=your-production-db-host.com
DB_PORT=3306
DB_NAME=dms_production
DB_USER=dms_prod_user
DB_PASSWORD=<VERY_STRONG_PASSWORD>

# Server
PORT=5000
NODE_ENV=production

# JWT
JWT_SECRET=<GENERATE_RANDOM_STRING_64_CHARS>
JWT_EXPIRY=7d

# Application
APP_NAME=DMS - Discipline Management System
LOG_LEVEL=info
```

Generate secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Database Hardening

```sql
-- Create production user with limited privileges
CREATE USER 'dms_prod_user'@'app-server-ip' IDENTIFIED BY 'strong_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON dms_production.* TO 'dms_prod_user'@'app-server-ip';
FLUSH PRIVILEGES;

-- Enable binary logging for backups
SET sql_log_bin = ON;

-- Create backup user
CREATE USER 'dms_backup'@'backup-server-ip' IDENTIFIED BY 'backup_password';
GRANT SELECT, LOCK TABLES ON dms_production.* TO 'dms_backup'@'backup-server-ip';
FLUSH PRIVILEGES;

-- Remove anonymous users
DELETE FROM mysql.user WHERE User = '';
DELETE FROM mysql.user WHERE User = 'root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');
FLUSH PRIVILEGES;
```

### 3. Application Hardening

Update `server/index.js`:
```javascript
// Add security headers middleware
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

app.use(helmet());
app.use(cors({
    origin: ['https://yourdomain.com', 'https://www.yourdomain.com'],
    credentials: true,
    optionsSuccessStatus: 200
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);
```

Install additional security packages:
```bash
npm install helmet express-rate-limit
```

## 🚀 Deployment Options

### Option 1: AWS EC2 + RDS

**Infrastructure Setup**

1. **Create EC2 Instance**
   - AMI: Ubuntu Server 22.04 LTS
   - Instance type: t3.medium or larger
   - Security group: Allow ports 80, 443, 22
   - Storage: 30GB gp3

2. **Create RDS MySQL Instance**
   - Engine: MySQL 8.0
   - Instance class: db.t3.micro or larger
   - Storage: 20GB gp2
   - Multi-AZ: Enabled
   - Backup retention: 30 days

3. **Deploy Application**

```bash
#!/bin/bash
# Connect to EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-public-ip

# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt-get install -y nginx

# Clone repository
cd /home/ubuntu
git clone <your-repo-url> dms
cd dms/server

# Install dependencies
npm install --production

# Configure environment
sudo nano .env
# Add production environment variables

# Seed database
npm run seed

# Start application
pm2 start index.js --name "dms"
pm2 startup
pm2 save

# Configure Nginx
sudo nano /etc/nginx/sites-available/default
# Add proxy configuration
```

**Nginx Configuration** (`/etc/nginx/sites-available/default`):
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Enable SSL with Let's Encrypt**:
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
sudo certbot renew --dry-run
```

### Option 2: DigitalOcean App Platform

1. **Connect GitHub repository**
   - Go to DigitalOcean App Platform
   - Create new app
   - Connect your GitHub repo

2. **Configure App**
```yaml
# app.yaml
name: dms
services:
  - name: api
    github:
      repo: your-username/dms
      branch: main
    build_command: cd server && npm install --production
    run_command: node server/index.js
    http_port: 5000
    envs:
      - key: NODE_ENV
        value: production
      - key: DB_HOST
        value: ${db.host}
      - key: DB_NAME
        value: dms_production
      - key: JWT_SECRET
        scope: RUN_TIME
        value: ${JWT_SECRET}
    source_dir: server

databases:
  - name: db
    engine: MYSQL
    version: "8"
    production: true
```

3. **Deploy**
   - Push to main branch
   - DigitalOcean automatically deploys

### Option 3: Heroku

1. **Install Heroku CLI**
```bash
curl https://cli-assets.heroku.com/install.sh | sh
```

2. **Login and create app**
```bash
heroku login
heroku create your-dms-app
```

3. **Add MySQL Database**
```bash
heroku addons:create cleardb:ignite
```

4. **Set environment variables**
```bash
heroku config:set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
heroku config:set NODE_ENV=production
heroku config:set DB_HOST=<cleardb-host>
heroku config:set DB_USER=<cleardb-user>
heroku config:set DB_PASSWORD=<cleardb-password>
```

5. **Create Procfile**
```
web: cd server && node index.js
release: cd server && npm run seed
```

6. **Deploy**
```bash
git push heroku main
```

### Option 4: Docker + Kubernetes

**Create Dockerfile**:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install netcat for health checks
RUN apk add --no-cache netcat-openbsd

# Copy package files
COPY server/package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application code
COPY server/ .

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD nc -z localhost 5000

# Start application
CMD ["node", "index.js"]
```

**Create docker-compose.yml**:
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: production
      DB_HOST: db
      DB_PORT: 3306
      DB_NAME: dms
      DB_USER: dms_user
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - db
    restart: always

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: dms
      MYSQL_USER: dms_user
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
      - ./server/setup.sql:/docker-entrypoint-initdb.d/setup.sql
    restart: always

volumes:
  mysql_data:
```

**Deploy with Docker Compose**:
```bash
docker-compose -f docker-compose.yml up -d
```

## 📊 Monitoring & Logging

### 1. Application Logging

Install Winston for structured logging:
```bash
npm install winston
```

Update `server/index.js`:
```javascript
const winston = require('winston');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

app.locals.logger = logger;
```

### 2. Performance Monitoring

Setup New Relic:
```bash
npm install newrelic
```

Add to top of `server/index.js`:
```javascript
require('newrelic');
```

Configure `newrelic.js`:
```javascript
exports.config = {
    app_name: ['DMS - Production'],
    license_key: process.env.NEW_RELIC_LICENSE_KEY,
    logging: {
        level: 'info'
    }
};
```

### 3. Uptime Monitoring

- Use UptimeRobot to monitor `https://your-domain.com/api/auth/verify`
- Set up alerts for downtime
- Monitor response times

## 🔄 Backup & Recovery

### Automated MySQL Backups

```bash
#!/bin/bash
# /home/ubuntu/backup-db.sh

BACKUP_DIR="/backups/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/dms_$DATE.sql.gz"

mkdir -p $BACKUP_DIR

mysqldump -u backup_user -p${DB_PASSWORD} dms_production | gzip > $BACKUP_FILE

# Keep last 30 days of backups
find $BACKUP_DIR -name "dms_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE"
```

Schedule with cron:
```bash
crontab -e

# Add line:
# 2 3 * * * /home/ubuntu/backup-db.sh >> /var/log/dms-backup.log 2>&1
```

### Restore from Backup

```bash
gunzip < /backups/mysql/dms_20260528_030000.sql.gz | mysql -u root -p dms_production
```

## 🔧 Maintenance

### Regular Tasks

**Weekly:**
- [ ] Check application logs for errors
- [ ] Verify database backups completed
- [ ] Monitor disk space usage

**Monthly:**
- [ ] Review and update dependencies: `npm update`
- [ ] Check security vulnerabilities: `npm audit`
- [ ] Review user activity logs
- [ ] Test backup restoration

**Quarterly:**
- [ ] Update Node.js version
- [ ] Review and optimize database queries
- [ ] Performance testing
- [ ] Security audit

### Zero-Downtime Deployment

```bash
# 1. Deploy to new instance
git pull origin main
npm install --production

# 2. Test new version
npm start &

# 3. Switch traffic with load balancer
# Update health checks to new instance

# 4. Verify traffic switched
# Monitor error logs

# 5. Stop old instance after verification
kill <old-process-id>
```

## 📞 Rollback Procedure

```bash
# If deployment fails
git revert <commit-hash>
git push origin main

# Restart application
pm2 restart dms

# Verify
curl https://your-domain.com/api/auth/verify
```

## 📞 Emergency Contacts

- **On-call Engineer**: [Phone/Email]
- **Database Administrator**: [Phone/Email]
- **Infrastructure Team**: [Phone/Email]

## 📚 Additional Resources

- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [OWASP Security Guidelines](https://owasp.org/www-project-nodejs-security/)
- [MySQL Performance Tuning](https://dev.mysql.com/doc/refman/8.0/en/optimization.html)

---

**Version**: 1.0.0  
**Last Updated**: May 28, 2026
