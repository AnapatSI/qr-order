CREATE TABLE stores (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  credit_balance INT DEFAULT 100,
  total_orders INT DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0.00,
  average_rating NUMERIC DEFAULT 0.00
);

CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id TEXT NOT NULL REFERENCES stores(id),
  table_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE menus (
  id SERIAL PRIMARY KEY,
  store_id TEXT REFERENCES stores(id),
  name TEXT NOT NULL,
  price INT NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  description TEXT
);

CREATE TABLE menu_options (
  id SERIAL PRIMARY KEY,
  menu_id INT NOT NULL REFERENCES menus(id),
  name VARCHAR NOT NULL,
  choices JSONB NOT NULL, -- [{name: string, price: number}]
  is_required BOOLEAN DEFAULT FALSE,
  max_selection INT DEFAULT 1,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
  special_instructions TEXT,
  selected_options JSONB,
  note TEXT
);

CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES stores(id),
  order_id INT NOT NULL REFERENCES orders(id),
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  customer_name VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
