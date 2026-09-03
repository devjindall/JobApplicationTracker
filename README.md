# 💼 Job Application Tracker (MERN Stack)

[![MERN Stack](https://img.shields.io/badge/Stack-MERN-blue.svg)](https://github.com/devjindall/JobApplicationTracker)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20%7C%20Mongoose-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![JWT Auth](https://img.shields.io/badge/Auth-JWT%20%7C%20Bcrypt-000000?logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A modern, full-stack **Job Application Tracker** built with the **MERN** stack (MongoDB, Express.js, React.js, Node.js). Designed for software engineering candidates to organize applications, monitor progress across recruitment stages, perform instant debounced searches and stage filtering, and ensure rigorous data isolation with stateless JWT authentication and bcrypt password hashing.

---

## 📑 Table of Contents

- [Features Overview](#-features-overview)
- [System Architecture](#-system-architecture)
- [Database Design & Performance Indexing](#-database-design--performance-indexing)
- [API Reference & Contracts](#-api-reference--contracts)
- [Security & Authorization Design](#-security--authorization-design)
- [Engineering Decisions & Trade-offs](#-engineering-decisions--trade-offs)
- [Getting Started & Local Setup](#-getting-started--local-setup)
- [Automated Integration Testing](#-automated-integration-testing)

---

## 🌟 Features Overview

### 1. User Authentication & Session Management
- **Stateless JWT Authorization**: Cryptographically signed JSON Web Tokens (7-day TTL) for distributed authentication.
- **Bcrypt Password Hashing**: Passwords salted (10 rounds) and hashed before persistence; plain text passwords are never stored.
- **Data Protection**: Schema-level transformation automatically strips `passwordHash` from all JSON responses.
- **Protected Routing**: Client-side route guards combined with server-side middleware verification.

### 2. Job Application Lifecycle Management (CRUD)
- **Comprehensive Tracking**: Log company, role, stage, application date, external posting URL, and interview notes.
- **Strict Data Ownership**: Every query is filtered through authenticated user identity (`req.user.userId`).
- **Flexible Stage Transitions**: Move seamlessly between any recruitment stage:
  `Applied` • `Resume Shortlisted` • `OA Done` • `Interview` • `Waiting for Result` • `Selected` • `Rejected`
- **Immediate State Synchronization**: UI updates immediately upon create, update, or delete operations.

### 3. Search & Multi-Stage Filtering
- **Debounced Search**: Case-insensitive regex search on company names optimized to minimize network calls.
- **Stage Filtering**: Filter applications by recruitment stage directly from the dashboard.

### 4. Client-Side Analytics Dashboard
- Dynamic overview metrics calculated in memory from application state:
  - **Total Applications**
  - **In Progress** (`Applied`, `Resume Shortlisted`, `OA Done`, `Waiting for Result`)
  - **Interviews Scheduled**
  - **Offers / Selected**
  - **Rejections**

---

## 🏛️ System Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                    React.js Frontend (Vite)                     │
│  - Analytics Overview (useMemo computed)                        │
│  - Debounced Company Search & Status Dropdown                   │
│  - Application Cards & Modal Form (Add / Edit)                  │
│  - Centralized api.js (Auto Bearer Token Injection)             │
└────────────────────────────────┬────────────────────────────────┘
                                 │ HTTP / JSON (Authorization: Bearer <JWT>)
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Express.js REST API Server                   │
│  - /api/auth (Register, Login, Me)                              │
│  - /api/applications (Protected CRUD Endpoints)                 │
│  - JWT Middleware (Extracts & Validates req.user.userId)        │
│  - Centralized Error & CastError Handling                       │
└────────────────────────────────┬────────────────────────────────┘
                                 │ Mongoose ODM
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                       MongoDB Database                          │
│  - users Collection                                             │
│  - jobapplications Collection (Compound Index: { userId, date })│
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Design & Performance Indexing

### 1. User Schema (`models/User.js`)
```javascript
{
  username: { type: String, required: true, trim: true, minlength: 2 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Job Application Schema (`models/JobApplication.js`)
```javascript
{
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company: { type: String, required: true, trim: true },
  jobRole: { type: String, required: true, trim: true },
  status: {
    type: String,
    required: true,
    enum: ['Applied', 'Resume Shortlisted', 'OA Done', 'Interview', 'Waiting for Result', 'Selected', 'Rejected'],
    default: 'Applied'
  },
  appliedDate: { type: Date, default: Date.now },
  jobUrl: { type: String, trim: true, default: '' },
  notes: { type: String, trim: true, default: '' },
  createdAt: Date,
  updatedAt: Date
}
```

### ⚡ Database Indexing Rationale
```javascript
jobApplicationSchema.index({ userId: 1, createdAt: -1 });
```
- **Rationale**: Since all queries scope to the authenticated user, indexing on `{ userId: 1, createdAt: -1 }` avoids collection scans and optimizes query performance to an $O(\log N)$ B-tree index lookup.

---

## 🔌 API Reference & Contracts

Base URL: `http://localhost:5000/api`

### Authentication Endpoints
| Method | Endpoint | Access | Description | Status Code |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | Register new user, hash password, return token | `201 Created` |
| `POST` | `/auth/login` | Public | Verify credentials, return signed JWT | `200 OK` |
| `GET` | `/auth/me` | Protected | Fetch current user profile | `200 OK` |

### Application Endpoints (Protected: `Authorization: Bearer <JWT>`)
| Method | Endpoint | Query / Body | Description | Status Code |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/applications` | `{ company, jobRole, status, appliedDate, jobUrl, notes }` | Create application under authenticated `userId` | `201 Created` |
| `GET` | `/applications` | `?search=google&status=Interview` | Get all applications matching filters for logged-in user | `200 OK` |
| `GET` | `/applications/:id` | `req.params.id` | Get single application (verifies `_id` & `userId`) | `200 OK` |
| `PUT` | `/applications/:id` | `{ status, notes, ... }` | Update application (verifies `_id` & `userId`) | `200 OK` |
| `DELETE`| `/applications/:id`| `req.params.id` | Delete application (verifies `_id` & `userId`) | `200 OK` |

---

## 🔒 Security & Authorization Design

1. **IDOR (Insecure Direct Object Reference) Mitigation**:
   The backend never trusts a `userId` supplied by the client. Identity is resolved exclusively via `req.user.userId` from the verified JWT.
2. **Dual-Key Isolation (`_id` + `userId`)**:
   All single-record queries and mutations execute with dual keys:
   ```javascript
   JobApplication.findOne({ _id: req.params.id, userId: req.user.userId });
   ```
   Cross-user requests return `404 Not Found` rather than `403 Forbidden` to prevent resource existence disclosure.
3. **Regex Injection (ReDoS) Sanitization**:
   User input for search queries is escaped before conversion into MongoDB regex queries:
   ```javascript
   const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
   query.company = { $regex: escapedSearch, $options: 'i' };
   ```

---

## 🧠 Engineering Decisions & Trade-offs

### 1. Stateless JWT vs Stateful Sessions
- **Decision**: Implemented signed JSON Web Tokens transmitted via `Authorization: Bearer <token>`.
- **Trade-off**: JWTs eliminate the overhead of querying a central session database (e.g., Redis) on every API call, enabling horizontal scalability and seamless decoupled architecture.

### 2. Client-Side Metrics Calculation vs Server Aggregation
- **Decision**: Dashboard overview metrics are computed client-side using `useMemo` over the fetched application state.
- **Trade-off**: Since user application datasets are modest ($N \approx 50-200$), in-memory filtering executes in $<1\text{ms}$ on the browser, eliminating unnecessary round-trip database aggregation requests ($O(1)$ network latency).

### 3. Debounced Search vs Instant Keystroke Queries
- **Decision**: Implemented a 250ms debounce on search queries.
- **Trade-off**: Balances instantaneous UI feel with server load, preventing unnecessary API requests during rapid typing.

---

## 💻 Getting Started & Local Setup

### 1. Prerequisites
- **Node.js** (v18+)
- **MongoDB** running locally on port 27017 (or MongoDB Compass)

### 2. Backend Setup
```bash
cd backend
npm install

# Configure environment variables
# backend/.env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/job_tracker_db
JWT_SECRET=your_secret_key_here

npm start
# Or for live development:
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
Open **`http://localhost:3000`** in your browser.

### 4. Viewing Data with MongoDB Compass
1. Open **MongoDB Compass**.
2. Connect to `mongodb://127.0.0.1:27017`.
3. Locate **`job_tracker_db`** to inspect the `users` and `jobapplications` collections.

---

## 🧪 Automated Integration Testing

An automated end-to-end integration test suite is located in `backend/test-api.js`.

To run the verification suite:
```bash
cd backend
node test-api.js
```

### Verified Test Suite Capabilities:
- [x] User registration & password hashing verification
- [x] Duplicate email registration rejection (`400`)
- [x] Login authentication with valid & invalid credentials
- [x] Rejection of unauthenticated requests (`401`)
- [x] Application CRUD operations
- [x] Enum validation on status field (`400`)
- [x] Case-insensitive regex search
- [x] Status filter accuracy
- [x] **Multi-User Ownership Isolation**: Verifies User 2 cannot access, update, or delete User 1's applications.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
