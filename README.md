# ai-student-productivity-os

Full-stack starter project with:
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: PostgreSQL + Prisma ORM
- Auth: Register/Login with bcrypt password hashing and JWT tokens

## Project Structure

- `frontend/` React app with pages:
  - Login
  - Register
  - Dashboard (protected)
- `backend/` Express API:
  - `/api/auth/register`
  - `/api/auth/login`
  - `/api/dashboard` (protected with JWT)
  - Prisma `User` model (`name`, `email`, `password`)

## Backend Setup

1. Copy env template:
   - `backend/.env.example` to `backend/.env`
2. Configure PostgreSQL `DATABASE_URL` and `JWT_SECRET` in `backend/.env`
3. Generate Prisma client:
   - `cd backend`
   - `npm run prisma:generate`
4. Run migration:
   - `npm run prisma:migrate`

## Frontend Setup

1. Copy env template:
   - `frontend/.env.example` to `frontend/.env`
2. Ensure `VITE_API_URL` points to backend API (default `http://localhost:5000/api`)

## Run Commands

Open two terminals from the project root:

### Backend
- `cd backend`
- `npm run dev`

### Frontend
- `cd frontend`
- `npm run dev`

## Authentication Flow

- Register at `/register`
- Login at `/login`
- On successful login, JWT token is stored in `localStorage`
- Access `/dashboard` which calls protected backend route using Bearer token
