# 🩸 Blood Finder Admin

Admin dashboard for the **Blood Finder** platform — manage users and monitor platform activity.

## Features

- **Dashboard** — platform stats overview (total users)
- **Users** — paginated table with search, filter by blood group & donor status
- **User Details** — view profile info, donations, blood requests, ban/unban, manage donor status
- **Authentication** — session-based admin login with JWT

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js](https://nextjs.org/) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Library | Base UI + custom components (shadcn-style) |
| Database | Firebase Firestore |
| Auth | JWT via [jose](https://github.com/panva/jose) |

## Prerequisites

- Node.js 20+
- npm
- A Firebase project with Firestore database

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

### Configure Environment

Fill in `.env.local` with your Firebase credentials:

```env
# Login credentials (change in production)
ADMIN_EMAIL=
ADMIN_PASSWORD=

# JWT secret (generate a long random string for production)
JWT_SECRET=your-long-random-string

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Firestore collection name for users
# Defaults to "users" if not set
FIREBASE_USERS_COLLECTION=users
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

## Build & Deploy

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── api/               # API routes
│   │   ├── auth/login/    # POST — authenticate admin
│   │   ├── auth/logout/   # POST — clear session
│   │   └── users/         # GET (list), GET (detail), PATCH, DELETE
│   ├── dashboard/         # Dashboard overview page
│   ├── login/             # Login page
│   ├── users/             # Users list & detail pages
│   │   ├── page.tsx       # Paginated table
│   │   └── [id]/page.tsx  # User detail & actions
│   └── layout.tsx         # Root layout
├── components/
│   ├── ui/                # UI primitives (button, card, input, etc.)
│   ├── header.tsx         # Top bar with logout
│   ├── sidebar.tsx        # Navigation sidebar
│   ├── data-table.tsx     # Reusable table with search & pagination
│   └── status-badge.tsx   # Colored status indicator
└── lib/
    ├── firebase/admin.ts  # Firebase Admin SDK initialization
    ├── types/             # TypeScript type definitions
    ├── auth.ts            # JWT session helpers
    ├── constants.ts       # Collection names, blood groups, etc.
    └── utils.ts           # Shared utilities
```
