-- Seed store data for testing
-- Run this in Supabase SQL Editor

-- Insert a test store (if not exists)
INSERT INTO stores (id, name, credit_balance, total_orders, total_revenue, average_rating)
VALUES ('bangsaen-001', 'Bangsaen Seafood Restaurant', 100, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- Insert some sample tables
INSERT INTO tables (store_id, table_number)
VALUES 
  ('bangsaen-001', '1'),
  ('bangsaen-001', '2'),
  ('bangsaen-001', '3'),
  ('bangsaen-001', '4'),
  ('bangsaen-001', '5')
ON CONFLICT DO NOTHING;

-- Insert sample menu items
INSERT INTO menus (store_id, name, price, category, description, is_available)
VALUES 
  ('bangsaen-001', 'ผัดไทย', 120, 'Main Dishes', 'Stir-fried rice noodles with shrimp', true),
  ('bangsaen-001', 'ส้มตำ', 80, 'Salads', 'Spicy papaya salad', true),
  ('bangsaen-001', 'ต้มยำกุ้ง', 150, 'Soups', 'Hot and sour soup with shrimp', true),
  ('bangsaen-001', 'ข้าวผัด', 100, 'Main Dishes', 'Thai fried rice', true),
  ('bangsaen-001', 'น้ำมะพร้าว', 40, 'Drinks', 'Fresh coconut water', true)
ON CONFLICT DO NOTHING;
