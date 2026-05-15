-- Run this entire file in your Supabase SQL editor

-- Tasks table
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  title text not null,
  notes text,
  completed boolean default false,
  completed_at timestamptz,
  section text not null default 'today' check (section in ('today', 'this_week', 'someday')),
  area text,           -- #tag e.g. 'work', 'health', 'personal'
  due_date date,
  priority text default 'normal' check (priority in ('high', 'normal', 'low')),
  recurring text,      -- v2: 'daily', 'weekly', 'monthly'
  position integer default 0
);

-- Index for heatmap queries (completed tasks by date)
create index if not exists tasks_completed_at_idx on tasks (completed_at);
create index if not exists tasks_section_idx on tasks (section);
create index if not exists tasks_area_idx on tasks (area);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_updated_at
  before update on tasks
  for each row execute function update_updated_at();

-- Enable Row Level Security (open policy for personal use — lock down if shared)
alter table tasks enable row level security;

create policy "Allow all for now" on tasks
  for all using (true) with check (true);
