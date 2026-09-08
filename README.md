# Job Application Tracker

A full-stack MERN application for tracking job applications and recruitment stages.

## Features

- User registration and login with JWT authentication
- Create, edit, view, and delete job applications
- Track applications across recruitment stages
- Search applications by company
- Filter applications by stage
- Dashboard showing application statistics
- User-specific application data
- Password hashing and protected API routes

## Tech Stack

- **Frontend:** React, Vite
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Authentication:** JWT, bcrypt

## Project Structure

```text
JobApplicationTracker/
├── frontend/    # React application
├── backend/     # Express API
└── README.md
```

## Data Model

Each job application is linked to the user who created it through `userId`.

The application status is restricted to the supported recruitment stages:

```text
Applied
Resume Shortlisted
OA Done
Interview
Waiting for Result
Selected
Rejected
```

The backend includes an index on `userId` and `createdAt` because application queries are scoped to the logged-in user and commonly sorted by creation time.

## API

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Log in and receive a JWT |
| GET | `/api/auth/me` | Get the logged-in user |

### Applications

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/applications` | Create an application |
| GET | `/api/applications` | List applications with optional search/filtering |
| GET | `/api/applications/:id` | Get one application |
| PUT | `/api/applications/:id` | Update an application |
| DELETE | `/api/applications/:id` | Delete an application |

Application endpoints require a valid JWT. The backend uses the authenticated user's ID when accessing application records so users cannot access another user's applications by changing an ID in the request.

## Search

Company-name search is handled by the backend using a case-insensitive regular expression. Search input is escaped before it is used in the query.

The frontend waits briefly after typing before sending a search request to avoid making a request for every keystroke.

## Testing

The repository includes an integration test suite covering:

- User registration and login
- Duplicate email handling
- Protected routes
- Application CRUD operations
- Status validation
- Search and filtering
- Multi-user data isolation

Run the tests with:

```bash
cd backend
node test-api.js
```

## Setup

### Prerequisites

- Node.js 18+
- MongoDB running locally or a MongoDB connection string

### Backend

```bash
cd backend
npm install
```

Create a `.env` file using the variables described by the project configuration, then start the server:

```bash
npm start
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## License

MIT
