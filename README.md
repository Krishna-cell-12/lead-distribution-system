# LeadDesk Mini — Lead Capture & CRM

> **Full Stack Developer Internship Task — Role 04 / 16 | Digital Heroes**  
> A production-grade lead-capture product with a public form, PostgreSQL persistence, and an admin pipeline dashboard.

---

## Live Demo

🔗 **Landing Page:** https://lead-distribution-system-one.vercel.app/  
🔗 **Admin Dashboard:** https://lead-distribution-system-one.vercel.app/admin

---

## What is LeadDesk Mini?

LeadDesk Mini is a small but complete lead-capture SaaS product built in 24 hours for the Digital Heroes internship brief.

When a visitor fills out the public form:
1. Client-side validation runs immediately (per-field, on blur)
2. On submit, the payload is validated **again on the server** (mirrored rules)
3. The lead is stored in **Neon PostgreSQL** via Prisma ORM
4. The team can open `/admin` to see every lead, search by name/email, and cycle their status: **New → Contacted → Closed**

---

## Tech Stack

| Layer       | Technology                              |
|-------------|-----------------------------------------|
| Framework   | Next.js 16 (App Router, TypeScript)     |
| Database    | Neon PostgreSQL (serverless)            |
| ORM         | Prisma 7 with `@prisma/adapter-pg`      |
| Styling     | Vanilla CSS (custom design system)      |
| Fonts       | Inter via Google Fonts                  |
| Deployment  | Vercel                                  |

---

## Features

### Public Landing Page (`/`)
- **Hero section** with animated gradient headline and ambient orb background
- **Lead capture form** — Name, Email, Budget Range (dropdown), Project Brief (textarea)
- **Client-side validation**: required fields, email regex, min message length; errors shown per-field on blur with animation
- **Server-side validation**: mirrored rules in `POST /api/contact-leads`; `422` response with field-level error map on failure
- **Success state**: animated confirmation card on successful submission
- Footer credit: *"Built for Digital Heroes Training Task"* → [digitalheroesco.com](https://digitalheroesco.com)

### Admin Dashboard (`/admin`)
- **Stats bar**: clickable cards for Total / New / Contacted / Closed — clicking filters the table
- **Real-time search**: filters by name, email, or message content as you type
- **Lead table**: Avatar initials, email, budget badge, status badge, relative timestamp ("2h ago")
- **Expandable rows**: click any lead to reveal full project brief inline
- **Status toggle**: single-click cycles `New → Contacted → Closed → New` via `PATCH /api/contact-leads/:id`
- All updates are instant (optimistic UI update + API call)

### API Routes
| Method | Route                          | Purpose                          |
|--------|--------------------------------|----------------------------------|
| POST   | `/api/contact-leads`           | Create a new lead (validated)    |
| GET    | `/api/contact-leads`           | List all leads (admin)           |
| PATCH  | `/api/contact-leads/[id]`      | Update lead status               |

---

## Data Model

```prisma
enum ContactLeadStatus {
  NEW
  CONTACTED
  CLOSED
}

model ContactLead {
  id        String            @id @default(uuid())
  name      String
  email     String
  budget    String            // enum key: under_500 | 500_2000 | 2000_10000 | 10000_plus
  message   String
  status    ContactLeadStatus @default(NEW)
  createdAt DateTime          @default(now())
  updatedAt DateTime          @updatedAt
}
```

**Key design decisions:**
- UUID primary key — collision-safe, no sequential enumeration vulnerability
- `status` as a Postgres enum — invalid values rejected at the DB level, not just app level
- `updatedAt` via `@updatedAt` — automatically tracks every status change for free
- No auth on `/admin` in this scope — noted as a production concern (see below)

---

## Validation Strategy

Both client and server apply the **same rules**:

| Field   | Rule                                          |
|---------|-----------------------------------------------|
| name    | Required, minimum 2 characters                |
| email   | Required, must match RFC-5322 email regex      |
| budget  | Required, must be one of 4 defined enum keys  |
| message | Required, minimum 10 characters               |

The server returns `422 Unprocessable Entity` with a `fields` map on failure, allowing the UI to display per-field error messages even for edge-cases that bypass the browser.

---

## Setup & Local Development

### 1. Clone & Install

```bash
git clone <repo-url>
cd task
npm install
```

### 2. Configure Environment

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
```

### 3. Sync Schema

```bash
npx prisma db push
```

> Uses `db push` (no migration history required for this scope). Run `prisma migrate dev` if you need a full migration history.

### 4. Run Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing page,  
[http://localhost:3000/admin](http://localhost:3000/admin) for the admin panel.

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                         # Public landing page (/)
│   ├── layout.tsx                       # Root layout with Inter font & SEO meta
│   ├── globals.css                      # Full design system (dark glassmorphism)
│   ├── admin/
│   │   └── page.tsx                     # Admin dashboard (/admin)
│   └── api/
│       └── contact-leads/
│           ├── route.ts                 # POST (create) + GET (list) leads
│           └── [id]/
│               └── route.ts            # PATCH — update lead status
├── lib/
│   └── prisma.ts                        # Singleton Prisma + pg pool client
prisma/
├── schema.prisma                        # DB schema (ContactLead + existing models)
└── seed.ts                              # Seed script for original Prowider data
```

---

## Production Notes

- **Admin auth**: In production, `/admin` should be protected behind NextAuth.js or Clerk. Intentionally left open for this demo scope.
- **Rate limiting**: The `POST /api/contact-leads` route should be rate-limited per IP in production (e.g., via Upstash Rate Limit).
- **Email notifications**: A real deployment would trigger a Resend/SendGrid email to the team on each new lead submission.

---

## AI Usage

I used **Claude (Anthropic)** and **Gemini (Google)** throughout this task:
- To scaffold the initial Next.js project and Prisma schema
- To generate boilerplate for the API route validation logic, which I then adapted to match the specific field rules
- To accelerate writing the CSS design system, particularly the animation keyframes and glassmorphism token values

All architectural decisions — the data model, the validation strategy, the admin UX flow, the status-cycling pattern — were my own. The AI was used as a fast coding assistant, not a decision-maker.

---

## Author

**Krishna** — Full Stack Developer Internship Candidate  
Built for **Digital Heroes** — [digitalheroesco.com](https://digitalheroesco.com)
