Miva Open University — Service Request Portal

A full-stack MERN application that lets students/staff submit facility maintenance
requests (electrical, plumbing, furniture, internet, classroom equipment, hostel
issues), lets maintenance officers track and update assigned jobs, and gives
administrators tools to manage users, assign work, and generate reports.

Stack

Frontend: React (Vite), React Router, Axios, Recharts, lucide-react
Backend: Node.js, Express, Mongoose (MongoDB)
Auth: JWT, bcrypt password hashing
Docs: Swagger UI (OpenAPI 3.0) at `/api-docs`
Testing: Jest + Supertest + mongodb-memory-server

Project structure

```
mou-service-request-portal/
├── backend/
│   ├── config/        # DB connection, seed script, OpenAPI spec
│   ├── controllers/    # Route handlers
│   ├── middleware/     # auth, RBAC, upload, error handling, validation
│   ├── models/         # User, Role, RequestCategory, ServiceRequest, Assignment, StatusLog
│   ├── routes/          # Express routers
│   ├── tests/           # Jest/Supertest test suites
│   ├── uploads/         # Evidence file storage (created at runtime)
│   └── server.js
└── frontend/
    └── src/
        ├── api/          # Axios client
        ├── components/   # Layout, ticket list, badges, protected route
        ├── context/      # AuthContext
        ├── pages/        # Login, Register, dashboards, request detail, admin pages
        └── styles/       # global.css (design system)
```

1. Local setup

 Prerequisites
- Node.js 18+
- MongoDB running locally, or a MongoDB Atlas connection string



| Role | Email |
|---|---|
| Student/Staff | student@miva.edu.ng |
| Maintenance Officer | officer@miva.edu.ng |
| Administrator | admin@miva.edu.ng |



3. Advanced features implemented

1. JWT authentication— stateless auth, 7-day expiry, `Authorization: Bearer <token>`.
2. Role-based access control — `student_staff`, `maintenance_officer`, `admin`, enforced in middleware on every protected route.
3. File/image upload for evidence — Multer, up to 5 files per request, 5MB each, images or PDF.
4. Search, filter, and pagination — full-text search plus status/priority/category filters and paginated results on `GET /api/requests`.


4. Deployment

A common free/low-cost setup:
Database: [MongoDB Atlas](https://www.mongodb.com/atlas) free tier — create a cluster, a database user, and copy the connection string into `MONGO_URI`.
Backend: [Render](https://render.com) — deploy `backend/` as a Web Service, set `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` (your frontend URL) as environment variables, build command `npm install`, start command `npm start`.
Frontend: [Vercel](https://vercel.com) — deploy `frontend/`, set `VITE_API_URL` to your deployed backend's `/api` URL, build command `npm run build`, publish directory `dist`.

After deploying, run the seed script once against your production database
(e.g. via the hosting provider's shell, or temporarily by running `npm run
seed` locally with `MONGO_URI` pointed at Atlas) to create demo accounts.

 5. API documentation

Full endpoint reference (routes, request/response schemas, auth requirements)
is available as interactive Swagger UI at `/api-docs` once the backend is
running, and as a static spec at `backend/config/openapi.json` which you can
also import into Postman.

6. Database entities and relationships

User — has one `role` (string enum, referencing the Role collection by key)
Role — reference collection describing each role's permissions
RequestCategory — one-to-many with ServiceRequest
ServiceRequest — many-to-one with User (submittedBy) and RequestCategory; one-to-many with Assignment and StatusLog
Assignment — many-to-one with ServiceRequest and User (officer); tracks reassignment history via `active` flag
StatusLog — many-to-one with ServiceRequest and User (changedBy); append-only audit trail

