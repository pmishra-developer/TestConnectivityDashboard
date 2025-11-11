# Testing Dashboard

A testing dashboard application for email delivery and database connections with session-based authentication using cookies.

## Architecture

This application consists of two parts:
- **Frontend**: React + TypeScript + Vite
- **Backend**: Express + TypeScript with session cookies

## Features

- Session cookie-based authentication
- Email testing via SMTP and Amazon SES
- Database connection testing
- No external authentication dependencies

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Installation

```bash
npm install
```

### Development

Run both the frontend and backend in separate terminals:

**Terminal 1 - Backend Server:**
```bash
npm run dev:server
```
This starts the Express server on port 3001 with session cookie support.

**Terminal 2 - Frontend:**
```bash
npm run dev
```
This starts the Vite development server on port 5173.

### Building for Production

**Build Frontend:**
```bash
npm run build
```

**Build Backend:**
```bash
npm run build:server
```

**Start Production Server:**
```bash
npm run start:server
```

## Session Cookies

The application uses HTTP-only session cookies for tracking user sessions:
- Cookies are automatically set on first request
- Sessions expire after 30 minutes of inactivity
- Expired sessions are cleaned up every 5 minutes

## API Endpoints

### Email
- `POST /api/email/smtp` - Send email via SMTP
- `POST /api/email/ses` - Send email via Amazon SES

### Database
- `POST /api/database/test` - Test database connection

### Health
- `GET /api/health` - Check server status

## Environment Variables

Create a `.env` file with:

```
PORT=3001
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

**Note:** The frontend uses Vite's proxy configuration to forward `/api/*` requests to the backend server.

## Testing with Local PostgreSQL

When testing database connections, use the PostgreSQL connection format:

**Connection String:** `postgresql://localhost:5432/postgres`
**Username:** Your PostgreSQL username (e.g., `postgres`)
**Password:** Your PostgreSQL password

**Important:** Do NOT use the JDBC format (`jdbc:postgresql://...`). Use the standard PostgreSQL format shown above.

## Troubleshooting

### "Failed to fetch" Error

If you see a "Failed to fetch" error:

1. **Check Backend Server:** Make sure the backend server is running with `npm run dev:server`
2. **Check Ports:** Backend should be on port 3001, frontend on port 5173
3. **Restart Frontend:** After starting the backend, restart the frontend dev server

### Database Connection Issues

If database connection fails:

1. **Check PostgreSQL is Running:** Ensure your local PostgreSQL service is running
2. **Verify Credentials:** Double-check your username and password
3. **Check Port:** PostgreSQL typically runs on port 5432
4. **Connection String Format:** Use `postgresql://localhost:5432/database_name` (not JDBC format)
5. **Database Exists:** Ensure the database name in the connection string exists
