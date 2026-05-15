# do. — CLI-aesthetic task manager

A keyboard-first, Notion-inspired task manager with a GitHub-style heatmap.
Built with Next.js + Supabase. Deployable to Vercel in minutes.

---

## Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS v3
- **Deployment**: Vercel

---

## Setup

### 1. Clone and install

```bash
git clone <your-repo>
cd do-cli
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free project.
2. In the SQL editor, run the schema in `supabase/schema.sql`.
3. Copy your project URL and anon key.

### 3. Environment variables

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run locally

```bash
npm run dev
```

### 5. Deploy to Vercel

1. Push to GitHub.
2. Import the repo in [vercel.com](https://vercel.com).
3. Add the two environment variables in Vercel project settings.
4. Deploy.

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `n` | New task |
| `j / k` | Navigate tasks |
| `x` | Complete selected |
| `d` | Delete selected |
| `e` | Edit selected |
| `f` | Focus filter |
| `Escape` | Close modal / clear |
| `1 / 2 / 3` | Switch section (Today / This Week / Someday) |

---

## Task Syntax (Quick Add)

```
Buy groceries #personal ~fri !high
```

- `#tag` — assign area (work, health, personal, etc.)
- `~today` / `~mon` / `~2025-06-01` — due date
- `!high` / `!low` — priority

---

## v1 Features (shipped)

- [x] Add / complete / delete tasks
- [x] Sections: Today, This Week, Someday
- [x] Tag-based areas with filtering
- [x] Due dates + priority
- [x] GitHub-style heatmap (completions only)
- [x] Streak counter
- [x] Keyboard-first navigation
- [x] Supabase persistence (multi-device)
- [x] JSON export

## v2 Planned

- [ ] Kanban board view
- [ ] Table / database view
- [ ] Recurring tasks
- [ ] Sub-tasks
