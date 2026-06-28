# DMS - Discipline Management System

A modern, comprehensive discipline management system for schools built with Node.js, Express, MySQL, and vanilla JavaScript. The system streamlines the process of recording, tracking, and managing student discipline through a multi-role dashboard interface.

## 📋 Features

- **Multi-Role System**: DOD (Discipline Officer), Teachers, and Staff with role-based access control
- **Student Discipline Tracking**: Record and monitor discipline marks for individual students
- **QR Code Integration**: Technology-enabled check-in and request submission
- **Real-Time Analytics**: Dashboard with live statistics and reports
- **Approval Workflows**: Structured workflows for discipline requests
- **Audit Logging**: Complete activity logging for accountability
- **Responsive Design**: Mobile-friendly interface with modern animations
- **Multi-Language Support**: i18n ready with English/French support
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for secure password storage

## 🏗️ Project Structure

```
DMS/
├── server/                      # Node.js Express backend
│   ├── index.js                # Main server entry point
│   ├── package.json            # Dependencies
│   ├── .env                    # Environment variables (local)
│   ├── .env.example            # Environment template
│   ├── setup.sql               # MySQL database schema
│   ├── seed.js                 # Database seeding script
│   ├── models/                 # Data models/queries
│   │   ├── School.js
│   │   ├── Teacher.js
│   │   ├── Staff.js
│   │   ├── Student.js
│   │   ├── Class.js
│   │   ├── DisciplineRequest.js
│   │   └── Log.js
│   └── routes/                 # API endpoints
│       ├── auth.js             # Authentication
│       ├── users.js            # User management
│       ├── students.js         # Student operations
│       ├── classes.js          # Class management
│       ├── discipline.js       # Discipline requests
│       └── logs.js             # Activity logs
├── css/                        # Stylesheets
│   ├── global.css
│   ├── login.css
│   └── dashboard.css
├── js/                         # Frontend JavaScript
│   ├── login.js               # Login functionality
│   ├── db.js                  # API client
│   ├── i18n.js                # Internationalization
│   ├── theme.js               # Theme management
│   ├── dod-dashboard.js       # DOD dashboard logic
│   ├── teacher-dashboard.js   # Teacher dashboard logic
│   └── staff-dashboard.js     # Staff dashboard logic
├── index.html                 # Login page
├── dod-dashboard.html         # DOD dashboard
├── teacher-dashboard.html     # Teacher dashboard
├── staff-dashboard.html       # Staff dashboard
├── register.html              # School registration
├── teacher-register.html      # Teacher registration
├── staff-register.html        # Staff registration
└── README.md                  # This file
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** v14 or higher
- **MySQL** 5.7 or higher
- **npm** or **yarn**

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd DMS
```

2. **Install backend dependencies**
```bash
cd server
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` and configure:
```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=dms
DB_USER=root
DB_PASSWORD=your_mysql_password
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secure-secret-key
JWT_EXPIRY=7d
```

4. **Create and seed the database**
```bash
# Create tables (run setup.sql in your MySQL client)
mysql -u root -p dms < setup.sql

# Or seed with sample data
npm run seed
```

5. **Start the server**
```bash
# Development with hot reload
npm run dev

# Production
npm start
```

The application will be available at `http://localhost:5000`

## 🔐 Default Credentials

After seeding, use these credentials:

**DOD (Discipline Officer)**
- Username: `admin`
- Password: `admin123`

**Teachers**
- Username: `teacher1` or `teacher2`
- Password: `pass123`

**Staff**
- Username: `staff1`
- Password: `staff123`

**Promo Code (for registration)**
- `TEACHER2026`

## 📚 API Documentation

### Authentication Endpoints

#### Login - DOD
```http
POST /api/auth/login/dod
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}

Response (200):
{
  "token": "jwt_token_here",
  "role": "dod",
  "id": 1,
  "username": "admin",
  "schoolId": 1,
  "schoolName": "Greenfield Academy"
}
```

#### Login - Teacher
```http
POST /api/auth/login/teacher
Content-Type: application/json

{
  "username": "teacher1",
  "password": "pass123"
}
```

#### Login - Staff
```http
POST /api/auth/login/staff
Content-Type: application/json

{
  "username": "staff1",
  "password": "staff123"
}
```

#### Register School
```http
POST /api/auth/register/school
Content-Type: application/json

{
  "school_name": "Your School Name",
  "dod_username": "unique_dod_username",
  "password": "secure_password",
  "promo_code": "UNIQUE_PROMO_2026"
}
```

#### Register Teacher
```http
POST /api/auth/register/teacher
Content-Type: application/json

{
  "promo_code": "TEACHER2026",
  "name": "Mr. John Doe",
  "username": "john_doe",
  "password": "secure_password",
  "subject": "Mathematics",
  "phone": "+250781234567"
}
```

#### Verify Token
```http
GET /api/auth/verify
Authorization: Bearer jwt_token_here

Response (200):
{
  "valid": true,
  "user": {
    "role": "teacher",
    "id": 1,
    "schoolId": 1,
    "username": "teacher1"
  }
}
```

### Student Endpoints

#### Get All Students
```http
GET /api/students/:schoolId
Authorization: Bearer jwt_token_here

Response (200):
[
  {
    "id": 1,
    "school_id": 1,
    "full_name": "Alice Mutesi",
    "class": "S4A",
    "gender": "Female",
    "discipline_marks": 95,
    "created_at": "2026-05-28T10:30:00Z"
  }
]
```

#### Create Student
```http
POST /api/students
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "school_id": 1,
  "full_name": "New Student",
  "class": "S4A",
  "gender": "Male",
  "parent_name": "Parent Name",
  "parent_phone": "+250781234567",
  "discipline_marks": 100
}
```

#### Update Student
```http
PUT /api/students/:studentId
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "discipline_marks": 90
}
```

#### Delete Student
```http
DELETE /api/students/:studentId
Authorization: Bearer jwt_token_here
```

### Discipline Request Endpoints

#### Create Discipline Request
```http
POST /api/discipline
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "school_id": 1,
  "teacher_id": 1,
  "student_id": 1,
  "class_name": "S4A",
  "mistake": "Incomplete assignment",
  "marks_removed": 5,
  "notes": "Did not submit on time",
  "target_type": "student"
}
```

#### Get All Requests
```http
GET /api/discipline/:schoolId
Authorization: Bearer jwt_token_here
```

#### Approve Request
```http
PUT /api/discipline/:requestId/approve
Authorization: Bearer jwt_token_here
```

#### Reject Request
```http
PUT /api/discipline/:requestId/reject
Authorization: Bearer jwt_token_here
```

### User Management

#### Get All Teachers
```http
GET /api/users/teachers/:schoolId
Authorization: Bearer jwt_token_here
```

#### Approve Teacher
```http
PUT /api/users/teachers/:teacherId/approve
Authorization: Bearer jwt_token_here
```

#### Get All Staff
```http
GET /api/users/staff/:schoolId
Authorization: Bearer jwt_token_here
```

#### Get Activity Logs
```http
GET /api/logs/:schoolId
Authorization: Bearer jwt_token_here
```

## 🗄️ Database Schema

### Schools Table
```sql
CREATE TABLE schools (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_name VARCHAR(255) NOT NULL,
    dod_username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    promo_code VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Teachers Table
```sql
CREATE TABLE teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    phone VARCHAR(20),
    status VARCHAR(50) DEFAULT 'pending',
    profile_image TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);
```

### Students Table
```sql
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    class VARCHAR(100) NOT NULL,
    gender VARCHAR(20),
    parent_name VARCHAR(255),
    parent_phone VARCHAR(20),
    profile_image TEXT,
    discipline_marks INT DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);
```

See `setup.sql` for complete schema.

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication with expiry
- **Password Hashing**: bcryptjs with salt rounds (10) for secure password storage
- **CORS Protection**: Cross-Origin Resource Sharing configuration
- **Input Validation**: Request validation on all endpoints
- **SQL Injection Prevention**: Parameterized queries using mysql2
- **Error Handling**: Comprehensive error responses without exposing internals

## 🌍 Deployment

### Production Checklist

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Set `NODE_ENV=production`
- [ ] Configure `DB_HOST`, `DB_USER`, `DB_PASSWORD` for production database
- [ ] Use a production database with proper backups
- [ ] Enable HTTPS/SSL
- [ ] Set up environment-specific `.env` file
- [ ] Configure CORS for your domain
- [ ] Set up database replication/failover
- [ ] Enable request logging and monitoring
- [ ] Set up automated backups

### Deployment Options

#### Option 1: Linux Server (Ubuntu/Debian)
```bash
# 1. SSH into server
ssh user@your-server.com

# 2. Install Node.js and MySQL
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs mysql-server

# 3. Clone repository
git clone <repo-url> /home/user/dms
cd /home/user/dms/server

# 4. Install dependencies
npm install --production

# 5. Setup environment
cp .env.example .env
# Edit .env with production values

# 6. Setup database
mysql -u root -p < setup.sql
npm run seed

# 7. Start with PM2 (process manager)
npm install -g pm2
pm2 start index.js --name "dms-server"
pm2 startup
pm2 save
```

#### Option 2: Docker
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["node", "server/index.js"]
```

Build and run:
```bash
docker build -t dms-server .
docker run -p 5000:5000 --env-file .env dms-server
```

#### Option 3: Heroku
```bash
# 1. Create Heroku app
heroku create your-dms-app

# 2. Add MySQL add-on
heroku addons:create cleardb:ignite

# 3. Set environment variables
heroku config:set JWT_SECRET=your-secret
heroku config:set NODE_ENV=production

# 4. Deploy
git push heroku main
```

## 🧪 Testing

### Manual Testing
1. Open `http://localhost:5000` in browser
2. Log in with default credentials
3. Test each dashboard functionality
4. Create discipline requests and verify workflow

### API Testing (Postman/Thunder Client)
- Import API endpoints from documentation
- Test with Bearer token authentication
- Verify error handling

## 📊 Monitoring and Logs

View server logs:
```bash
# Development
npm run dev

# Production with PM2
pm2 logs dms-server

# Database logs (check MySQL error log)
tail -f /var/log/mysql/error.log
```

## 🆘 Troubleshooting

### Server won't start
```bash
# Check if port is in use
lsof -i :5000

# Check database connection
mysql -u root -p -e "SELECT 1"

# Check .env file
cat .env
```

### Database connection errors
```sql
-- Check MySQL is running
SELECT 1;

-- Check user permissions
GRANT ALL PRIVILEGES ON dms.* TO 'root'@'localhost';
FLUSH PRIVILEGES;

-- Check database exists
SHOW DATABASES;
```

### Authentication issues
- Ensure JWT_SECRET is set
- Check token format: `Authorization: Bearer <token>`
- Verify token hasn't expired (default 7 days)

### CORS errors
- Update CORS configuration in `server/index.js`
- Check frontend URL matches backend CORS settings

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📧 Support

For support, email support@dms-system.com or open an issue on GitHub.

## 📞 Contact

- **Project Lead**: [Your Name]
- **Email**: [your-email]
- **Website**: [your-website]

---

**Version**: 1.0.0  
**Last Updated**: May 28, 2026  
**Status**: Production Ready
