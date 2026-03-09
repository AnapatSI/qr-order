-- =====================================
-- Bangsaen Smart Order - Professional POS Schema Upgrades
-- =====================================

-- 1. Check if is_available exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='menus' AND column_name='is_available'
    ) THEN
        ALTER TABLE menus ADD COLUMN is_available BOOLEAN DEFAULT true NOT NULL;
        CREATE INDEX idx_menus_is_available ON menus(is_available);
    END IF;
END $$;

-- 2. Create menu_options table for add-ons and variants
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'menu_options') THEN
        CREATE TABLE menu_options (
            id SERIAL PRIMARY KEY,
            menu_id INTEGER NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
            name VARCHAR(100) NOT NULL, -- e.g., "Meat Choice", "Add-on", "Spice Level"
            choices JSONB NOT NULL, -- e.g., [{"name":"Pork", "price":0}, {"name":"Seafood", "price":15}]
            is_required BOOLEAN DEFAULT false,
            max_selection INTEGER DEFAULT 1, -- 0 = unlimited, 1 = single choice, >1 = multiple choices
            sort_order INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX idx_menu_options_menu_id ON menu_options(menu_id);
        CREATE INDEX idx_menu_options_sort_order ON menu_options(sort_order);
    END IF;
END $$;

-- 3. Create reviews table for customer feedback
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
        CREATE TABLE reviews (
            id SERIAL PRIMARY KEY,
            store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
            order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
            comment TEXT,
            customer_name VARCHAR(100), -- Optional customer name
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX idx_reviews_store_id ON reviews(store_id);
        CREATE INDEX idx_reviews_order_id ON reviews(order_id);
        CREATE INDEX idx_reviews_rating ON reviews(rating);
        CREATE INDEX idx_reviews_created_at ON reviews(created_at);
    END IF;
END $$;

-- 4. Update order_items table - Add options and notes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='order_items' AND column_name='selected_options'
    ) THEN
        ALTER TABLE order_items 
        ADD COLUMN selected_options JSONB, -- e.g., [{"option_id":"uuid", "choice":{"name":"Seafood","price":15}}]
        ADD COLUMN note TEXT; -- Customer's special requests like "No spicy", "Extra egg"
        
        -- Create index for performance
        CREATE INDEX idx_order_items_selected_options ON order_items USING GIN(selected_options);
    END IF;
END $$;

-- 5. Add sample menu_options for testing (only if menu_options exists and has data)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'menu_options') THEN
        -- Check if we have menus and no menu_options yet
        IF (SELECT COUNT(*) FROM menus) > 0 AND (SELECT COUNT(*) FROM menu_options) = 0 THEN
            -- Get first few menus to add options to
            INSERT INTO menu_options (menu_id, name, choices, is_required, max_selection, sort_order) 
            SELECT 
                id,
                CASE 
                    WHEN name LIKE '%Pad Thai%' THEN 'Protein Choice'
                    WHEN name LIKE '%Tom Yum%' THEN 'Size'
                    WHEN name LIKE '%Mango%' THEN 'Portion'
                    ELSE 'Extra Options'
                END,
                CASE 
                    WHEN name LIKE '%Pad Thai%' THEN '[{"name":"Chicken", "price":0}, {"name":"Pork", "price":5}, {"name":"Seafood", "price":15}]'::jsonb
                    WHEN name LIKE '%Tom Yum%' THEN '[{"name":"Regular", "price":0}, {"name":"Large", "price":20}]'::jsonb
                    WHEN name LIKE '%Mango%' THEN '[{"name":"Regular", "price":0}, {"name":"Large", "price":15}]'::jsonb
                    ELSE '[{"name":"Standard", "price":0}, {"name":"Premium", "price":10}]'::jsonb
                END,
                true, 1, 1
            FROM menus 
            LIMIT 3;
        END IF;
    END IF;
END $$;

-- 6. Enable RLS for new tables
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'menu_options') THEN
        ALTER TABLE menu_options ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
        ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 7. Create RLS policies for menu_options
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'menu_options') THEN
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Stores can view their own menu options" ON menu_options;
        DROP POLICY IF EXISTS "Stores can manage their own menu options" ON menu_options;
        
        -- Create new policies
        CREATE POLICY "Stores can view their own menu options" ON menu_options
            FOR SELECT USING (
                menu_id IN (
                    SELECT id FROM menus WHERE store_id = auth.uid()::text
                )
            );

        CREATE POLICY "Stores can manage their own menu options" ON menu_options
            FOR ALL USING (
                menu_id IN (
                    SELECT id FROM menus WHERE store_id = auth.uid()::text
                )
            );
    END IF;
END $$;

-- 8. Create RLS policies for reviews
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Stores can view their own reviews" ON reviews;
        DROP POLICY IF EXISTS "Customers can create reviews for their orders" ON reviews;
        
        -- Create new policies
        CREATE POLICY "Stores can view their own reviews" ON reviews
            FOR SELECT USING (store_id = auth.uid()::text);

        CREATE POLICY "Customers can create reviews for their orders" ON reviews
            FOR INSERT WITH CHECK (
                order_id IN (
                    SELECT id FROM orders WHERE store_id = store_id
                )
            );
    END IF;
END $$;

-- 9. Update updated_at trigger for menu_options
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_menu_options_updated_at 
    BEFORE UPDATE ON menu_options 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at 
    BEFORE UPDATE ON reviews 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Add helpful views for analytics
CREATE OR REPLACE VIEW menu_performance AS
SELECT 
    m.id as menu_id,
    m.name as menu_name,
    m.price as base_price,
    COUNT(oi.id) as order_count,
    SUM(oi.quantity) as total_quantity,
    SUM(oi.quantity * m.price) as total_revenue,
    AVG(r.rating) as average_rating
FROM menus m
LEFT JOIN order_items oi ON m.id = oi.menu_id
LEFT JOIN orders o ON oi.order_id = o.id
LEFT JOIN reviews r ON o.id = r.order_id
WHERE m.store_id IN (
    SELECT id FROM stores WHERE owner_id = auth.uid()
)
GROUP BY m.id, m.name, m.price;

-- 11. Add sample reviews for testing (only if reviews exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
        -- Check if we have paid orders and no reviews yet
        IF (SELECT COUNT(*) FROM orders WHERE status = 'paid') > 0 AND (SELECT COUNT(*) FROM reviews) = 0 THEN
            INSERT INTO reviews (store_id, order_id, rating, comment, customer_name)
            SELECT 
                store_id,
                id,
                CASE WHEN id % 5 = 0 THEN 5 ELSE 4 END as rating,
                CASE 
                    WHEN id % 3 = 0 THEN 'Delicious food! Fast service.'
                    WHEN id % 3 = 1 THEN 'Good portions, will come again.'
                    ELSE 'Tasty and fresh ingredients.'
                END as comment,
                'Customer ' || (id % 10 + 1)
            FROM orders 
            WHERE status = 'paid'
            LIMIT 10;
        END IF;
    END IF;
END $$;

-- 12. Update stores table to track analytics
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='stores' AND column_name='total_orders'
    ) THEN
        ALTER TABLE stores 
        ADD COLUMN total_orders INTEGER DEFAULT 0,
        ADD COLUMN total_revenue DECIMAL(10,2) DEFAULT 0.00,
        ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0.00;
        
        -- Create index
        CREATE INDEX idx_stores_total_orders ON stores(total_orders);
        CREATE INDEX idx_stores_total_revenue ON stores(total_revenue);
    END IF;
END $$;

-- 13. Create function to update store analytics
CREATE OR REPLACE FUNCTION update_store_analytics()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'orders' AND TG_OP = 'UPDATE' AND NEW.status = 'paid' AND OLD.status != 'paid' THEN
        UPDATE stores SET 
            total_orders = total_orders + 1,
            total_revenue = total_revenue + NEW.total_price
        WHERE id = NEW.store_id;
    END IF;
    
    IF TG_TABLE_NAME = 'reviews' AND TG_OP = 'INSERT' THEN
        UPDATE stores SET 
            average_rating = (
                SELECT COALESCE(AVG(rating), 0) 
                FROM reviews 
                WHERE store_id = NEW.store_id
            )
        WHERE id = NEW.store_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- 14. Create triggers for analytics updates
DO $$
BEGIN
    DROP TRIGGER IF EXISTS trigger_update_store_analytics_orders ON orders;
    CREATE TRIGGER trigger_update_store_analytics_orders
        AFTER UPDATE ON orders
        FOR EACH ROW EXECUTE FUNCTION update_store_analytics();

    DROP TRIGGER IF EXISTS trigger_update_store_analytics_reviews ON reviews;
    CREATE TRIGGER trigger_update_store_analytics_reviews
        AFTER INSERT ON reviews
        FOR EACH ROW EXECUTE FUNCTION update_store_analytics();
END $$;

-- =====================================
-- Schema Upgrade Complete!
-- =====================================
