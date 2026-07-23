# Miva Open University — Service Request Portal

A full-stack MERN application that lets students/staff submit facility maintenance
requests (electrical, plumbing, furniture, internet, classroom equipment, hostel
issues), lets maintenance officers track and update assigned jobs, and gives
administrators tools to manage users, assign work, and generate reports.

## Stack

- **Frontend:** React (Vite), React Router, Axios, Recharts, lucide-react
- **Backend:** Node.js, Express, Mongoose (MongoDB)
- **Auth:** JWT, bcrypt password hashing
- **Docs:** Swagger UI (OpenAPI 3.0) at `/api-docs`
- **Testing:** Jest + Supertest + mongodb-memory-server

## Project structure

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

## 1. Local setup

### Prerequisites
- Node.js 18+
- MongoDB running locally, or a MongoDB Atlas connection string

### Backend

```bash
cd backend
cp .env.example .env
# edit .env: set MONGO_URI and a strong JWT_SECRET
npm install
npm run seed     # creates roles, categories, and 3 demo accounts
npm run dev       # starts on http://localhost:5000
```

Demo accounts created by the seed script (password for all: `password123`):

| Role | Email |
|---|---|
| Student/Staff | student@miva.edu.ng |
| Maintenance Officer | officer@miva.edu.ng |
| Administrator | admin@miva.edu.ng |

API docs: `http://localhost:5000/api-docs`

### Frontend

```bash
cd frontend
cp .env.example .env
# edit .env if your backend runs somewhere other than localhost:5000
npm install
npm run dev       # starts on http://localhost:5173
```

## 2. Running tests

```bash
cd backend
npm test
```

The test suite spins up an in-memory MongoDB instance automatically (via
`mongodb-memory-server`) — no separate database is required to run tests.


## 3. Advanced features implemented

1. **JWT authentication** — stateless auth, 7-day expiry, `Authorization: Bearer <token>`.
2. **Role-based access control** — `student_staff`, `maintenance_officer`, `admin`, enforced in middleware on every protected route.
3. **File/image upload for evidence** — Multer, up to 5 files per request, 5MB each, images or PDF.
4. **Search, filter, and pagination** — full-text search plus status/priority/category filters and paginated results on `GET /api/requests`.

Bonus, effectively included by the data model: an **audit trail / activity log**
(`StatusLog` collection records every status transition with who made it and when).

## 4. Deployment

A common free/low-cost setup:

- **Database:** [MongoDB Atlas](https://www.mongodb.com/atlas) free tier — create a cluster, a database user, and copy the connection string into `MONGO_URI`.
- **Backend:** [Render](https://render.com) — deploy `backend/` as a Web Service, set `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` (your frontend URL) as environment variables, build command `npm install`, start command `npm start`.
- **Frontend:** [Vercel](https://vercel.com) — deploy `frontend/`, set `VITE_API_URL` to your deployed backend's `/api` URL, build command `npm run build`, publish directory `dist`.

After deploying, run the seed script once against your production database
(e.g. via the hosting provider's shell, or temporarily by running `npm run
seed` locally with `MONGO_URI` pointed at Atlas) to create demo accounts.


## 5. API documentation

Full endpoint reference (routes, request/response schemas, auth requirements)
is available as interactive Swagger UI at `/api-docs` once the backend is
running, and as a static spec at `backend/config/openapi.json` which you can
also import into Postman.

## 6. Database entities and relationships

- **User** — has one `role` (string enum, referencing the Role collection by key)
- **Role** — reference collection describing each role's permissions
- **RequestCategory** — one-to-many with ServiceRequest
- **ServiceRequest** — many-to-one with User (submittedBy) and RequestCategory; one-to-many with Assignment and StatusLog
- **Assignment** — many-to-one with ServiceRequest and User (officer); tracks reassignment history via `active` flag
- **StatusLog** — many-to-one with ServiceRequest and User (changedBy); append-only audit trail

## Notes

- The Jest test suite (`backend/tests/`) was written and syntax-verified, and the
  server was smoke-tested against its full route table. Full end-to-end test
  execution requires MongoDB (downloaded automatically by
  mongodb-memory-server), so run `npm test` locally where the download isn't
  blocked to see it pass.
