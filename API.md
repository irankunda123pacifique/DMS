# DMS API Documentation

Complete API reference for the Discipline Management System.

## Base URL

```
http://localhost:5000/api
```

## Authentication

All endpoints except login and registration require JWT authentication.

### Header Format

```
Authorization: Bearer <token>
```

### Example Request

```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  http://localhost:5000/api/students/1
```

## Response Format

### Success Response (2xx)

```json
{
  "data": {...},
  "message": "Operation successful",
  "timestamp": "2026-05-28T10:30:00Z"
}
```

### Error Response (4xx, 5xx)

```json
{
  "message": "Error description",
  "error": "error_code",
  "timestamp": "2026-05-28T10:30:00Z"
}
```

---

## Authentication Endpoints

### 1. Login - DOD (Discipline Officer)

**Endpoint:** `POST /auth/login/dod`

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "dod",
  "id": 1,
  "username": "admin",
  "schoolId": 1,
  "schoolName": "Greenfield Academy"
}
```

**Error Responses:**
- `400`: Username and password are required
- `401`: Invalid username or password
- `500`: Server error

---

### 2. Login - Teacher

**Endpoint:** `POST /auth/login/teacher`

**Request Body:**
```json
{
  "username": "teacher1",
  "password": "pass123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "teacher",
  "id": 1,
  "username": "teacher1",
  "name": "Mr. John Bosco",
  "schoolId": 1
}
```

**Error Responses:**
- `400`: Username and password are required
- `401`: Invalid username or password / Your account is awaiting approval

---

### 3. Login - Staff

**Endpoint:** `POST /auth/login/staff`

**Request Body:**
```json
{
  "username": "staff1",
  "password": "staff123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "staff",
  "id": 1,
  "username": "staff1",
  "name": "Mr. Peter Kwiringira",
  "schoolId": 1
}
```

---

### 4. Register School

**Endpoint:** `POST /auth/register/school`

**Request Body:**
```json
{
  "school_name": "New School Academy",
  "dod_username": "dod_new",
  "password": "secure_password_123",
  "promo_code": "UNIQUE_PROMO_2026"
}
```

**Validation:**
- `school_name`: Required, string
- `dod_username`: Required, unique, string
- `password`: Required, minimum 6 characters
- `promo_code`: Required, unique, string

**Response (201):**
```json
{
  "message": "School registered successfully",
  "school": {
    "id": 2,
    "school_name": "New School Academy",
    "dod_username": "dod_new"
  }
}
```

**Error Responses:**
- `400`: All fields are required / Password must be at least 6 characters
- `400`: Username or promo code already exists

---

### 5. Register Teacher

**Endpoint:** `POST /auth/register/teacher`

**Request Body:**
```json
{
  "promo_code": "TEACHER2026",
  "name": "Mr. Jane Doe",
  "username": "jane_doe",
  "password": "secure_password_123",
  "subject": "English",
  "phone": "+250781234567"
}
```

**Validation:**
- `promo_code`: Required, must be valid
- `name`: Required
- `username`: Required, unique
- `password`: Required, minimum 6 characters
- `subject`: Optional
- `phone`: Optional

**Response (201):**
```json
{
  "message": "Teacher registered successfully. Awaiting approval.",
  "teacher": {
    "id": 5,
    "name": "Mr. Jane Doe",
    "username": "jane_doe"
  }
}
```

**Error Responses:**
- `400`: Required fields are missing
- `400`: Password must be at least 6 characters
- `400`: Invalid promo code
- `400`: Username already exists

---

### 6. Register Staff

**Endpoint:** `POST /auth/register/staff`

**Request Body:**
```json
{
  "promo_code": "TEACHER2026",
  "name": "Ms. Sarah Johnson",
  "username": "sarah_j",
  "password": "secure_password_123",
  "position": "Administrator",
  "phone": "+250781234567"
}
```

**Validation:**
- `promo_code`: Required
- `name`: Required
- `username`: Required, unique
- `password`: Required, minimum 6 characters
- `position`: Optional
- `phone`: Optional

**Response (201):**
```json
{
  "message": "Staff registered successfully. Awaiting approval.",
  "staff": {
    "id": 2,
    "name": "Ms. Sarah Johnson",
    "username": "sarah_j"
  }
}
```

---

### 7. Verify Token

**Endpoint:** `GET /auth/verify`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
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

**Error Responses:**
- `401`: No token provided
- `403`: Invalid or expired token

---

## Student Endpoints

### 1. Get All Students

**Endpoint:** `GET /students/:schoolId`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page`: Optional, default 1
- `limit`: Optional, default 50
- `class`: Optional, filter by class

**Response (200):**
```json
[
  {
    "id": 1,
    "school_id": 1,
    "full_name": "Alice Mutesi",
    "class": "S4A",
    "gender": "Female",
    "parent_name": "Mrs. Mutesi Grace",
    "parent_phone": "+250781111001",
    "discipline_marks": 95,
    "profile_image": null,
    "created_at": "2026-05-28T10:30:00Z"
  }
]
```

---

### 2. Get Student by ID

**Endpoint:** `GET /students/detail/:studentId`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": 1,
  "school_id": 1,
  "full_name": "Alice Mutesi",
  "class": "S4A",
  "gender": "Female",
  "parent_name": "Mrs. Mutesi Grace",
  "parent_phone": "+250781111001",
  "discipline_marks": 95,
  "profile_image": null,
  "created_at": "2026-05-28T10:30:00Z"
}
```

**Error Responses:**
- `404`: Student not found

---

### 3. Create Student

**Endpoint:** `POST /students`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
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

**Validation:**
- `school_id`: Required
- `full_name`: Required
- `class`: Required
- `gender`: Optional
- `parent_name`: Optional
- `parent_phone`: Optional
- `discipline_marks`: Optional, default 100

**Response (201):**
```json
{
  "message": "Student created successfully",
  "student": {
    "id": 10,
    "school_id": 1,
    "full_name": "New Student",
    "class": "S4A",
    "gender": "Male",
    "discipline_marks": 100,
    "created_at": "2026-05-28T10:30:00Z"
  }
}
```

---

### 4. Update Student

**Endpoint:** `PUT /students/:studentId`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "discipline_marks": 85,
  "class": "S4B"
}
```

**Response (200):**
```json
{
  "message": "Student updated successfully",
  "student": {
    "id": 1,
    "full_name": "Alice Mutesi",
    "discipline_marks": 85,
    "class": "S4B"
  }
}
```

**Error Responses:**
- `404`: Student not found

---

### 5. Delete Student

**Endpoint:** `DELETE /students/:studentId`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Student deleted successfully"
}
```

**Error Responses:**
- `404`: Student not found

---

## Discipline Endpoints

### 1. Create Discipline Request

**Endpoint:** `POST /discipline`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
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

**Validation:**
- `school_id`: Required
- `student_id`: Required (or `teacher_id`/`staff_id` depending on `target_type`)
- `mistake`: Required
- `marks_removed`: Required, must be positive
- `target_type`: Required (student/teacher/staff)
- Others: Optional

**Response (201):**
```json
{
  "message": "Discipline request created successfully",
  "request": {
    "id": 1,
    "school_id": 1,
    "student_id": 1,
    "mistake": "Incomplete assignment",
    "marks_removed": 5,
    "status": "pending",
    "created_at": "2026-05-28T10:30:00Z"
  }
}
```

---

### 2. Get All Discipline Requests

**Endpoint:** `GET /discipline/:schoolId`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status`: Optional (pending/approved/rejected)
- `type`: Optional (student/teacher/staff)

**Response (200):**
```json
[
  {
    "id": 1,
    "school_id": 1,
    "teacher_id": 1,
    "student_id": 1,
    "class_name": "S4A",
    "mistake": "Incomplete assignment",
    "marks_removed": 5,
    "status": "pending",
    "target_type": "student",
    "created_at": "2026-05-28T10:30:00Z"
  }
]
```

---

### 3. Approve Discipline Request

**Endpoint:** `PUT /discipline/:requestId/approve`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "notes": "Approved by DOD"
}
```

**Response (200):**
```json
{
  "message": "Request approved successfully",
  "request": {
    "id": 1,
    "status": "approved",
    "reviewed_at": "2026-05-28T10:30:00Z"
  }
}
```

---

### 4. Reject Discipline Request

**Endpoint:** `PUT /discipline/:requestId/reject`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "notes": "Not enough evidence"
}
```

**Response (200):**
```json
{
  "message": "Request rejected successfully",
  "request": {
    "id": 1,
    "status": "rejected",
    "reviewed_at": "2026-05-28T10:30:00Z"
  }
}
```

---

## User Management Endpoints

### 1. Get All Teachers

**Endpoint:** `GET /users/teachers/:schoolId`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status`: Optional (pending/approved)

**Response (200):**
```json
[
  {
    "id": 1,
    "school_id": 1,
    "name": "Mr. John Bosco",
    "username": "teacher1",
    "subject": "Mathematics",
    "phone": "+250781111001",
    "status": "approved",
    "created_at": "2026-05-28T10:30:00Z"
  }
]
```

---

### 2. Approve Teacher

**Endpoint:** `PUT /users/teachers/:teacherId/approve`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Teacher approved successfully"
}
```

---

### 3. Get All Staff

**Endpoint:** `GET /users/staff/:schoolId`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
[
  {
    "id": 1,
    "school_id": 1,
    "name": "Mr. Peter Kwiringira",
    "username": "staff1",
    "position": "Discipline Officer",
    "phone": "+250781111001",
    "status": "approved"
  }
]
```

---

### 4. Approve Staff

**Endpoint:** `PUT /users/staff/:staffId/approve`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Staff approved successfully"
}
```

---

## Logs Endpoint

### Get Activity Logs

**Endpoint:** `GET /logs/:schoolId`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `category`: Optional (auth/discipline/teacher/staff/system)
- `limit`: Optional, default 100
- `offset`: Optional, default 0

**Response (200):**
```json
[
  {
    "id": 1,
    "school_id": 1,
    "message": "DOD \"admin\" logged in",
    "user": "admin",
    "category": "auth",
    "action_type": "login",
    "timestamp": "2026-05-28T10:30:00Z"
  }
]
```

---

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Invalid credentials or expired token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists (e.g., duplicate username) |
| 422 | Unprocessable Entity | Validation failed |
| 500 | Server Error | Internal server error |
| 503 | Service Unavailable | Database connection error |

---

## Rate Limiting

Production API is rate-limited:
- **General endpoints**: 100 requests per 15 minutes per IP
- **Auth endpoints**: 5 requests per 15 minutes per IP

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 98
X-RateLimit-Reset: 1622284800
```

---

## Pagination

Endpoints supporting pagination use:
- `page`: Page number (1-indexed)
- `limit`: Items per page
- `offset`: Number of items to skip

**Response Header:**
```
X-Total-Count: 100
X-Page: 1
X-Per-Page: 50
```

---

## Examples

### cURL Examples

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login/teacher \
  -H "Content-Type: application/json" \
  -d '{"username":"teacher1","password":"pass123"}'
```

**Create Discipline Request:**
```bash
curl -X POST http://localhost:5000/api/discipline \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "school_id": 1,
    "student_id": 1,
    "mistake": "Late to class",
    "marks_removed": 3,
    "target_type": "student"
  }'
```

**Get Students:**
```bash
curl http://localhost:5000/api/students/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

**Version**: 1.0.0  
**Last Updated**: May 28, 2026
