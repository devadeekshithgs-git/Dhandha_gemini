# User Data Isolation Setup Guide

## Overview
This document explains how to implement per-user data isolation in the Dhandha app, ensuring each shop owner's data is private and only accessible when they log in with their Gmail account.

## The Problem
Previously, all data (products, customers, vendors, transactions, etc.) was shared across all users because the Row Level Security (RLS) policies allowed public access with `using (true) with check (true)`.

## The Solution
We've implemented **user-level data isolation** using:
1. **`user_id` column** on all data tables
2. **Supabase Row Level Security (RLS)** policies that restrict access to data owned by the authenticated user

---

## Step 1: Run the Database Migration

Open your **Supabase SQL Editor** and run the contents of `USER_DATA_ISOLATION_MIGRATION.sql`:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the entire contents of `USER_DATA_ISOLATION_MIGRATION.sql`
4. Click **Run**

This will:
- Add `user_id` column to all data tables
- Remove the old public access policies
- Create new policies that restrict access based on `auth.uid()`
- Create indexes for better query performance

---

## Step 2: Application Code Changes (Already Done)

The `App.tsx` has been updated to:
- Include `user_id` when inserting new records (products, customers, vendors, transactions, expenses, customer dues)
- The fetch operations don't need explicit user_id filters because RLS automatically handles this on the database side

### Key Changes Made:

```typescript
// Helper to get current user ID
const getUserId = () => session?.user?.id;

// Example: Adding a product with user_id
const handleAddProduct = async (newProduct: Product) => {
  const userId = getUserId();
  if (!userId) {
    alert('You must be logged in to add products');
    return;
  }

  const dbProduct = {
    id: newProduct.id,
    name: newProduct.name,
    // ... other fields
    user_id: userId  // Associate product with current user
  };

  await supabase.from('products').insert(dbProduct);
};
```

---

## How It Works

### 1. Authentication
When a user logs in with Google (Gmail), Supabase creates a session with their unique `user.id` (UUID).

### 2. Data Insertion
Every time data is inserted (product, customer, vendor, etc.), the current user's ID is attached:
```sql
INSERT INTO products (id, name, user_id) VALUES ('123', 'Rice', 'user-uuid-here');
```

### 3. Data Retrieval
When fetching data, Supabase RLS automatically filters:
```sql
-- User A logs in and runs:
SELECT * FROM products;
-- RLS automatically adds: WHERE user_id = 'user-a-uuid'

-- User B logs in and runs the same query:
SELECT * FROM products;
-- RLS automatically adds: WHERE user_id = 'user-b-uuid'
```

### 4. Result
- **User A** only sees their products, customers, transactions
- **User B** only sees their own data
- Data is completely isolated without any code changes to queries!

---

## Data Affected

| Table | Isolated? |
|-------|-----------|
| `products` | ✅ Yes |
| `customers` | ✅ Yes |
| `customer_dues` | ✅ Yes |
| `vendors` | ✅ Yes |
| `vendor_bills` | ✅ Yes |
| `transactions` | ✅ Yes |
| `expenses` | ✅ Yes |
| `sales_data` | ✅ Yes |
| `profiles` | ✅ Already had user policies |

---

## Important Notes

### Existing Data
If you have existing data in the database before running this migration:
- The existing records will have `user_id = NULL`
- These records will be **invisible** to all users after the migration
- You may need to manually assign `user_id` to existing records if needed

To fix existing data (run in SQL Editor):
```sql
-- Example: Assign all existing products to a specific user
UPDATE products SET user_id = 'your-user-uuid-here' WHERE user_id IS NULL;
```

### Testing
To test the isolation:
1. Login with Gmail Account A
2. Add some products/customers
3. Logout
4. Login with Gmail Account B
5. Verify you DON'T see the data from Account A
6. Add new data with Account B
7. Logout and login with Account A
8. Verify you only see Account A's data

---

## Troubleshooting

### "Failed to add product" Error
Make sure:
1. The migration has been run successfully
2. The user is properly authenticated
3. Check browser console for specific error messages

### Data Not Showing After Migration
If existing data disappeared:
1. The `user_id` column was added but is NULL for old data
2. RLS policies now filter out NULL user_id records
3. Manually update old records with correct user_id (see above)

### RLS Policy Errors
If you get permission errors:
```sql
-- Check if policies exist
SELECT * FROM pg_policies WHERE tablename = 'products';

-- Re-run the migration if needed
-- Or manually create a policy:
CREATE POLICY "Users can view own products" ON products 
  FOR SELECT USING (auth.uid() = user_id);
```
