# NXAD

NXAD (NX Attack And Defense) is a Next.js platform for Attack-Defense style cybersecurity competitions. It includes team login, flag submission, scoreboard, chat, passive points, and an admin dashboard.

## Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- MongoDB + Mongoose
- Docker Compose

## Structure

```txt
src/
├── app/
├── components/
├── hooks/
├── lib/
├── models/
└── middleware.ts

scripts/
└── setup-database.js
```

Root files are kept for framework and tooling configuration only.

## Environment

Create your local env file:

```bash
cp .env.example .env
```

Set at least these values before setup:

```env
MONGODB_URI=mongodb://localhost:27017/nxad
MONGODB_DATABASE=nxad

ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-me
```

Do not edit `scripts/setup-database.js` just to change credentials. Use `.env` instead.

## Local Setup

Install dependencies:

```bash
pnpm install
```

Run MongoDB locally, then initialize the database:

```bash
ADMIN_USERNAME=admin ADMIN_PASSWORD=change-me MONGODB_DATABASE=nxad mongosh --file scripts/setup-database.js
```

Start development server:

```bash
pnpm dev
```

Open `http://localhost:3000`.

Admin panel: `http://localhost:3000/admin/login`

## Docker Setup

Create `.env` first, then run:

```bash
docker compose up -d --build
```

Stop services:

```bash
docker compose down
```

## Build

```bash
pnpm build
```

## Notes

- Admin credentials are sourced from `.env`.
- If the seeded admin password is plaintext, the app hashes it automatically on first successful login.
- Competition scoring defaults are configured in `.env.example` and can also be changed from the admin config page at runtime.
