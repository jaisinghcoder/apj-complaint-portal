# Online Complaint Management System (OCMS)

Monorepo:
- `client/` React (Vite)
- `server/` Node.js + Express + MongoDB

## Prereqs
- Node.js 18+ (or newer)
- MongoDB running locally (or a hosted MongoDB URI)

## Setup
1. Install dependencies:
   - `npm install --workspaces`
2. Configure server env:
   - Copy `server/.env.example` to `server/.env`
   - Set at least `MONGODB_URI` and `JWT_SECRET`
3. (Optional) Seed an admin user:
   - `npm run seed:admin -w server`

## Run (dev)
- `npm run dev`

Client: http://localhost:5173
Server: http://localhost:5000

## Accounts
- Users can self-register in the UI.
- Admins should be created via `npm run seed:admin -w server` (recommended).
  - Admin can then log in via the same Login screen.

## API (high level)
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/complaints` (user)
- `GET /api/complaints` (user sees own; admin sees all; supports `status` + `category` filters)
- `PATCH /api/complaints/:id/status` (admin)
