-- Full seed data for testing the complete ordering system
-- Run this in Supabase SQL Editor

-- 1. Create store (if not exists)
INSERT INTO stores (id, name, credit_balance, total_orders, total_revenue, average_rating)
VALUES ('BS001', 'Bangsaen Seafood Restaurant', 100, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- 2. Create tables
INSERT INTO tables (store_id, table_number)
VALUES 
  ('BS001', '1'),
  ('BS001', '2'),
  ('BS001', '3'),
  ('BS001', '4'),
  ('BS001', '5')
ON CONFLICT DO NOTHING;

-- 3. Create menu items
INSERT INTO menus (store_id, name, price, category, description, is_available)
VALUES 
  ('BS001', 'ผัดไทย', 120, 'Main Dishes', 'Stir-fried rice noodles with shrimp and peanuts', true),
  ('BS001', 'ส้มตำ', 80, 'Salads', 'Spicy papaya salad with tomatoes and peanuts', true),
  ('BS001', 'ต้มยำกุ้ง', 150, 'Soups', 'Hot and sour soup with fresh shrimp', true),
  ('BS001', 'ข้าวผัด', 100, 'Main Dishes', 'Thai fried rice with chicken and vegetables', true),
  ('BS001', 'น้ำมะพร้าว', 40, 'Drinks', 'Fresh coconut water', true),
  ('BS001', 'ไก่ทอด', 90, 'Main Dishes', 'Crispy fried chicken with sweet chili sauce', true),
  ('BS001', 'แกงส้ม', 110, 'Soups', 'Tamarind soup with fish and vegetables', true),
  ('BS001', 'ลาบเป็ด', 130, 'Salads', 'Spicy duck salad with herbs and lime', true)
ON CONFLICT DO NOTHING;

-- 4. Create menu options (add-ons)
-- ผัดไทย options
INSERT INTO menu_options (menu_id, name, choices, is_required, max_selection, sort_order)
SELECT m.id, 'เนื้อสัตว์', '[{"name": "หมู", "price": 0}, {"name": "ไก่", "price": 0}, {"name": "กุ้ง", "price": 30}, {"name": "หมึก", "price": 25}]', true, 1, 0
FROM menus m WHERE m.name = 'ผัดไทย' AND m.store_id = 'BS001'
ON CONFLICT DO NOTHING;

-- ต้มยำกุ้ง options
INSERT INTO menu_options (menu_id, name, choices, is_required, max_selection, sort_order)
SELECT m.id, 'ความเผ็ด', '[{"name": "เผ็ดน้อย", "price": 0}, {"name": "เผ็ดปานกลาง", "price": 0}, {"name": "เผ็ดมาก", "price": 0}]', false, 1, 0
FROM menus m WHERE m.name = 'ต้มยำกุ้ง' AND m.store_id = 'BS001'
ON CONFLICT DO NOTHING;

-- ข้าวผัด options
INSERT INTO menu_options (menu_id, name, choices, is_required, max_selection, sort_order)
SELECT m.id, 'ท็อปปิ้ง', '[{"name": "ไข่ดาว", "price": 10}, {"name": "ไก่กรอบ", "price": 20}, {"name": "กุ้ง", "price": 30}, {"name": "หมูแฮม", "price": 15}]', false, 2, 0
FROM menus m WHERE m.name = 'ข้าวผัด' AND m.store_id = 'BS001'
ON CONFLICT DO NOTHING;

-- ไก่ทอด options
INSERT INTO menu_options (menu_id, name, choices, is_required, max_selection, sort_order)
SELECT m.id, 'ซอส', '[{"name": "ซอสหวาน", "price": 0}, {"name": "ซอสพริก", "price": 0}, {"name": "ซอสกระเทียม", "price": 0}]', false, 1, 0
FROM menus m WHERE m.name = 'ไก่ทอด' AND m.store_id = 'BS001'
ON CONFLICT DO NOTHING;

-- 5. Create sample orders (for testing KDS)
INSERT INTO orders (store_id, table_no, status, total_price)
VALUES 
  ('BS001', '1', 'pending', 200),
  ('BS001', '2', 'cooking', 150),
  ('BS001', '3', 'served', 80)
ON CONFLICT DO NOTHING;

-- 6. Create sample order items
-- Get the order IDs and create items
DO $$
DECLARE
  order1_id INT;
  order2_id INT;
  order3_id INT;
BEGIN
  SELECT id INTO order1_id FROM orders WHERE store_id = 'BS001' AND table_no = '1' AND status = 'pending' LIMIT 1;
  SELECT id INTO order2_id FROM orders WHERE store_id = 'BS001' AND table_no = '2' AND status = 'cooking' LIMIT 1;
  SELECT id INTO order3_id FROM orders WHERE store_id = 'BS001' AND table_no = '3' AND status = 'served' LIMIT 1;
  
  -- Order 1 items (pending)
  IF order1_id IS NOT NULL THEN
    INSERT INTO order_items (order_id, menu_id, quantity, selected_options, note)
    VALUES 
      (order1_id, (SELECT id FROM menus WHERE name = 'ผัดไทย' AND store_id = 'BS001'), 1, 'เนื้อสัตว์: กุ้ง', 'ไม่ใส่ถั่ว'),
      (order1_id, (SELECT id FROM menus WHERE name = 'ส้มตำ' AND store_id = 'BS001'), 1, NULL, 'ไม่เผ็ด');
  END IF;
  
  -- Order 2 items (cooking)
  IF order2_id IS NOT NULL THEN
    INSERT INTO order_items (order_id, menu_id, quantity, selected_options, note)
    VALUES 
      (order2_id, (SELECT id FROM menus WHERE name = 'ต้มยำกุ้ง' AND store_id = 'BS001'), 1, 'ความเผ็ด: เผ็ดปานกลาง', 'เพิ่มผัก');
  END IF;
  
  -- Order 3 items (served)
  IF order3_id IS NOT NULL THEN
    INSERT INTO order_items (order_id, menu_id, quantity, selected_options, note)
    VALUES 
      (order3_id, (SELECT id FROM menus WHERE name = 'ข้าวผัด' AND store_id = 'BS001'), 2, 'ท็อปปิ้ง: ไข่ดาว, ไก่กรอบ', NULL);
  END IF;
END $$;

COMMIT;
