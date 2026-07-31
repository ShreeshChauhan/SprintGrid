# SprintGrid

A dark-themed kanban task manager built with React, TypeScript, Vite, and Supabase.

---

## Features

- 4-column kanban board — To Do, In Progress, In Review, Done
- Create tasks with title, description, priority, due date, and labels
- Drag and drop tasks between columns
- Due date urgency indicators (overdue, due today, due soon)
- Custom labels with color picker and board-wide filtering
- Guest accounts via Supabase anonymous auth — no sign-up required
- Tasks scoped per user with Row Level Security (RLS)
- Real-time sync across sessions via Supabase Realtime
- Loading and error states throughout

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| Backend / DB | Supabase (Postgres) |
| Auth | Supabase Anonymous Sign-In |
| Realtime | Supabase Realtime (postgres_changes) |
| Styling | Inline CSS-in-JS (no external CSS library) |
| Fonts | Playfair Display + JetBrains Mono (Google Fonts) |
| Deployment | Vercel |

---

## Project Structure

```
SprintGrid/
├── src/
│   ├── App.tsx          # Main kanban board component
│   └── supabase.ts      # Supabase client setup
├── .env                 # Environment variables (not committed)
├── .env.example         # Template for environment variables
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/sprintgrid.git
cd sprintgrid
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

#### Create the database tables

Go to your Supabase project → **SQL Editor** → **New query** and run:

```sql
-- Team members table (must be created first)
create table team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text,
  user_id uuid not null references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now()
);

-- Tasks table
create table tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null check (status in ('todo', 'in_progress', 'in_review', 'done')),
  description text,
  priority text check (priority in ('low', 'medium', 'high')) default 'medium',
  due_date date,
  assignee_id uuid references team_members(id),
  user_id uuid not null references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table tasks enable row level security;
alter table team_members enable row level security;

-- RLS policies for tasks
create policy "Users can view own tasks" on tasks for select using (auth.uid() = user_id);
create policy "Users can insert own tasks" on tasks for insert with check (auth.uid() = user_id);
create policy "Users can update own tasks" on tasks for update using (auth.uid() = user_id);
create policy "Users can delete own tasks" on tasks for delete using (auth.uid() = user_id);

-- RLS policies for team members
create policy "Users can view own team members" on team_members for select using (auth.uid() = user_id);
create policy "Users can insert own team members" on team_members for insert with check (auth.uid() = user_id);
```

#### Enable Anonymous Sign-In

In your Supabase dashboard go to **Authentication → Providers → Anonymous** and toggle it on.

#### Enable Realtime

Go to **Database → Replication** and enable Realtime for the `tasks` table.

### 4. Configure environment variables

Copy the example env file:

```bash
cp .env.example .env
```

Fill in your values from **Supabase → Project Settings → API Keys** and **Data API**:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_your_key_here
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Deploying to Vercel

1. Push your code to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add your environment variables in **Vercel → Project → Settings → Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy — Vercel auto-detects Vite

---

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase publishable (anon) key |

> Never commit your `.env` file. It is already listed in `.gitignore` by default in Vite projects.

---

## How Guest Accounts Work

On first load, the app calls `supabase.auth.signInAnonymously()`. This creates a real user record in Supabase Auth with no email or password. The session is persisted in `localStorage` so the same guest identity is reused across page refreshes. Every task created is tagged with that guest's `user_id`, and RLS policies ensure users can only ever read or write their own tasks.

---

## Status Mapping

The UI column names map to database status values as follows:

| UI Column | Database status |
|---|---|
| To Do | `todo` |
| In Progress | `in_progress` |
| In Review | `in_review` |
| Done | `done` |

---

## License

MIT
