CREATE TABLE stores (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  credit_balance INT DEFAULT 100
);

CREATE TABLE menus (
  id SERIAL PRIMARY KEY,
  store_id TEXT REFERENCES stores(id),
  name TEXT NOT NULL,
  price INT NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT TRUE
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  store_id TEXT REFERENCES stores(id),
  table_no TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'cooking', 'served', 'paid'
  total_price INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(id),
  menu_id INT REFERENCES menus(id),
  quantity INT NOT NULL,
  special_instructions TEXT
);
