# Quick Start Guide - DMS

Get DMS up and running in 5 minutes!

## Prerequisites
- Node.js 14+ installed
- MySQL 5.7+ installed and running
- npm or yarn

## Step 1: Install Dependencies (1 min)
```bash
cd server
npm install
```

## Step 2: Create Database (1 min)
```bash
# Option A: Using command line
mysql -u root -p < setup.sql

# Option B: Using MySQL Workbench or similar GUI
# Open setup.sql and run it
```

## Step 3: Seed Sample Data (1 min)
```bash
npm run seed
```

You'll see:
```
✓ Connected to MySQL database
⧖ Clearing existing data...
→ Seeding School...
  • Created school: Greenfield Academy (ID: 1)
→ Seeding Teachers...
  • Created teachers: Mr. John Bosco, Ms. Diane Uwase
→ Seeding Staff...
  • Created staff: Mr. Peter Kwiringira
→ Seeding Classes...
  • Created classes: S4A, S4B
→ Seeding Students...
  • Created students: Alice Mutesi, Bob Nzeyimana, Catherine Uwimana

✓ Seeding completed successfully!

Default Credentials:
  DOD Username: admin, Password: admin123
  Teacher Username: teacher1/teacher2, Password: pass123
  Staff Username: staff1, Password: staff123
  Promo Code (for registration): TEACHER2026
```

## Step 4: Start Server (1 min)
```bash
npm run dev
```

You'll see:
```
✓ Connected to MySQL successfully!

🚀 DMS Server is running on http://localhost:5000
📊 Environment: development
🔐 Authentication: JWT (7d expiry)
```

## Step 5: Access the Application (1 min)
Open browser and go to: **http://localhost:5000**

### Login with:
- **Role**: DOD (Discipline Officer)
- **Username**: admin
- **Password**: admin123

## What's Next?

### 📖 Read the Documentation
- [README.md](README.md) - Full overview
- [API.md](API.md) - API endpoints
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deploy to production

### 🧪 Try These
1. Log in with different roles (teacher1, staff1)
2. Create new students
3. Submit discipline requests
4. Explore dashboards

### 🚀 Deploy to Production
```bash
# See DEPLOYMENT.md for:
# - AWS EC2 + RDS
# - DigitalOcean
# - Heroku
# - Docker
# - On-premise servers
```

## Common Commands

```bash
# Development with auto-reload
npm run dev

# Production start
npm start

# Seed database with sample data
npm run seed

# Check Node version
node --version

# Check npm version
npm --version
```

## Troubleshooting

### "Port 5000 already in use"
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=5001 npm start
```

### "Cannot find module"
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### "MySQL connection error"
```bash
# Check if MySQL is running
mysql -u root -p -e "SELECT 1;"

# Start MySQL (macOS)
brew services start mysql@8.0

# Start MySQL (Linux)
sudo systemctl start mysql

# Start MySQL (Windows)
# Open Services app and start MySQL
```

### "EACCES: permission denied"
```bash
# Fix permissions on Linux/macOS
sudo chown -R $USER:$USER .
npm install
```

## Default Database

After seeding, you'll have:

**Schools**: 1
- Name: Greenfield Academy
- DOD: admin / admin123

**Teachers**: 2
- teacher1 / pass123 (Mathematics)
- teacher2 / pass123 (English)

**Staff**: 1
- staff1 / staff123 (Discipline Officer)

**Classes**: 2
- S4A (taught by teacher1)
- S4B (taught by teacher2)

**Students**: 3
- Alice Mutesi (S4A, 95 marks)
- Bob Nzeyimana (S4B, 40 marks)
- Catherine Uwimana (S4A, 85 marks)

## File Structure

```
DMS/
├── server/
│   ├── index.js          # Main server
│   ├── package.json      # Dependencies
│   ├── .env             # Configuration
│   ├── setup.sql        # Database schema
│   ├── seed.js          # Sample data
│   ├── models/          # Database queries
│   └── routes/          # API endpoints
├── css/                 # Styles
├── js/                  # Frontend logic
├── *.html              # Pages
└── README.md           # Documentation
```

## Next Steps

1. ✅ **Explore**: Navigate the interface
2. ✅ **Read**: Check [README.md](README.md)
3. ✅ **Learn**: Review [API.md](API.md)
4. ✅ **Deploy**: See [DEPLOYMENT.md](DEPLOYMENT.md)
5. ✅ **Publish**: Follow [PUBLISH_GUIDE.md](PUBLISH_GUIDE.md)

## Need Help?

- **Issues**: Check [README.md](README.md) troubleshooting
- **API**: See [API.md](API.md) for endpoints
- **Deployment**: See [DEPLOYMENT.md](DEPLOYMENT.md)
- **Contributing**: See [CONTRIBUTING.md](CONTRIBUTING.md)

---

**You're all set! Welcome to DMS.** 🎉

Start by visiting: http://localhost:5000
