-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Products Table
create table if not exists products (
  id text primary key,
  name text not null,
  cost_price numeric default 0,
  selling_price numeric default 0,
  price numeric default 0,
  gst numeric,
  stock integer default 0,
  category text,
  barcode text,
  image text
);

alter table products enable row level security;
drop policy if exists "Allow public access to products" on products;
create policy "Allow public access to products" on products for all using (true) with check (true);

-- 2. Customers Table
create table if not exists customers (
  id text primary key,
  name text not null,
  phone text,
  balance numeric default 0,
  last_transaction_date text
);

alter table customers enable row level security;
drop policy if exists "Allow public access to customers" on customers;
create policy "Allow public access to customers" on customers for all using (true) with check (true);

-- 3. Customer Dues
create table if not exists customer_dues (
  id text primary key,
  customer_id text references customers(id) on delete cascade,
  amount numeric,
  description text,
  date text,
  paid boolean default false,
  items jsonb
);

alter table customer_dues enable row level security;
drop policy if exists "Allow public access to customer_dues" on customer_dues;
create policy "Allow public access to customer_dues" on customer_dues for all using (true) with check (true);

-- 4. Vendors Table
create table if not exists vendors (
  id text primary key,
  name text not null,
  category text,
  balance numeric default 0,
  next_payment_date text
);

alter table vendors enable row level security;
drop policy if exists "Allow public access to vendors" on vendors;
create policy "Allow public access to vendors" on vendors for all using (true) with check (true);

-- 5. Vendor Bills
create table if not exists vendor_bills (
  id text primary key,
  vendor_id text references vendors(id) on delete cascade,
  date text,
  amount numeric,
  items_description text,
  bill_image_url text
);

alter table vendor_bills enable row level security;
drop policy if exists "Allow public access to vendor_bills" on vendor_bills;
create policy "Allow public access to vendor_bills" on vendor_bills for all using (true) with check (true);

-- 6. Transactions
create table if not exists transactions (
  id text primary key,
  customer_id text,
  customer_name text,
  amount numeric,
  date text,
  payment_method text,
  items_count integer,
  bill_id text,
  items jsonb
);

alter table transactions enable row level security;
drop policy if exists "Allow public access to transactions" on transactions;
create policy "Allow public access to transactions" on transactions for all using (true) with check (true);

-- 7. Sales Data
create table if not exists sales_data (
  day text primary key,
  amount numeric default 0
);

alter table sales_data enable row level security;
drop policy if exists "Allow public access to sales_data" on sales_data;
create policy "Allow public access to sales_data" on sales_data for all using (true) with check (true);

-- 8. Expenses Table
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
drop policy if exists "Allow public access to expenses" on expenses;
create policy "Allow public access to expenses" on expenses for all using (true) with check (true);

-- 9. Profiles Table
create table if not exists profiles (
  id uuid references auth.users not null primary key,
  owner_name text,
  business_name text,
  upi_id text,
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table profiles enable row level security;
drop policy if exists "Public profiles are viewable by everyone." on profiles;
create policy "Public profiles are viewable by everyone." on profiles for select using (true);

drop policy if exists "Users can insert their own profile." on profiles;
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile." on profiles;
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);
