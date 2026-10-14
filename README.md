# TaskFlow — React + Node + MongoDB + Tailwind

Full-stack todo app with email OTP verification (Nodemailer), login, forgot-password OTP, and a polished todo workspace.

## Stack

- **Client:** React (Vite), Tailwind CSS v4, React Router
- **Server:** Node.js, Express, MongoDB (Mongoose), JWT, Nodemailer, bcrypt

## Features

- Register: full name, username, email, phone, password
- Email OTP verification after register
- Login with **email or username** + password
- Forgot password with OTP + new password
- Client + server validation (invalid email, weak password, etc.)
- Protected todo CRUD: create, toggle, filter, search, delete, priorities, due dates

## Setup

### 1. MongoDB

**Option A — Docker (easiest):**

```bash
docker run -d -p 27017:27017 --name taskflow-mongo mongo:7
```

**Option B — Atlas / local install:** put the URI in `server/.env`:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/todo-auth-app
```

### 2. Email (Gmail App Password)

Edit `server/.env`:

```env
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM="TaskFlow <your_email@gmail.com>"
```

If email credentials are still placeholders, OTPs are printed in the **server terminal** (dev mode) so you can still test.

### 3. Install & run

```bash
# Terminal 1 — API
cd server
npm install
npm run dev

# Terminal 2 — UI
cd client
npm install
npm run dev
```

Open **http://localhost:5173**

API runs on **http://localhost:5000**

## API overview

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Start registration + send OTP |
| POST | `/api/auth/verify-otp` | Verify register OTP |
| POST | `/api/auth/resend-otp` | Resend register OTP |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/forgot-password` | Send reset OTP |
| POST | `/api/auth/reset-password` | Reset password with OTP |
| GET | `/api/todos` | List todos (auth) |
| POST | `/api/todos` | Create todo |
| PATCH | `/api/todos/:id/toggle` | Toggle complete |
| PUT | `/api/todos/:id` | Update todo |
| DELETE | `/api/todos/:id` | Delete todo |
