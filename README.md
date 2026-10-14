# Military Asset Management System

A full-stack application for managing military base inventory, purchases, transfers, assignments, returns, and expenditures.

## Live Links

- **Frontend:** https://military-asset-management-fio6.onrender.com/
- **Backend:** https://military-asset-management-server.onrender.com
- **Health Check:** https://military-asset-management-server.onrender.com/api/health
- **GitHub:** https://github.com/PARTHA-PATTANAYAK-02/military-asset-management

## Tech Stack

- **Frontend:** React, Vite, JavaScript, CSS
- **Backend:** Node.js, Express.js
- **Database:** MySQL
- **Authentication:** JWT, bcryptjs
- **Deployment:** Render (frontend and backend), Aiven (MySQL)

## Main Features

- Inventory dashboard
- Equipment purchases and transfers
- Equipment assignments and returns
- Expenditure tracking
- Role-based access control
- Audit logging

## User Roles

- **ADMIN:** Overall system access according to implemented permissions.
- **BASE_COMMANDER:** Access to the assigned base's dashboard and permitted purchase and transfer operations.
- **LOGISTICS_OFFICER:** Purchase and transfer operations, subject to backend permissions.

## Database

The MySQL database includes the following tables:

- `users`
- `bases`
- `equipment_types`
- `opening_balances`
- `purchases`
- `transfers`
- `assignments`
- `expenditures`
- `audit_logs`

SQL backup: `Backup/military_asset_db.sql`

## Run Locally

### Prerequisites

- Node.js and npm
- MySQL-compatible database
- Git

### Backend Setup

```bash
cd server
npm install
```

Create a `server/.env` file with the required database connection values, `JWT_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`.

```bash
npm run dev
```

### Frontend Setup

Open another terminal:

```bash
cd client
npm install
npm run dev
```

Import the SQL backup into a MySQL database before starting the backend. Configure the frontend API URL to point to the backend you are using.

## User Creation Scripts

The backend includes two scripts for creating user accounts.

### 1. Create Admin

**File:** `server/scripts/createAdmin.js`

This script creates the Admin account using `ADMIN_EMAIL` and `ADMIN_PASSWORD` from the backend `.env` file. The password is hashed using bcrypt before being stored in the database.

Run from the `server` directory:

```bash
node scripts/createAdmin.js
```

### 2. Create Demo Users

**File:** `server/scripts/createTestUsers.js`

This script creates demo accounts for the following roles:

- `BASE_COMMANDER`
- `LOGISTICS_OFFICER`

The script defines each demo user's email, password, role, and assigned base.

Run from the `server` directory:

```bash
node scripts/createTestUsers.js
```

Both scripts skip accounts whose email addresses already exist. They do not update existing passwords or roles.

**Security:** Never commit `.env` files, database credentials, JWT secrets, or real passwords to GitHub.

## API Overview

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check backend and database connectivity |
| POST | `/api/auth/login` | Authenticate a user |
| GET | `/api/auth/me` | Retrieve the authenticated user's information |
| — | `/api/dashboard` | Dashboard routes |
| — | `/api/purchases` | Purchase routes |
| — | `/api/transfers` | Transfer routes |
| — | `/api/assignments` | Assignment and return routes |
| — | `/api/expenditures` | Expenditure routes |

Refer to the corresponding files inside `server/routes/` for supported HTTP methods and request details.

## Deployment

- **Frontend:** Render Static Site
- **Backend:** Render Web Service
- **Database:** Aiven MySQL

The backend connects to the hosted database through environment variables and an SSL-enabled connection.

## Submission Deliverables

- Source code and SQL database backup
- PDF documentation
- Deployed frontend and backend links
- Demo video demonstrating the main workflows

## Author

Partha Pattanayak
