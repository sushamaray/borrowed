# Borrowed

A peer-to-peer lending platform built with Next.js, Prisma, MySQL, and Socket.IO.

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MySQL](https://dev.mysql.com/downloads/) running locally (or a remote MySQL instance)

## Setup

### 1. Clone and install dependencies

```bash
git clone https://github.com/neel2214/Software-Engineering-Project.git
cd Software-Engineering-Project
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Then fill in your `.env`:

| Variable | Description |
|---|---|
| `DATABASE_URL` | MySQL connection string, e.g. `mysql://root:password@localhost:3306/borrowed` |
| `AUTH_SECRET` | Random secret for NextAuth — generate with `npx auth secret` |
| `GEMINI_API_KEY` | Google Gemini API key from [aistudio.google.com](https://aistudio.google.com/app/apikey) |

### 3. Set up the database

Create the database in MySQL first:

```sql
CREATE DATABASE borrowed;
```

Then run migrations and generate the Prisma client:

```bash
npx prisma migrate deploy
npx prisma generate
```

### 4. Seed the database

```bash
npm run db:seed
```

### 5. Download face recognition models

```bash
npm run download:face-models
```

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:seed` | Seed the database with initial data |
| `npm run download:face-models` | Download face-api.js model weights |
