# Shrivox Console

A full-stack support ticket console with a NestJS/Prisma backend and a Next.js frontend, where AI (via Gemini) automatically categorizes tickets, predicts priority, and drafts summaries and support replies.

Shrivox Console is a separate project from Shrivox (the FastAPI/LangGraph conversational support agent) — it's a more traditional ticketing system: users sign up, raise tickets, comment on them, attach files, and get AI assistance while working through them.

## Demo / Screenshots

### Dashboard

Overview of support tickets, status, priority, and category filters.

![Shrivox Console Dashboard](docs/screenshots/dashboard.png)

### AI-Powered Ticket Assistance

AI-generated ticket summaries and suggested support replies help support agents understand and respond to issues faster.

![AI-Powered Ticket Assistance](docs/screenshots/ticket-ai.png)

### Comments & Attachments

Ticket-level collaboration with comments and file attachment management.

![Comments and Attachments](docs/screenshots/ticket-details.png)

## Features

### Authentication
- Email/password signup and login on the backend (`POST /auth/signup`, `POST /auth/login`) — the frontend currently only implements the login form; there is no signup page in the UI yet
- Passwords hashed with bcrypt before storage
- JWT access tokens (1-hour expiry) issued on login, validated via Passport's JWT strategy
- `GET /auth/me` returns the authenticated user from the token payload
- Role field (`USER` / `ADMIN`) on the user model, enforced through a custom `RolesGuard` + `@Roles()` decorator on specific routes (e.g. an admin-only dashboard endpoint)

### Ticket Management
- Full CRUD on tickets (`POST/GET/PATCH/DELETE /tickets`, `GET /tickets/:id`)
- Every ticket is scoped to its creator — reading, updating, or deleting a ticket you didn't create returns a 403
- Status (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`), priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), and category (`GENERAL`, `ACCOUNT`, `BILLING`, `TECHNICAL`, `OTHER`) as enums on the ticket model
- List endpoint supports pagination, status/priority/category filters, case-insensitive title/description search, and sorting (`GET /tickets?page=&limit=&status=&search=&sortBy=&order=`)

### AI Assistance
- On ticket creation, the backend calls Gemini to auto-classify the ticket's `category` and `priority` before saving it — this happens automatically inside `TicketsService.create`, not as a separate manual step
- Standalone AI endpoints are also exposed under `/ai`: `categorize`, `priority`, `summary`, and `reply`
- `/ai/summary` produces a short summary of a ticket + its comment thread; `/ai/reply` drafts a support reply from the same context
- Each AI call falls back to a safe default (`GENERAL` category, `MEDIUM` priority, or an "unable to generate" message) if the Gemini call fails, so a flaky AI call doesn't block ticket creation

### Comments
- Threaded comments per ticket (`POST/GET /tickets/:ticketId/comments`)
- Same ownership check as tickets — only the ticket's creator can view or add comments on it

### Attachments
- File upload per ticket (`POST /tickets/:ticketId/attachments`) using Multer with disk storage
- Whitelisted MIME types (PNG, JPEG, PDF, plain text), 10 MB size limit, randomized filenames on disk
- List, download (`GET /tickets/:ticketId/attachments/:attachmentId`, streams the file), and delete (removes both the DB row and the file on disk)

### Dashboard
- `GET /dashboard` returns per-user ticket counts (total, open, in progress, resolved, closed, urgent) plus the 5 most recent tickets
- `GET /dashboard/admin` is a role-gated endpoint restricted to `ADMIN` users

### API / Backend
- All ticket, comment, attachment, and dashboard routes require a valid JWT (`JwtAuthGuard`)
- The standalone `/ai/*` endpoints (`categorize`, `priority`, `summary`, `reply`) do **not** have `JwtAuthGuard` applied — they are currently open, unauthenticated routes (see [Engineering Notes](#engineering-notes))
- Request validation via `class-validator` DTOs with `whitelist`/`transform` enabled globally
- Auto-generated Swagger docs at `/api`, with bearer-token auth wired in

## Architecture

```mermaid
flowchart TD
    User[User] --> FE[Next.js Frontend]
    FE -->|REST + JWT Bearer token| BE[NestJS Backend]

    BE --> AuthMod[Auth Module<br/>JWT / Passport / bcrypt]
    BE --> TicketMod[Tickets Module]
    BE --> CommentMod[Comments Module]
    BE --> AttachMod[Attachments Module<br/>Multer disk storage]
    BE --> DashMod[Dashboard Module]
    BE --> AiMod[AI Module]

    TicketMod --> AiMod
    AiMod -->|Gemini API| Gemini[(Google Gemini)]

    AuthMod --> Prisma[Prisma ORM]
    TicketMod --> Prisma
    CommentMod --> Prisma
    AttachMod --> Prisma
    DashMod --> Prisma

    Prisma --> DB[(PostgreSQL)]
    AttachMod --> Disk[(Local ./uploads directory)]
```

**Frontend (Next.js, App Router):** a login page, a dashboard listing tickets with client-side status/priority/category filters, a "new ticket" form, and a ticket detail page that shows comments, attachments, and AI summary/reply generation. It talks to the backend over plain `fetch` calls to `http://localhost:3000`, storing the JWT in `localStorage`.

**Backend (NestJS):** organized into feature modules — `auth`, `tickets`, `comments`, `attachments`, `dashboard`, `ai` — each with its own controller, service, and DTOs. `TicketsModule` depends on `AiModule` directly so ticket creation can call into AI classification synchronously.

**AI integration:** `AiService` wraps the `@google/genai` SDK. Every AI method (`categorize`, `predictPriority`, `summarize`, `generateReply`) sends a purpose-built prompt to Gemini and parses/validates the response against the app's own enums, rather than trusting the model output directly.

**Database:** PostgreSQL, accessed exclusively through Prisma. `PrismaService` is a global, injectable module that manages the connection lifecycle.

**File storage:** attachments are stored on the backend's local filesystem (`./uploads`) with metadata (filename, path, mimetype, size) tracked in Postgres — there's no cloud/object storage integration.

> Note: `docker-compose.yml` also spins up a Redis container, and `ioredis` is listed as a backend dependency, but no code in `src/` currently uses Redis — it isn't wired into any module yet.

## Request Flow

1. **Authentication** — `POST /auth/signup` hashes the password and creates a user; `POST /auth/login` verifies credentials and returns a signed JWT. The frontend stores this token and attaches it as a `Bearer` header on every subsequent request.
2. **Ticket creation** — Frontend submits title/description to `POST /tickets`. The backend calls Gemini twice (category, priority) before persisting the ticket, then returns the saved record.
3. **AI assistance (existing ticket)** — On the ticket detail page, the frontend sends the ticket's title, description, and concatenated comment thread to `/ai/summary` and `/ai/reply` in parallel and renders both results.
4. **Comment flow** — `POST /tickets/:ticketId/comments` checks the requester owns the ticket, then persists the comment; `GET` returns the thread ordered oldest-first.
5. **Attachment flow** — Upload goes through Multer (type/size validation, disk write) before a DB row is created; download streams the file back by its stored path; delete removes both the file and the DB row.

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 16 (App Router), React 19 | UI: login, dashboard, ticket detail/creation |
| Frontend styling | Tailwind CSS v4 | Utility-first styling |
| Backend framework | NestJS 11 (TypeScript) | Modular REST API |
| Database | PostgreSQL | Primary data store |
| ORM | Prisma 6 | Schema, migrations, typed DB client |
| Authentication | Passport, `@nestjs/jwt`, `passport-jwt`, bcrypt | Signup/login, JWT issuing & validation, password hashing |
| AI | `@google/genai` (Gemini) | Ticket categorization, priority prediction, summarization, reply drafting |
| File uploads | Multer (disk storage) | Attachment upload/download/delete |
| API docs | `@nestjs/swagger` | Auto-generated OpenAPI/Swagger UI at `/api` |
| Validation | `class-validator`, `class-transformer` | DTO-based request validation |
| Testing | Jest, Supertest | Unit test scaffolding per module + an e2e test entry point |

## Project Structure

```text
shrivox-console/
├── src/
│   ├── auth/            # Signup, login, JWT strategy/guard, roles guard & decorator
│   ├── tickets/          # Ticket CRUD, query filtering/pagination, AI-assisted creation
│   ├── comments/         # Per-ticket comment threads
│   ├── attachments/      # File upload/download/delete (Multer + local disk)
│   ├── dashboard/        # Per-user ticket stats + admin-only endpoint
│   ├── ai/                # Gemini integration (categorize, priority, summary, reply)
│   ├── prisma/            # Global PrismaService/PrismaModule
│   ├── app.module.ts
│   └── main.ts            # Bootstraps Nest, enables CORS + validation, sets up Swagger
├── prisma/
│   ├── schema.prisma       # User, Ticket, Comment, Attachment models
│   └── migrations/
├── frontend/
│   ├── app/
│   │   ├── page.tsx              # Login page
│   │   ├── dashboard/page.tsx    # Ticket dashboard with filters
│   │   └── tickets/
│   │       ├── new/page.tsx      # Create ticket form
│   │       └── [id]/page.tsx     # Ticket detail: comments, attachments, AI panel
│   └── package.json
├── test/                    # E2E test config/spec
└── docker-compose.yml        # Local Postgres + Redis containers
```

## Getting Started

### Prerequisites
- Node.js and npm
- PostgreSQL (or use the provided `docker-compose.yml`)
- A Gemini API key

### Backend Setup

```bash
# from the repo root
npm install

# start Postgres (and Redis, currently unused by the app) locally
docker-compose up -d

# apply Prisma migrations and generate the Prisma client
npx prisma migrate deploy
npx prisma generate

# create the local directory attachments are written to (git-ignored, not created automatically)
mkdir -p uploads

npm run start:dev
```

> **Note:** there is currently no signup page in the frontend UI. Create test 
> accounts via `POST /auth/signup` through Swagger (http://localhost:3000/api).


Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/shrivox_console
JWT_SECRET=your_jwt_secret_here
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```

The API will be available at `http://localhost:3000`, with Swagger docs at `http://localhost:3000/api`.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend's `fetch` calls are hardcoded to `http://localhost:3000` for the API. The backend's CORS config currently allows `http://localhost:3001` as the frontend origin, so run the frontend on port 3001 (`npm run dev -- -p 3001`) or adjust `app.enableCors()` in `src/main.ts` to match whichever port you use.

## API Overview

Full interactive documentation (including request/response schemas) is available via Swagger at `/api` once the backend is running. At a high level:

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Default Nest health-check route (returns `"Hello World!"`) |
| POST | `/auth/signup` | Create a user |
| POST | `/auth/login` | Log in, receive a JWT |
| GET | `/auth/me` | Get the current authenticated user |
| POST | `/tickets` | Create a ticket (AI classifies category/priority) |
| GET | `/tickets` | List tickets (pagination, filters, search, sort) |
| GET | `/tickets/:id` | Get a single ticket |
| PATCH | `/tickets/:id` | Update a ticket |
| DELETE | `/tickets/:id` | Delete a ticket |
| POST / GET | `/tickets/:ticketId/comments` | Add / list comments |
| POST / GET | `/tickets/:ticketId/attachments` | Upload / list attachments |
| GET / DELETE | `/tickets/:ticketId/attachments/:id` | Download / delete an attachment |
| GET | `/dashboard` | Per-user ticket statistics |
| GET | `/dashboard/admin` | Admin-only endpoint |
| POST | `/ai/categorize`, `/ai/priority`, `/ai/summary`, `/ai/reply` | Standalone AI endpoints |

## Testing

```bash
npm run test        # unit tests
npm run test:e2e    # e2e tests
```

Each backend module has an accompanying Jest spec file; these currently verify that the module's providers and controllers wire up correctly.

## Engineering Notes

- **Ownership-based authorization**: tickets, comments, and attachments all check `createdById`/`uploadedById` against the requesting user rather than relying on a shared-access or team model — this is a single-tenant-per-user design, not a multi-agent support desk.
- **`/ai/*` endpoints are currently unauthenticated**: unlike every other controller in the app, `AiController` has no `JwtAuthGuard`, so `categorize`, `priority`, `summary`, and `reply` can be called by anyone with network access to the API. This is worth fixing before any public deployment.
- **AI failure isolation**: every Gemini call is wrapped in a try/catch with an explicit fallback value, so an AI outage degrades ticket creation (falls back to `GENERAL`/`MEDIUM`) instead of failing it.
- **Local file storage**: attachments live on the server's local disk, which is fine for local development but wouldn't survive a redeploy on most hosting platforms without a persistent volume or a move to object storage. The `uploads/` directory is git-ignored and must be created manually — Multer will not create it on first upload.
