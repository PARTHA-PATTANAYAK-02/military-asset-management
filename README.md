# Military Asset Management System

A full-stack application for managing base inventory, purchases, transfers, assignments, returns, expenditures, dashboard balances, and audit history.

## Technology Stack

- **Frontend:** React, Vite, JavaScript, CSS
- **Backend:** Node.js, Express
- **Database:** MySQL (`mysql2`)
- **Authentication:** JWT (`jsonwebtoken`)
- **Password hashing:** `bcryptjs`

## Prerequisites

- Node.js and npm
- MySQL Server
- MySQL Workbench (optional)

## Project Structure

```text
MilitaryAssetManagement/
├── server/
│   ├── config/
│   ├── middleware/
│   ├── routes/
│   ├── scripts/
│   ├── server.js
│   └── package.json
└── client/
    ├── src/
    └── package.json
```

## Database Setup

1. Start MySQL.
2. Create the database if it does not already exist:

   ```sql
   CREATE DATABASE military_asset_db;
   ```

3. Import the project's schema/seed SQL file if one is included. If no SQL dump is included, use the existing database setup steps to create the required tables and seed the initial data.
4. Confirm the database contains the required tables, including `users`, `bases`, `equipment_types`, `opening_balances`, `purchases`, `transfers`, `assignments`, `expenditures`, and `audit_logs`.

## Environment Configuration

Create `server/.env` locally. Use the exact MySQL and JWT variable names expected by `server/config/db.js` and the server code.

The admin script expects:

```env
ADMIN_EMAIL=your-admin-email@example.com
ADMIN_PASSWORD=use-a-strong-password-of-at-least-12-characters
```

Do not commit `.env`, database credentials, JWT secrets, or real passwords.

## Install Dependencies

From the project root, install dependencies in each folder.

### Backend

```bash
cd server
npm install
```

### Frontend

Open another terminal:

```bash
cd client
npm install
```

## Create the Initial Admin

After configuring `server/.env` and the database, run from `server/`:

```bash
node scripts/createAdmin.js
```

The script creates the configured admin if it does not already exist and hashes the password using `bcryptjs`.

## Run the Application

### Terminal 1 — Backend

```bash
cd server
npm run dev
```

The backend starts through `server.js`. Confirm the API port from the server configuration or startup message.

### Terminal 2 — Frontend

```bash
cd client
npm run dev
```

Open the local URL printed by Vite.

## Roles

The application defines these roles:

- `ADMIN`
- `BASE_COMMANDER`
- `LOGISTICS_OFFICER`

Authentication and role restrictions are enforced by backend middleware. Base-scoped permissions depend on the authenticated user's assigned `base_id`. Check the implemented routes to confirm the exact permissions before deployment.

## Manual Test Checklist

- [ ] Valid login succeeds.
- [ ] Requests without an authentication token return `401 Unauthorized`.
- [ ] Restricted role actions return `403 Forbidden`.
- [ ] A Base Commander cannot request another base's dashboard.
- [ ] A Base Commander cannot create a transfer between two bases unrelated to their assigned base.
- [ ] Purchases update inventory/dashboard totals.
- [ ] Transfers update source/destination inventory and appear in history.
- [ ] Transfers exceeding available stock are rejected.
- [ ] Assignments can be created and returned.
- [ ] Expenditures can be recorded and appear in history.
- [ ] Successful purchase, transfer, assignment, return, and expenditure actions appear in `audit_logs`.
- [ ] A rejected transfer does not create a transfer record.

## Frontend Build and Lint

From `client/`:

```bash
npm run build
```

Optional lint check:

```bash
npm run lint
```

Resolve any reported errors before submission. The backend's current `npm test` script is a placeholder and does not run an automated test suite.

## Security Notes

- Keep `.env` out of version control.
- Use strong, unique credentials and a secure JWT secret.
- Do not deploy using local test-account credentials.
- Review CORS settings, token expiry, input validation, and role/base scoping before production use.
- Use a non-production database for demonstrations and testing.

## Submission Notes

Include a database schema/data SQL dump if the reviewer needs to recreate the database. Keep setup instructions aligned with the actual backend configuration and SQL files in the repository.
