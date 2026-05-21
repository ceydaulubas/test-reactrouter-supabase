-- Brands Table
create table public.brands (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references public.teams(id) on delete cascade,
  name text not null,
  slug text not null,
  logo_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(team_id, slug)
);

alter table public.templates
add column brand_id uuid references public.brands(id) on delete set null;

-- Brands indexes
create index brands_team_id_idx on public.brands(team_id);
create index brands_slug_idx on public.brands(slug);

-- Templates brand index
create index templates_brand_id_idx on public.templates(brand_id);

-- Enable Row Level Security
alter table public.brands enable row level security;

-- Brands Policies
create policy "Users can view brands of their teams"
  on public.brands for select
  using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = brands.team_id
      and team_members.user_id = auth.uid()
    )
  );

create policy "Team members can insert brands"
  on public.brands for insert
  with check (
    exists (
      select 1 from public.team_members
      where team_members.team_id = brands.team_id
      and team_members.user_id = auth.uid()
    )
  );

create policy "Team members can update brands"
  on public.brands for update
  using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = brands.team_id
      and team_members.user_id = auth.uid()
    )
  );

create policy "Team members can delete brands"
  on public.brands for delete
  using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = brands.team_id
      and team_members.user_id = auth.uid()
    )
  );

-- Create trigger for updated_at
create trigger set_updated_at
  before update on public.brands
  for each row
  execute function public.handle_updated_at();
