-- Run this in Supabase SQL Editor to fix the missing tables

-- 1. Create Profiles Table (Fixes the current error)
create table if not exists profiles (
  id uuid references auth.users not null primary key,
  owner_name text,
  business_name text,
  upi_id text,
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table profiles enable row level security;
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

-- 2. Create Expenses Table (You will likely need this soon)
create table if not exists expenses (
  id text primary key,
  amount numeric,
  category text,
  description text,
  date text,
  vendor_id text,
  vendor_name text
);

alter table expenses enable row level security;
create policy "Allow public access to expenses" on expenses for all using (true) with check (true);

-- 3. Update Transactions Table (To support profit tracking)
alter table transactions add column if not exists items jsonb;
