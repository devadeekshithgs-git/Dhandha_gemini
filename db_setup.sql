-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Products Table
create table products (
  id text primary key,
  name text not null,
  cost_price numeric default 0,
  selling_price numeric default 0,
  price numeric default 0, -- Legacy field support
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

-- 3. Customer Dues (Nested items for customers)
create table customer_dues (
  id text primary key,
  customer_id text references customers(id) on delete cascade,
  amount numeric,
  description text,
  date text,
  paid boolean default false,
  items jsonb -- Storing items list as JSON for simplicity
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
  customer_id text, -- Can be null for guest
  customer_name text,
  amount numeric,
  date text,
  payment_method text,
  items_count integer,
  bill_id text
);

alter table transactions enable row level security;
create policy "Allow public access to transactions" on transactions for all using (true) with check (true);

-- 7. Sales Data (Simple tracking)
create table sales_data (
  day text primary key, -- e.g. "Mon"
  amount numeric default 0
);

alter table sales_data enable row level security;
create policy "Allow public access to sales_data" on sales_data for all using (true) with check (true);
