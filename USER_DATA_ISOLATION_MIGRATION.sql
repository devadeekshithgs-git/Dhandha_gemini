-- ============================================================
-- USER DATA ISOLATION MIGRATION
-- ============================================================
-- This migration adds user_id column to all data tables and 
-- sets up Row Level Security (RLS) policies to ensure each 
-- user can only see and modify their own data.
-- ============================================================

-- STEP 1: Add user_id column to all tables
-- ============================================================

-- 1.1 Products Table
ALTER TABLE products ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 1.2 Customers Table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 1.3 Customer Dues Table
ALTER TABLE customer_dues ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 1.4 Vendors Table
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 1.5 Vendor Bills Table
ALTER TABLE vendor_bills ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 1.6 Transactions Table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 1.7 Sales Data Table
ALTER TABLE sales_data ADD COLUMN IF NOT EXISTS user_id uuid;
-- Drop the primary key and recreate with composite key
ALTER TABLE sales_data DROP CONSTRAINT IF EXISTS sales_data_pkey;
ALTER TABLE sales_data ADD PRIMARY KEY (day, user_id);

-- 1.8 Expenses Table
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- STEP 2: Drop existing public access policies
-- ============================================================

-- 2.1 Products
DROP POLICY IF EXISTS "Allow public access to products" ON products;

-- 2.2 Customers
DROP POLICY IF EXISTS "Allow public access to customers" ON customers;

-- 2.3 Customer Dues
DROP POLICY IF EXISTS "Allow public access to customer_dues" ON customer_dues;

-- 2.4 Vendors
DROP POLICY IF EXISTS "Allow public access to vendors" ON vendors;

-- 2.5 Vendor Bills
DROP POLICY IF EXISTS "Allow public access to vendor_bills" ON vendor_bills;

-- 2.6 Transactions
DROP POLICY IF EXISTS "Allow public access to transactions" ON transactions;

-- 2.7 Sales Data
DROP POLICY IF EXISTS "Allow public access to sales_data" ON sales_data;

-- 2.8 Expenses
DROP POLICY IF EXISTS "Allow public access to expenses" ON expenses;

-- STEP 3: Create new user-specific RLS policies
-- ============================================================

-- 3.1 Products - Users can only access their own products
CREATE POLICY "Users can view own products" ON products 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products" ON products 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products" ON products 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products" ON products 
  FOR DELETE USING (auth.uid() = user_id);

-- 3.2 Customers - Users can only access their own customers
CREATE POLICY "Users can view own customers" ON customers 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own customers" ON customers 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own customers" ON customers 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own customers" ON customers 
  FOR DELETE USING (auth.uid() = user_id);

-- 3.3 Customer Dues - Users can only access their own customer dues
CREATE POLICY "Users can view own customer_dues" ON customer_dues 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own customer_dues" ON customer_dues 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own customer_dues" ON customer_dues 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own customer_dues" ON customer_dues 
  FOR DELETE USING (auth.uid() = user_id);

-- 3.4 Vendors - Users can only access their own vendors
CREATE POLICY "Users can view own vendors" ON vendors 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vendors" ON vendors 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vendors" ON vendors 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vendors" ON vendors 
  FOR DELETE USING (auth.uid() = user_id);

-- 3.5 Vendor Bills - Users can only access their own vendor bills
CREATE POLICY "Users can view own vendor_bills" ON vendor_bills 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vendor_bills" ON vendor_bills 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vendor_bills" ON vendor_bills 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vendor_bills" ON vendor_bills 
  FOR DELETE USING (auth.uid() = user_id);

-- 3.6 Transactions - Users can only access their own transactions
CREATE POLICY "Users can view own transactions" ON transactions 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON transactions 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON transactions 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON transactions 
  FOR DELETE USING (auth.uid() = user_id);

-- 3.7 Sales Data - Users can only access their own sales data
CREATE POLICY "Users can view own sales_data" ON sales_data 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sales_data" ON sales_data 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sales_data" ON sales_data 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sales_data" ON sales_data 
  FOR DELETE USING (auth.uid() = user_id);

-- 3.8 Expenses - Users can only access their own expenses
CREATE POLICY "Users can view own expenses" ON expenses 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses" ON expenses 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses" ON expenses 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses" ON expenses 
  FOR DELETE USING (auth.uid() = user_id);

-- STEP 4: Create indexes for better performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_dues_user_id ON customer_dues(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_bills_user_id ON vendor_bills(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);

-- ============================================================
-- MIGRATION COMPLETE!
-- ============================================================
-- After running this migration, update your application code to:
-- 1. Include user_id when inserting new records
-- 2. The RLS policies will automatically filter data by user
-- ============================================================
