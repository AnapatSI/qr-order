-- Bangsaen Smart Order Database Setup Script
-- Run this in your Supabase SQL Editor

-- Step 1: Check if owner_id column exists in stores table
-- If not, add it:
ALTER TABLE stores ADD COLUMN owner_id UUID REFERENCES auth.users(id);

-- Step 2: Get your user UUID from auth.users table
SELECT id, email FROM auth.users;

-- Step 3: Link your user to store BS001 (replace with your actual user UUID)
UPDATE stores 
SET owner_id = 'your-user-uuid-here' 
WHERE id = 'BS001';

-- Step 4: Verify the link
SELECT s.id, s.name, s.owner_id, u.email 
FROM stores s 
LEFT JOIN auth.users u ON s.owner_id = u.id 
WHERE s.id = 'BS001';

-- Step 5: Create menu-images storage bucket if not exists
-- Go to Supabase Dashboard -> Storage -> Create Bucket
-- Name: menu-images
-- Set to Public

-- Step 6: Set up Row Level Security (RLS) for stores table
-- Only allow users to access their own store data
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own store" ON stores
FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can update their own store" ON stores
FOR UPDATE USING (auth.uid() = owner_id);

-- Step 7: Set up RLS for menus table
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view menus for their store" ON menus
FOR SELECT USING (
  store_id IN (
    SELECT id FROM stores WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can manage menus for their store" ON menus
FOR ALL USING (
  store_id IN (
    SELECT id FROM stores WHERE owner_id = auth.uid()
  )
);

-- Step 8: Set up RLS for orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view orders for their store" ON orders
FOR SELECT USING (
  store_id IN (
    SELECT id FROM stores WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can manage orders for their store" ON orders
FOR ALL USING (
  store_id IN (
    SELECT id FROM stores WHERE owner_id = auth.uid()
  )
);

-- Step 9: Verify setup
SELECT 
  'stores' as table_name,
  COUNT(*) as total_records,
  COUNT(owner_id) as linked_stores
FROM stores
UNION ALL
SELECT 
  'menus' as table_name,
  COUNT(*) as total_records,
  COUNT(m.id) as records_for_store
FROM menus m
JOIN stores s ON m.store_id = s.id
WHERE s.owner_id IS NOT NULL
UNION ALL
SELECT 
  'orders' as table_name,
  COUNT(*) as total_records,
  COUNT(o.id) as records_for_store
FROM orders o
JOIN stores s ON o.store_id = s.id
WHERE s.owner_id IS NOT NULL;
