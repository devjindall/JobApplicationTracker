# Job Application Tracker (MERN Stack)

A clean, full-stack **Job Application Tracker** built with the **MERN** stack (MongoDB, Express.js, React.js, Node.js). It provides placement candidates and software engineers with an organized dashboard to track job applications, update application statuses across interview stages, filter and search by company name, and ensure complete user ownership and data isolation using JWT authentication and bcrypt password hashing.

---

## 🌟 Key Features

1. **User Authentication & Security**:
   - Secure account registration with client and server input validation.
   - Passwords hashed using `bcryptjs` with salt rounds (plain passwords are never stored).
   - Stateless JWT (JSON Web Token) authentication with 7-day expiration.
   - `passwordHash` is stripped from all API outputs.
   - Protected frontend routes and JWT verification middleware on protected backend endpoints.

2. **Job Application Management (CRUD)**:
   - **Create**: Add new job applications with company name, job role, status, applied date, job URL, and notes.
   - **Read**: View all applications belonging strictly to the authenticated user.
   - **Single View**: View detailed information of a specific application.
   - **Update**: Edit application stage, dates, URLs, and notes.
   - **Delete**: Remove applications with confirmation safeguards.

3. **Search & Status Filtering**:
   - Case-insensitive search by company name via backend regex querying.
   - Status filtering matching the 7 application stages:
     - `Applied`
     - `Resume Shortlisted`
     - `OA Done`
     - `Interview`
     - `Waiting for Result`
     - `Selected`
     - `Rejected`

4. **Multi-User Isolation & Ownership Enforcement**:
   - The backend extracts the user identity directly from `req.user.userId` via verified JWT.
   - Never trusts client-supplied `userId`.
   - Every read, update, and delete operation requires matching both `_id` and `userId`.

5. **Client-Side Metrics Dashboard**:
   - Real-time statistics dynamically computed from fetched application state:
     - Total Applications
     - In Progress
     - Interviews
     - Offers / Selected
     - Rejected

---

## 🛠️ Tech Stack

- **Frontend**: React.js (Hooks & Functional Components), Vite, Native `fetch` API, CSS3
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (`jsonwebtoken`), `bcryptjs`
- **Version Control**: Git & GitHub

---

## 🏛️ System Architecture

```text
┌────────────────────────────────────────────────────────┐
│               React Frontend (Vite)                    │
│   (Dashboard, ApplicationForm, Cards, Metrics, Auth)   │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP (fetch) with Bearer JWT
                            ▼
┌────────────────────────────────────────────────────────┐
│               Express.js REST API Server               │
│  - Routes (/api/auth, /api/applications)              │
│  - JWT Auth Middleware (extracts req.user.userId)      │
│  - Centralized Error Handling & Input Validation       │
└───────────────────────────┬────────────────────────────┘
                            │ Mongoose ODM Queries
                            ▼
┌────────────────────────────────────────────────────────┐
│                 MongoDB Database                       │
│  - Users Collection                                    │
│  - JobApplications Collection (indexed by userId)      │
└────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Design

### 1. User Model (`User.js`)
| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Auto-generated | Unique identifier |
| `username` | String | Required, trimmed, minlength: 2 | User's display name |
| `email` | String | Required, unique, lowercase, trimmed | User's email address |
| `passwordHash`| String | Required | Bcrypt salted hash (hidden from JSON output) |
| `createdAt` | Date | Auto-timestamp | Creation timestamp |
| `updatedAt` | Date | Auto-timestamp | Last update timestamp |

### 2. Job Application Model (`JobApplication.js`)
| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Auto-generated | Unique application identifier |
| `userId` | ObjectId | Required, ref: `User`, indexed | ID of the user who owns this application |
| `company` | String | Required, trimmed | Company name (e.g. Google, Infosys) |
| `jobRole` | String | Required, trimmed | Role applied for (e.g. SDE-1) |
| `status` | String | Required, Enum | Status stage (see 7 valid enum values) |
| `appliedDate`| Date | Default: `Date.now` | Date when the application was submitted |
| `jobUrl` | String | Optional, trimmed | URL link to job posting |
| `notes` | String | Optional, trimmed | Notes, interview details, prep material |
| `createdAt` | Date | Auto-timestamp | Record creation timestamp |
| `updatedAt` | Date | Auto-timestamp | Record last updated timestamp |

---

## 🔌 API Documentation

Base URL: `http://localhost:5000/api`

### Authentication Endpoints

#### 1. Register User
- **Method & Route**: `POST /auth/register`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "username": "Dev User",
    "email": "dev@example.com",
    "password": "Password123"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "message": "User registered successfully",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "user": {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "username": "Dev User",
      "email": "dev@example.com"
    }
  }
  ```
- **Common Errors**:
  - `400 Bad Request`: Missing fields, invalid email format, password < 6 characters, or email already registered.

#### 2. User Login
- **Method & Route**: `POST /auth/login`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "dev@example.com",
    "password": "Password123"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "user": {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "username": "Dev User",
      "email": "dev@example.com"
    }
  }
  ```
- **Common Errors**:
  - `400 Bad Request`: Missing email or password.
  - `401 Unauthorized`: Invalid email or password.

---

### Job Application Endpoints (Protected by JWT)

All requests to `/applications` must provide the JWT header:
`Authorization: Bearer <token>`

#### 3. Create Application
- **Method & Route**: `POST /applications`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "company": "Infosys",
    "jobRole": "Software Engineer",
    "status": "Applied",
    "appliedDate": "2026-09-01",
    "jobUrl": "https://careers.infosys.com/job/123",
    "notes": "Applied through campus placement"
  }
  ```
- **Success Response (201 Created)**: Returns the newly created application object with assigned `userId`.
- **Common Errors**:
  - `400 Bad Request`: Missing company or jobRole, or invalid status enum.
  - `401 Unauthorized`: Token missing or invalid.

#### 4. Get All Applications (with Search & Status Filter)
- **Method & Route**: `GET /applications`
- **Query Parameters**:
  - `search` (optional): Filter company by substring (e.g. `?search=info`)
  - `status` (optional): Filter by exact status (e.g. `?status=Interview`)
  - Combined: `?search=google&status=Interview`
- **Success Response (200 OK)**: Array of application objects owned by the authenticated user.

#### 5. Get Single Application
- **Method & Route**: `GET /applications/:id`
- **Auth Required**: Yes
- **Success Response (200 OK)**: Application object.
- **Common Errors**:
  - `404 Not Found`: Application does not exist or belongs to another user.

#### 6. Update Application
- **Method & Route**: `PUT /applications/:id`
- **Auth Required**: Yes
- **Request Body**: JSON object containing fields to update (`company`, `jobRole`, `status`, `appliedDate`, `jobUrl`, `notes`).
- **Success Response (200 OK)**: Updated application object.
- **Common Errors**:
  - `400 Bad Request`: Empty company/role or invalid status enum.
  - `404 Not Found`: Application does not exist or belongs to another user.

#### 7. Delete Application
- **Method & Route**: `DELETE /applications/:id`
- **Auth Required**: Yes
- **Success Response (200 OK)**:
  ```json
  {
    "message": "Application deleted successfully"
  }
  ```
- **Common Errors**:
  - `404 Not Found`: Application does not exist or belongs to another user.

---

## ⚙️ Environment Variables

Copy `backend/.env.example` to `backend/.env` and adjust the variables:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/job_tracker_db
JWT_SECRET=your_secret_here
```

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js (v18+)
- MongoDB running locally on port 27017 (or MongoDB Atlas connection URI)

### 1. Clone & Setup Backend
```bash
cd backend
npm install
# Ensure .env is configured with your JWT_SECRET and MONGO_URI
npm start
# Or for live development:
npm run dev
```

### 2. Setup Frontend
```bash
cd ../frontend
npm install
npm run dev
```
Open your browser at `http://localhost:3000`.

### 3. Run Automated Backend Test Suite
With the backend server running:
```bash
cd backend
node test-api.js
```

---

## 🔒 Security Summary

1. **Password Hashing**: `bcryptjs` with 10 salt rounds transforms plaintext passwords before saving.
2. **JWT Authentication**: Protected routes require valid signed tokens in the `Authorization` header.
3. **Strict Ownership Scoping**: Every database lookup, update, and deletion is constrained with `{ _id: id, userId: req.user.userId }`.
4. **Data Sanitization**: MongoDB queries escape regex inputs; Mongoose schemas enforce types and enum constraints.
