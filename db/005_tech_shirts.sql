-- =============================================================================
-- CodeDrip — 005_tech_shirts.sql
-- Product tags for tech categorization, updated stock triggers for variant
-- support, and seed data for 5 developer t-shirts with size variants.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- Product Tags — tech stack / language labels for shirts.
-- -----------------------------------------------------------------------------
CREATE TABLE product_tags (
    id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name  TEXT NOT NULL,
    slug  TEXT UNIQUE NOT NULL,
    color TEXT NOT NULL DEFAULT '#58a6ff'
);

CREATE TABLE product_tag_assignments (
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    tag_id     UUID NOT NULL REFERENCES product_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, tag_id)
);

CREATE INDEX idx_product_tag_assignments_tag ON product_tag_assignments(tag_id);

-- -----------------------------------------------------------------------------
-- Insert tech tags
-- -----------------------------------------------------------------------------
INSERT INTO product_tags (name, slug, color) VALUES
    ('Backend',    'backend',    '#58a6ff'),
    ('Node.js',    'nodejs',     '#83cd29'),
    ('API',        'api',        '#f97583'),
    ('Frontend',   'frontend',   '#79c0ff'),
    ('JavaScript', 'javascript', '#f0db4f'),
    ('Async',      'async',      '#d2a8ff'),
    ('DevOps',     'devops',     '#ff7b72'),
    ('Linux',      'linux',      '#f0883e'),
    ('Meme',       'meme',       '#ffa657'),
    ('AI',         'ai',         '#bc8cff'),
    ('Python',     'python',     '#a5d6ff'),
    ('ML',         'ml',         '#7ee787'),
    ('Web3',       'web3',       '#ffa198'),
    ('Blockchain', 'blockchain', '#79c0ff'),
    ('Java',       'java',       '#b3e1ff'),
    ('Git',        'git',        '#f85149'),
    ('Chaos',      'chaos',      '#ff7b72'),
    ('Debugging',  'debugging',  '#ffa657'),
    ('Rust',       'rust',       '#ffa657')
ON CONFLICT (slug) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Update decrement_stock_on_paid — also decrement variant stock when an order
-- item references a specific variant (e.g., a shirt size).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION decrement_stock_on_paid()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.payment_status = 'paid' AND OLD.payment_status IS DISTINCT FROM 'paid' THEN
        -- Decrement product-level stock
        UPDATE products p
        SET stock_quantity = GREATEST(p.stock_quantity - oi.quantity, 0)
        FROM order_items oi
        WHERE oi.order_id = NEW.id
          AND oi.product_id = p.id;

        -- Decrement variant-level stock (for size variants on shirts)
        UPDATE product_variants pv
        SET stock_quantity = GREATEST(pv.stock_quantity - oi.quantity, 0)
        FROM order_items oi
        WHERE oi.order_id = NEW.id
          AND oi.variant_id IS NOT NULL
          AND oi.variant_id = pv.id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- Store settings (singleton) — rebrand to CodeDrip
-- -----------------------------------------------------------------------------
INSERT INTO store_settings (
    singleton, store_name, logo_url, favicon_url,
    primary_color, secondary_color, accent_color, currency,
    support_email, support_phone, address, meta_description, social_links
) VALUES (
    true, 'CodeDrip', '/uploads/logo.png', '/favicon.ico',
    '#6C63FF', '#16161A', '#00D4AA', 'INR',
    'dev@codedrip.dev', '+91 80 4000 1234',
    'Online',
    'Developer merchandise for coders who deploy on Friday and debug on Saturday.',
    '{"twitter":"https://twitter.com/codedrip","github":"https://github.com/codedrip"}'::jsonb
)
ON CONFLICT (singleton) DO UPDATE SET
    store_name     = EXCLUDED.store_name,
    primary_color  = EXCLUDED.primary_color,
    secondary_color = EXCLUDED.secondary_color,
    accent_color   = EXCLUDED.accent_color,
    meta_description = EXCLUDED.meta_description,
    social_links   = EXCLUDED.social_links;

-- -----------------------------------------------------------------------------
-- Categories — replace with Apparel focus
-- -----------------------------------------------------------------------------
INSERT INTO categories (name, slug, description, sort_order) VALUES
    ('Developer T-Shirts', 'developer-t-shirts', 'Witty, clever, and uncomfortably relatable tees for the code-slinging crowd.', 1),
    ('Limited Drops',      'limited-drops',      'Small-batch designs that ship before your next merge conflict.', 2),
    ('Hoodies & Outerwear','hoodies-outerwear',  'For late-night debugging sessions and chilly server rooms.', 3)
ON CONFLICT (slug) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Products — 5 dev t-shirts with size variants (XS–XXL).
-- Each size is a product_variant with its own stock tracking.
-- -----------------------------------------------------------------------------
INSERT INTO products (name, slug, short_description, description, sku, category_id, brand, base_price, stock_quantity, is_active, is_featured, specs)
VALUES
-- 1. The Middleware
('The Middleware', 'the-middleware',
 'It sits between your request and your sanity.',
 'Premium cotton tee for the developer who handles every request with grace—and every error with a deep sigh. Features a minimalist design inspired by middleware flow diagrams. 100% combed ring-spun cotton. Pre-shrunk. Because your code should shrink your bugs, not your shirts.',
 'DVT-TEE-MID-001', (SELECT id FROM categories WHERE slug='developer-t-shirts'), 'CodeDrip', 1299.00, 99999, true, true,
 '{"product_type":"T-Shirt","material":"100% Combed Ring-Spun Cotton","fit":"Regular","care":"Machine wash cold, tumble dry low","design":"Minimalist middleware flow diagram"}'::jsonb),

-- 2. async await
('async await', 'async-await',
 'I handle errors like I handle my emotions. I wrap everything in try/catch.',
 'A tribute to every JavaScript developer who has ever stared at an unhandled promise rejection at 2 AM. This shirt features the iconic async/await pattern in a bold, code-like design. 100% cotton. Fits like a callback—but reads like modern syntax.',
 'DVT-TEE-ASYNC-002', (SELECT id FROM categories WHERE slug='developer-t-shirts'), 'CodeDrip', 1199.00, 99999, true, true,
 '{"product_type":"T-Shirt","material":"100% Cotton","fit":"Regular","care":"Machine wash cold, tumble dry low","design":"async/await syntax pattern"}'::jsonb),

-- 3. sudo rm -rf /*
('sudo rm -rf /*', 'sudo-rm-rf',
 'I just wanted to free up some disk space.',
 'For the developer who learned the hard way why you never run this command. A cautionary tale woven into 180 GSM premium cotton. Features the infamous command in a retro terminal font on the front, with a small "It seemed like a good idea at the time" on the back neck.',
 'DVT-TEE-SUDO-003', (SELECT id FROM categories WHERE slug='developer-t-shirts'), 'CodeDrip', 1249.00, 99999, true, true,
 '{"product_type":"T-Shirt","material":"180 GSM Premium Cotton","fit":"Regular","care":"Machine wash cold, tumble dry low","design":"Retro terminal font"}'::jsonb),

-- 4. TensorFlow: The Sequel
('TensorFlow: The Sequel', 'tensorflow-the-sequel',
 'My neural network is deeper than my understanding of this codebase.',
 'A shirt for the AI/ML enthusiast who spends more time tweaking hyperparameters than talking to humans. Features a neural network diagram that looks suspiciously like a plate of spaghetti. Because at some point, every model is just a really expensive guess.',
 'DVT-TEE-TENSOR-004', (SELECT id FROM categories WHERE slug='developer-t-shirts'), 'CodeDrip', 1399.00, 99999, true, false,
 '{"product_type":"T-Shirt","material":"100% Combed Ring-Spun Cotton","fit":"Regular","care":"Machine wash cold, tumble dry low","design":"Neural network diagram"}'::jsonb),

-- 5. Web3 Ready
('Web3 Ready', 'web3-ready',
 'I put blockchain on my resume and got a 200% salary increase.',
 'A satirical take on the blockchain gold rush. Features the classic "WAGMI" ethos rendered in a clean, minimalist design. 100% organic cotton. Decentralized threads. No smart contracts were harmed in the making of this shirt. (DYOR before buying.)',
 'DVT-TEE-WEB3-005', (SELECT id FROM categories WHERE slug='developer-t-shirts'), 'CodeDrip', 1299.00, 99999, true, false,
 '{"product_type":"T-Shirt","material":"100% Organic Cotton","fit":"Regular","care":"Machine wash cold, tumble dry low","design":"Minimalist crypto aesthetic"}'::jsonb),

-- 6. Deep Learning Neural Network
('Deep Learning Neural Network', 'neural-brain-tee',
 'My thoughts are structured in layers.',
 'Unleash your cognitive power with this brain-inspired neural connection schematic. A premium t-shirt designed for neural network architects, machine learning enthusiasts, and data scientists. Tailored from 100% combed cotton, it offers both maximum comfort and unmatched intellectual style.',
 'DVT-TEE-NEURAL-006', (SELECT id FROM categories WHERE slug='developer-t-shirts'), 'CodeDrip', 1299.00, 99999, true, false,
 '{"product_type":"T-Shirt","material":"100% Combed Ring-Spun Cotton","fit":"Regular","care":"Machine wash cold, tumble dry low","design":"Synaptic neural network layout"}'::jsonb),

-- 7. The Dev Object
('The Dev Object', 'const-dev-infinity',
 'coffee: Infinity, sleep: null, bugs: 404.',
 'A perfectly serialized representation of the developer lifestyle. This tee features the constant variable declaration of every developer''s daily cycle: infinite coffee, nonexistent sleep, and a persistent search for bugs. Made from 180 GSM premium pre-shrunk cotton.',
 'DVT-TEE-CONSTDEV-007', (SELECT id FROM categories WHERE slug='developer-t-shirts'), 'CodeDrip', 1199.00, 99999, true, true,
 '{"product_type":"T-Shirt","material":"180 GSM Premium Cotton","fit":"Regular","care":"Machine wash cold, tumble dry low","design":"JavaScript dev object declaration"}'::jsonb),

-- 8. Works On My Machine
('Works On My Machine', 'works-on-my-machine',
 '¯\_(ツ)_/¯ Let''s ship your machine.',
 'The ultimate developer get-out-of-jail-free card. When QA says it is broken, just point to this premium cotton tee featuring the industry''s most trusted debugging shrug: ¯\_(ツ)_/¯. Extremely comfortable, highly defensive, and 100% true (under localized conditions).',
 'DVT-TEE-WORKSMACHINE-008', (SELECT id FROM categories WHERE slug='developer-t-shirts'), 'CodeDrip', 1249.00, 99999, true, true,
 '{"product_type":"T-Shirt","material":"100% Cotton","fit":"Regular","care":"Machine wash cold, tumble dry low","design":"Works on My Machine shrugged face"}'::jsonb),

-- 9. my_first_program.py
('my_first_program.py', 'hello-world-python',
 'print("Hello, World!")',
 'Every developer remembers where their journey began. Celebrate your first script with this minimalist Python-themed print tee. Sleek, classic syntax in clean IDE-inspired typography on a soft, durable cotton backdrop. The perfect wear for your daily script-running.',
 'DVT-TEE-HELLOWORLD-009', (SELECT id FROM categories WHERE slug='developer-t-shirts'), 'CodeDrip', 1099.00, 99999, true, false,
 '{"product_type":"T-Shirt","material":"100% Organic Cotton","fit":"Regular","care":"Machine wash cold, tumble dry low","design":"Python hello world script"}'::jsonb),

-- 10. 404 Motivation Not Found
('404 Motivation Not Found', 'motivation-404',
 'HTTP Error: Motivation Not Found.',
 'For those mornings when your coffee hasn''t kicked in and your Git repository is failing. This bold, minimalist status code shirt states exactly what is missing from your terminal session: motivation. Made from ultra-soft ring-spun cotton.',
 'DVT-TEE-MOTIVATION404-010', (SELECT id FROM categories WHERE slug='developer-t-shirts'), 'CodeDrip', 1149.00, 99999, true, false,
 '{"product_type":"T-Shirt","material":"100% Combed Cotton","fit":"Regular","care":"Machine wash cold, tumble dry low","design":"404 Motivation status code"}'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Variants — sizes XS through XXL for each shirt.
-- Each variant tracks its own inventory so we can do per-size stock.
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    shirt RECORD;
    sizes TEXT[] := ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    size TEXT;
    price NUMERIC;
    base_stock INT;
BEGIN
    FOR shirt IN SELECT id, slug, base_price FROM products WHERE slug IN (
        'the-middleware', 'async-await', 'sudo-rm-rf',
        'tensorflow-the-sequel', 'web3-ready',
        'neural-brain-tee', 'const-dev-infinity', 'works-on-my-machine',
        'hello-world-python', 'motivation-404'
    ) LOOP
        -- Different stock per shirt
        base_stock := CASE shirt.slug
            WHEN 'the-middleware' THEN 25
            WHEN 'async-await' THEN 30
            WHEN 'sudo-rm-rf' THEN 20
            WHEN 'tensorflow-the-sequel' THEN 15
            WHEN 'web3-ready' THEN 10
            WHEN 'neural-brain-tee' THEN 35
            WHEN 'const-dev-infinity' THEN 40
            WHEN 'works-on-my-machine' THEN 25
            WHEN 'hello-world-python' THEN 50
            WHEN 'motivation-404' THEN 30
        END;

        FOREACH size IN ARRAY sizes LOOP
            -- Larger sizes cost slightly more, smaller sizes a bit less
            price := CASE size
                WHEN 'XS' THEN shirt.base_price - 100
                WHEN 'S'  THEN shirt.base_price - 50
                WHEN 'M'  THEN shirt.base_price
                WHEN 'L'  THEN shirt.base_price
                WHEN 'XL' THEN shirt.base_price + 100
                WHEN 'XXL' THEN shirt.base_price + 150
            END;

            INSERT INTO product_variants (product_id, name, sku_suffix, price_modifier, stock_quantity, attributes)
            VALUES (
                shirt.id,
                size,
                '-' || size,
                price - shirt.base_price,
                base_stock + (random() * 10 - 5)::int,
                jsonb_build_object('size', size)
            );
        END LOOP;
    END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- Tag assignments
-- -----------------------------------------------------------------------------
INSERT INTO product_tag_assignments (product_id, tag_id)
SELECT p.id, t.id FROM products p, product_tags t
WHERE (p.slug = 'the-middleware' AND t.slug IN ('backend', 'nodejs', 'api'))
   OR (p.slug = 'async-await' AND t.slug IN ('frontend', 'javascript', 'async'))
   OR (p.slug = 'sudo-rm-rf' AND t.slug IN ('devops', 'linux', 'meme'))
   OR (p.slug = 'tensorflow-the-sequel' AND t.slug IN ('ai', 'python', 'ml'))
   OR (p.slug = 'web3-ready' AND t.slug IN ('web3', 'blockchain', 'meme'))
   OR (p.slug = 'neural-brain-tee' AND t.slug IN ('ai', 'ml', 'python'))
   OR (p.slug = 'const-dev-infinity' AND t.slug IN ('javascript', 'nodejs', 'meme'))
   OR (p.slug = 'works-on-my-machine' AND t.slug IN ('debugging', 'git', 'meme'))
   OR (p.slug = 'hello-world-python' AND t.slug IN ('python', 'api', 'debugging'))
   OR (p.slug = 'motivation-404' AND t.slug IN ('meme', 'debugging', 'chaos'))
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- Product images
-- -----------------------------------------------------------------------------
INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary)
SELECT img.product_id, img.url, img.alt, 0, true
FROM (VALUES
  ((SELECT id FROM products WHERE slug = 'the-middleware'),
   'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80', 'The Middleware t-shirt on a developer desk'),
  ((SELECT id FROM products WHERE slug = 'async-await'),
   'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80', 'async await t-shirt'),
  ((SELECT id FROM products WHERE slug = 'sudo-rm-rf'),
   'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80', 'sudo rm -rf t-shirt'),
  ((SELECT id FROM products WHERE slug = 'tensorflow-the-sequel'),
   'https://images.unsplash.com/photo-1554568218-0f1715e72254?w=800&q=80', 'TensorFlow t-shirt'),
  ((SELECT id FROM products WHERE slug = 'web3-ready'),
   'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80', 'Web3 Ready t-shirt'),
  ((SELECT id FROM products WHERE slug = 'neural-brain-tee'),
   '/uploads/neural-brain-tee.jpg', 'Synaptic Threads T-shirt'),
  ((SELECT id FROM products WHERE slug = 'const-dev-infinity'),
   '/uploads/const-dev-tee.jpg', 'const dev T-shirt'),
  ((SELECT id FROM products WHERE slug = 'works-on-my-machine'),
   '/uploads/works-on-my-machine-tee.jpg', 'Works On My Machine T-shirt'),
  ((SELECT id FROM products WHERE slug = 'hello-world-python'),
   '/uploads/hello-world-py-tee.png', 'Hello World Python T-shirt'),
  ((SELECT id FROM products WHERE slug = 'motivation-404'),
   '/uploads/motivation-404-tee.jpg', '404 Motivation Not Found T-shirt')
) AS img(product_id, url, alt)
WHERE NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = img.product_id
);

-- -----------------------------------------------------------------------------
-- Coupons — developer-themed API Keys
-- -----------------------------------------------------------------------------
INSERT INTO coupons (code, type, value, min_order_value, max_uses, expires_at, is_active) VALUES
    ('DEVGHOST10', 'percent', 10, 0,    500, now() + interval '180 days', true),
    ('GITPUSH50',   'fixed',   50, 500, 200, now() + interval '180 days', true),
    ('NODEBUG',   'percent', 15, 999,  100, now() + interval '180 days', true)
ON CONFLICT (code) DO NOTHING;

COMMIT;
