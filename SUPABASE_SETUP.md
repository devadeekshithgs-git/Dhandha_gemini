
# Supabase Setup Instructions

## 1. Credentials
Ensure your `.env` file has:
```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## 2. Database Schema
Run the following SQL in your Supabase SQL Editor to create the necessary tables and policies.

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Products Table
create table products (
  id text primary key,
  name text not null,
  cost_price numeric default 0,
  selling_price numeric default 0,
  price numeric default 0, -- Legacy support
  gst numeric,
  stock integer default 0,
  category text,
  barcode text,
  image text
);

alter table products enable row level security;
create policy "Allow public access to products" on products for all using (true) with check (true);

-- 2. Customers Table
create table customers (
  id text primary key,
  name text not null,
  phone text,
  balance numeric default 0,
  last_transaction_date text
);

alter table customers enable row level security;
create policy "Allow public access to customers" on customers for all using (true) with check (true);

-- 3. Customer Dues
create table customer_dues (
  id text primary key,
  customer_id text references customers(id) on delete cascade,
  amount numeric,
  description text,
  date text,
  paid boolean default false,
  items jsonb
);

alter table customer_dues enable row level security;
create policy "Allow public access to customer_dues" on customer_dues for all using (true) with check (true);

-- 4. Vendors Table
create table vendors (
  id text primary key,
  name text not null,
  category text,
  balance numeric default 0,
  next_payment_date text
);

alter table vendors enable row level security;
create policy "Allow public access to vendors" on vendors for all using (true) with check (true);

-- 5. Vendor Bills
create table vendor_bills (
  id text primary key,
  vendor_id text references vendors(id) on delete cascade,
  date text,
  amount numeric,
  items_description text,
  bill_image_url text
);

alter table vendor_bills enable row level security;
create policy "Allow public access to vendor_bills" on vendor_bills for all using (true) with check (true);

-- 6. Transactions
create table transactions (
  id text primary key,
  customer_id text,
  customer_name text,
  amount numeric,
  date text,
  payment_method text,
  items_count integer,
  bill_id text,
  items jsonb -- Added for profit calculation
);

alter table transactions enable row level security;
create policy "Allow public access to transactions" on transactions for all using (true) with check (true);

-- 7. Sales Data (Optional, we now calculate from transactions)
create table sales_data (
  day text primary key,
  amount numeric default 0
);

alter table sales_data enable row level security;
create policy "Allow public access to sales_data" on sales_data for all using (true) with check (true);

-- 8. Expenses Table
create table expenses (
  id text primary key,
  amount numeric,
  category text,
  description text,
  date text
);

alter table expenses enable row level security;
create policy "Allow public access to expenses" on expenses for all using (true) with check (true);

-- 10. Update Expenses Table with Vendor Link
alter table expenses add column vendor_id text;
alter table expenses add column vendor_name text;

-- 11. Profiles Table (For Authentication)
create table profiles (
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
```
