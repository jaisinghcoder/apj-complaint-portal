# OCMS — How to Use

This is a step-by-step guide to run and use the Online Complaint Management System (OCMS).

## 1) Prerequisites
- Node.js 18+ (your repo works with newer Node as well)
- MongoDB running locally (or a hosted MongoDB connection string)

## 2) First-time setup
From the repo root:

1. Install dependencies for both workspaces:
   - `npm install --workspaces`

2. Create the server environment file:
   - Copy `server/.env.example` to `server/.env`
   - Set these values:
     - `MONGODB_URI` (must include a DB name, e.g. `mongodb://127.0.0.1:27017/complaints`)
     - `JWT_SECRET` (any non-empty string for dev)

3. Start MongoDB
- If using local MongoDB, ensure it is running before starting the server.

## 3) Create an Admin account (recommended)
The easiest way to create an admin is via the seed script.

1. Edit `server/.env` (optional):
   - `ADMIN_NAME`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`

2. Run the seed:
- `npm run seed:admin -w server`

If the admin already exists, it will print a message and exit.

## 4) Run the app (development)
From the repo root:
- `npm run dev`

URLs:
- Client (React): `http://localhost:5173`
- Server (API): `http://localhost:5000`

## 5) Using the system (User module)
1. Open the client URL.
2. Register a new user account.
3. After login, you’ll land on the Dashboard.
4. Submit a complaint:
   - Choose a Category
   - Enter Title + Description
   - Click Submit
5. Track complaint history:
   - The dashboard shows your submitted complaints and their current status.
   - Click Refresh to reload (it also auto-refreshes periodically).

Complaint statuses:
- `Pending` → newly created
- `In Progress` → being handled
- `Resolved` → completed

## 6) Using the system (Admin module)
1. Open the client URL.
2. Login using the seeded admin email/password.
3. The dashboard will show the Admin view.
4. View complaints:
   - Admin can see all complaints.
5. Filter complaints:
   - Filter by Status
   - Filter by Category (text)
6. Update complaint status:
   - Use the Status dropdown in the table to change to Pending / In Progress / Resolved.

## 7) Troubleshooting
**Server says `Missing JWT_SECRET`**
- Ensure `server/.env` exists and has `JWT_SECRET=...`

**Mongo connection errors**
- Ensure MongoDB is running.
- Verify `MONGODB_URI` is correct and includes a database name.

**Client can’t call API**
- Client proxies `/api` to `http://localhost:5000`.
- Ensure the server is running on port 5000 (or adjust `client/vite.config.js`).

## 8) Useful commands
From repo root:
- Start server only: `npm run dev:server`
- Start client only: `npm run dev:client`
- Build client: `npm run build -w client`

