# 💼 Job Application Tracker (MERN Stack)

[![MERN Stack](https://img.shields.io/badge/Stack-MERN-blue.svg)](https://github.com/devjindall/JobApplicationTracker)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20%7C%20Mongoose-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![JWT Auth](https://img.shields.io/badge/Auth-JWT%20%7C%20Bcrypt-000000?logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A placement-ready, full-stack **Job Application Tracker** built with the **MERN** stack (MongoDB, Express.js, React.js, Node.js). Designed for software engineering candidates and placement applicants to organize job applications, track progress across interview stages, filter/search by company, and ensure complete data isolation with secure JWT authentication and password hashing.

---

## 📑 Table of Contents

- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Database Design & Indexing](#-database-design--indexing)
- [API Reference](#-api-reference)
- [Security & Authorization Architecture](#-security--authorization-architecture)
- [Local Setup & MongoDB Compass](#-local-setup--mongodb-compass)
- [Automated Verification Suite](#-automated-verification-suite)
- [Engineering Decisions & Technical Interview Defense](#-engineering-decisions--technical-interview-defense)

---

## 🌟 Key Features

### 1. User Authentication & Session Security
- **Registration & Login**: Secure account creation and credential validation.
- **Bcrypt Password Hashing**: Passwords are salted (10 rounds) and hashed before persistence; plain text passwords are never stored.
- **Stateless JWT Authorization**: Signed JSON Web Tokens with 7-day validity.
- **Sensitive Field Protection**: `passwordHash` is stripped at the schema layer and never exposed in JSON responses.

### 2. Job Application Lifecycle (CRUD)
- **Create**: Log company, role, stage, application date, job URL, and prep notes.
- **Read**: Fetch applications strictly isolated to the authenticated user.
- **Update**: Transition applications across interview stages and modify records.
- **Delete**: Remove applications with confirmation dialogs.

### 3. Real-time Search & Multi-Stage Filtering
- **Regex Company Search**: Case-insensitive instant search on company names.
- **Status Filter**: Direct filtering matching all 7 standard recruitment stages:
  `Applied` • `Resume Shortlisted` • `OA Done` • `Interview` • `Waiting for Result` • `Selected` • `Rejected`

### 4. Client-Side Metrics Dashboard
- Dynamic status counters computed directly from frontend state:
  - **Total Applied**
  - **In Progress** (`Applied`, `Resume Shortlisted`, `OA Done`, `Waiting for Result`)
  - **Interviews**
  - **Offers / Selected**
  - **Rejected**

---

## 🏛️ System Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                    React.js Frontend (Vite)                     │
│  - Dashboard & Metrics Cards (useMemo computed)                 │
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

## 🗄️ Database Design & Indexing

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
*Note: Includes a schema-level `toJSON` transform deleting `passwordHash` during serialization.*

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

### ⚡ Indexing Strategy
```javascript
jobApplicationSchema.index({ userId: 1, createdAt: -1 });
```
- **Rationale**: All application reads, searches, and deletes filter strictly on `userId`. Creating a compound index on `{ userId: 1, createdAt: -1 }` reduces query complexity from an $O(N)$ collection scan to an $O(\log N)$ B-tree index lookup.

---

## 🔌 API Reference

Base URL: `http://localhost:5000/api`

### Auth Endpoints
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

## 🔒 Security & Authorization Architecture

1. **IDOR (Insecure Direct Object Reference) Prevention**:
   The backend never trusts a `userId` supplied in the request body or parameters. Instead, `authMiddleware` extracts `userId` from the cryptographically verified JWT payload and attaches it to `req.user.userId`.
2. **Dual-Key Isolation (`_id` + `userId`)**:
   Every mutation and single-resource lookup executes:
   ```javascript
   JobApplication.findOne({ _id: req.params.id, userId: req.user.userId });
   ```
   If User B requests an application ID belonging to User A, MongoDB returns `null`, and the API responds with `404 Not Found` (preventing both data leakage and ID enumeration).
3. **Regex Injection (ReDoS) Sanitization**:
   User input for search queries is escaped before being converted into regex:
   ```javascript
   const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
   query.company = { $regex: escapedSearch, $options: 'i' };
   ```

---

## 💻 Local Setup & MongoDB Compass

### 1. Prerequisites
- **Node.js** (v18+)
- **MongoDB** running locally on port 27017 (or MongoDB Compass)

### 2. Backend Setup
```bash
cd backend
npm install

# Configure your environment variables
# backend/.env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/job_tracker_db
JWT_SECRET=your_secret_key_here

npm start
# Or for hot-reload development:
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
Open **`http://localhost:3000`** in your browser.

### 4. Viewing Data in MongoDB Compass
1. Open **MongoDB Compass**.
2. Connect to the local URI:
   ```text
   mongodb://127.0.0.1:27017
   ```
3. In the sidebar, select **`job_tracker_db`** to view the `users` and `jobapplications` collections in real time.

---

## 🧪 Automated Verification Suite

An automated end-to-end integration test suite is included in `backend/test-api.js`.

Run tests with:
```bash
cd backend
node test-api.js
```

### Tested Test Matrix:
- [x] User registration & password hashing validation
- [x] Duplicate email registration rejection (`400`)
- [x] Login authentication with valid & invalid credentials
- [x] Rejection of unauthenticated requests (`401`)
- [x] Application CRUD operations
- [x] Enum validation on status field (`400`)
- [x] Case-insensitive search by company name
- [x] Status filter accuracy
- [x] **Two-User Ownership Isolation**: User 2 receives `404` when attempting to `GET`, `PUT`, or `DELETE` User 1's records.

---

## 🧠 Engineering Decisions & Technical Interview Defense

*This section details the architectural choices, trade-offs, and technical rationale behind this codebase.*

### 1. Why Stateless JWTs over Stateful Sessions?
- **Decision**: Used JSON Web Tokens stored in `localStorage` sent via `Authorization: Bearer <token>`.
- **Rationale**: JWTs are stateless; the server verifies the cryptographic signature with `JWT_SECRET` without needing a central session store (e.g. Redis). This keeps the backend lightweight, horizontally scalable, and decoupled from frontend clients.

### 2. Why Bcrypt with 10 Salt Rounds?
- **Decision**: `bcryptjs` with salt round factor `10`.
- **Rationale**: Plain MD5/SHA256 hashes are vulnerable to rainbow table attacks. Bcrypt incorporates a random salt and adaptive key derivation function (Eksblowfish). 10 rounds strike an optimal balance (~100ms per hash) between cryptographic resilience and server latency.

### 3. Why Compute Metrics on the Frontend instead of a Dedicated Aggregation API?
- **Decision**: Metrics (`Total`, `In Progress`, `Interviews`, `Selected`, `Rejected`) are calculated in React via `useMemo` from the fetched `applications` array.
- **Rationale**: Since the user's active job application set is already fetched for the dashboard view ($N \approx 50-200$), running simple array filters in memory takes $<1\text{ms}$ on the client and eliminates unnecessary round-trip database aggregation requests ($O(1)$ network overhead).

### 4. How is Debouncing Implemented for the Search Input?
- **Decision**: Search query input triggers a `250ms` debounced `useEffect`.
- **Rationale**: Prevents firing an HTTP query on every keystroke, reducing network traffic and database load while maintaining a fluid user experience.

### 5. Why Return `404 Not Found` Instead of `403 Forbidden` for Unauthorized Access?
- **Decision**: Queries combining `_id` and `userId` return `404` when no document is found.
- **Rationale**: Returning `403 Forbidden` confirms to an attacker that the targeted resource ID exists on the server (information leakage). Returning `404 Not Found` treats foreign resources as non-existent.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
