# 🎓 Technical Interview Defense & Prep Guide

*A deep-dive technical study guide for defending the Job Application Tracker codebase during placement and full-stack engineering interviews.*

---

## 📑 Core Architecture & Request Flow

```text
1. User clicks "Save Application" on React UI
   ↓
2. ApplicationForm.jsx validates inputs and dispatches applicationApi.create(formData)
   ↓
3. api.js extracts JWT from localStorage and attaches `Authorization: Bearer <token>`
   ↓
4. Express receives POST /api/applications in server.js
   ↓
5. authMiddleware.js executes:
   - Reads Authorization header
   - Verifies JWT with process.env.JWT_SECRET
   - Attaches req.user = { userId: decoded.userId }
   - Calls next()
   ↓
6. applicationController.js creates document with userId: req.user.userId
   ↓
7. Mongoose validates schema constraints and enum values
   ↓
8. MongoDB persists the document
   ↓
9. Express responds with 201 Created and JSON payload
   ↓
10. React receives 201 response, closes modal, and refreshes the application list
```

---

## 🎯 Top 30 Technical Interview Questions & Answers

### 1. Why did you use MongoDB?
MongoDB is a document-oriented NoSQL database that stores data in flexible, JSON-like BSON documents. It pairs naturally with JavaScript/Node.js objects, provides high write throughput, and cleanly handles semi-structured data like optional job URLs and notes.

### 2. Why Mongoose instead of the native MongoDB driver?
Mongoose provides an ODM (Object Data Modeling) layer that adds schema validation, type casting, default values, enum constraints, and query middleware on top of raw MongoDB.

### 3. Why JWT over server-side session cookies?
JWT (JSON Web Token) is stateless. The server verifies the token signature using a secret key without querying a central session store (e.g. Redis) on every HTTP request. This makes the API horizontally scalable and easy to consume across different clients.

### 4. Why hash passwords with bcrypt instead of SHA-256 or MD5?
SHA-256 and MD5 are fast cryptographic hashing algorithms, making them vulnerable to modern GPU brute-force and rainbow table attacks. `bcrypt` incorporates a random salt and an adjustable work factor (salt rounds: 10), intentionally slowing down computation to thwart brute-force attempts.

### 5. Why is `userId` extracted from the JWT rather than trusted from the request body?
If `userId` were accepted from the request body, any authenticated user could pass another user's `userId` and create, view, or modify applications on their behalf (IDOR vulnerability). Extracting `userId` from the verified JWT ensures the server trusts only the cryptographically verified identity.

### 6. What is the difference between `req.params` and `req.query`?
- `req.params`: Route parameters from the URL path (e.g., `/api/applications/:id` $\rightarrow$ `req.params.id`). Used to identify specific resources.
- `req.query`: Query parameters following `?` in the URL (e.g., `/api/applications?search=Google&status=Interview` $\rightarrow$ `req.query.search`, `req.query.status`). Used for filtering, sorting, and pagination.

### 7. What is Express middleware and why is `next()` necessary?
Middleware functions have access to the request object (`req`), response object (`res`), and the `next` function in the cycle. Calling `next()` passes execution to the subsequent middleware or controller; omitting `next()` without sending a response hangs the HTTP connection.

### 8. Why check both `_id` and `userId` in queries?
Querying with `{ _id: req.params.id, userId: req.user.userId }` ensures strict data ownership. If a user attempts to access an application ID belonging to someone else, MongoDB returns `null`, enabling a safe `404 Not Found` response.

### 9. What happens if the JWT is invalid or expired?
`jwt.verify()` throws a `JsonWebTokenError` or `TokenExpiredError`. The `try...catch` block in `authMiddleware.js` catches this and returns `401 Unauthorized`, preventing controller execution.

### 10. Why return 201 for application creation?
HTTP `201 Created` specifically indicates that the request succeeded and resulted in the creation of a new database resource, whereas `200 OK` is used for general successful operations.

### 11. Where is validation performed?
Validation is implemented on **both** frontend and backend:
- **Frontend**: Immediate feedback (empty fields, password confirmation).
- **Backend**: Data integrity and security (Mongoose schemas, email regex, enum checks). Backend validation is mandatory because frontend checks can be bypassed using tools like Postman or cURL.

### 12. How does the application prevent Regex Injection (ReDoS) in the search feature?
In `applicationController.js`, special regex characters are escaped using `search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')` before passing the input to MongoDB's `$regex`.

### 13. How does the schema prevent `passwordHash` from being sent in API responses?
`User.js` defines a schema-level `toJSON` transform:
```javascript
userSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.passwordHash;
    return ret;
  }
});
```

### 14. What is the purpose of the compound index `{ userId: 1, createdAt: -1 }`?
It indexes documents by `userId` first, then by `createdAt` descending. This optimizes user-specific application lookups and sorting from an $O(N)$ collection scan down to an $O(\log N)$ B-tree index traversal.

### 15. What is the difference between `findById` and `findOne`?
`findById(id)` queries solely by the `_id` field. `findOne(criteria)` allows matching on multiple fields (e.g. `{ _id, userId }`), which is essential for multi-user authorization.

### 16. What does `runValidators: true` do in `findOneAndUpdate`?
By default, Mongoose validation only runs on `save()` and `create()`. Passing `{ runValidators: true }` forces Mongoose to enforce schema constraints (e.g., status enums) during update operations.

### 17. What is CORS and why is it needed?
Cross-Origin Resource Sharing is a browser security mechanism that restricts HTTP requests from one origin to another. The `cors()` middleware adds appropriate headers so the frontend (port 3000) can communicate with the backend (port 5000).

### 18. Why use `useMemo` for dashboard metrics instead of a dedicated statistics endpoint?
Since the user's applications ($N \approx 50-200$) are already fetched into React state for the dashboard, computing metrics in memory takes $<1\text{ms}$ on the browser, saving unnecessary database roundtrips.

### 19. How does search debouncing work in `Dashboard.jsx`?
When the user types, a `setTimeout` of 250ms is set. If another keystroke occurs before 250ms, the cleanup function `clearTimeout(timer)` cancels the previous request, sending only one network request when typing pauses.

### 20. Why return `404 Not Found` instead of `403 Forbidden` for cross-user requests?
Returning 403 confirms that the requested resource ID exists in the database (information disclosure). Returning 404 treats foreign resources as non-existent.

### 21. What is the difference between `401 Unauthorized` and `403 Forbidden`?
- `401 Unauthorized`: Unauthenticated (missing, expired, or invalid token).
- `403 Forbidden`: Authenticated, but lacks permissions to access the resource.

### 22. What does `useCallback` do in `Dashboard.jsx`?
`useCallback` memoizes the `fetchApplications` function reference between re-renders, preventing unnecessary trigger loops in `useEffect`.

### 23. How does `ProtectedRoute.jsx` protect frontend routes?
It checks if the user is authenticated (valid token in `localStorage`). If not, it redirects to the login view. Note: The real security boundary remains the backend JWT middleware.

### 24. How is centralized error handling structured in Express?
In `errorMiddleware.js`, a 4-argument function `(err, req, res, next)` catches errors, normalizes Mongoose `CastError`, `ValidationError`, and duplicate key errors (`11000`), and returns structured JSON responses.

### 25. How do you handle duplicate email registrations?
The `User` model defines `email` with `unique: true`. If a duplicate email is submitted, the controller checks existence or the error middleware catches code `11000` and returns `400 Bad Request`.

### 26. What is the structure of a JWT?
Three Base64Url-encoded parts separated by dots:
1. **Header**: Token type and signing algorithm (e.g., HS256).
2. **Payload**: Claims (e.g., `userId`, `exp`).
3. **Signature**: Cryptographic hash of header + payload using the secret key.

### 27. Why should you never store sensitive data like passwords in a JWT payload?
JWT payloads are encoded, not encrypted. Anyone who intercepts the token can decode and view the payload.

### 28. How does `ApplicationForm` support both Add and Edit modes?
It inspects `initialData`. If `initialData` exists with an `_id`, it populates the fields, switches title to "Edit Application", and calls `applicationApi.update`. Otherwise, it presents blank fields and calls `applicationApi.create`.

### 29. What is idempotency in REST APIs?
An HTTP method is idempotent if executing it multiple times produces the same result on the server. `GET`, `PUT`, and `DELETE` are idempotent; `POST` is non-idempotent because multiple calls create multiple records.

### 30. How was multi-user isolation verified?
Using an automated test script (`backend/test-api.js`), User 1 creates applications, and User 2 attempts to `GET`, `PUT`, and `DELETE` User 1's records. All cross-user attempts returned `404 Not Found`.
