-- =============================================================================
-- OursCart — 003_seed.sql
-- Demo data for local development. Depends on 001 + 002.
--
-- Passwords are hashed with pgcrypto's bcrypt (gen_salt('bf', 12)). Node's
-- bcrypt.compare() verifies these hashes natively — the on-disk format ($2a$...)
-- is identical. Demo login for BOTH users below is:  Password123!
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- Store settings (singleton). ON CONFLICT keeps re-seeding idempotent.
-- -----------------------------------------------------------------------------
INSERT INTO store_settings (
    singleton, store_name, logo_url, favicon_url,
    primary_color, secondary_color, accent_color, currency,
    support_email, support_phone, address, meta_description, social_links
) VALUES (
    true, 'OursCart', '/uploads/logo.png', '/favicon.ico',
    '#2563eb', '#0f172a', '#f59e0b', 'INR',
    'support@ourscart.com', '+91 80 4000 1234',
    '4th Floor, Tech Park, Bengaluru, Karnataka 560103, India',
    'Genuine RAM, SSDs, hard drives and PC accessories with real specs, honest pricing, and fast shipping across India.',
    '{"twitter":"https://twitter.com/ourscart","instagram":"https://instagram.com/ourscart","youtube":"https://youtube.com/@ourscart"}'::jsonb
)
ON CONFLICT (singleton) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Users. Insert admin FIRST so the first_user_becomes_admin trigger and the
-- explicit role both agree. Re-running is safe via ON CONFLICT on email.
-- -----------------------------------------------------------------------------
INSERT INTO users (email, password_hash, first_name, last_name, role, is_verified)
VALUES ('admin@ourscart.com', crypt('Password123!', gen_salt('bf', 12)), 'Ada', 'Owner', 'admin', true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, password_hash, first_name, last_name, role, is_verified)
VALUES ('customer@ourscart.com', crypt('Password123!', gen_salt('bf', 12)), 'Riya', 'Sharma', 'customer', true)
ON CONFLICT (email) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Categories.
-- -----------------------------------------------------------------------------
INSERT INTO categories (name, slug, description, sort_order) VALUES
    ('RAM',         'ram',         'DDR4 and DDR5 desktop and laptop memory modules.', 1),
    ('SSD',         'ssd',         'NVMe and SATA solid-state drives for boot and storage.', 2),
    ('HDD',         'hdd',         'High-capacity 3.5" and 2.5" mechanical hard drives.', 3),
    ('Accessories', 'accessories', 'Thermal paste, cables, enclosures and the small parts that finish a build.', 4)
ON CONFLICT (slug) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Products — 3 per category, with realistic specs in JSONB. category_id is
-- resolved by slug subquery so this seed is independent of generated UUIDs.
-- -----------------------------------------------------------------------------
INSERT INTO products (name, slug, short_description, description, sku, category_id, brand, base_price, compare_at_price, stock_quantity, is_featured, specs)
VALUES
-- RAM
('Corsair Vengeance 16GB DDR5-5600', 'corsair-vengeance-16gb-ddr5-5600',
 '16GB (1x16GB) DDR5 desktop memory, 5600MT/s.',
 'Single-module 16GB DDR5 running at 5600MT/s with on-die ECC and an aluminium heat spreader. XMP 3.0 and EXPO profiles for one-click overclocking.',
 'RAM-COR-DDR5-16-5600', (SELECT id FROM categories WHERE slug='ram'), 'Corsair', 5200.00, 5900.00, 120, true,
 '{"capacity":"16GB","speed":"DDR5-5600","form_factor":"DIMM","cas_latency":"CL36","warranty":"Lifetime"}'::jsonb),

('Crucial 32GB DDR4-3200 (2x16GB)', 'crucial-32gb-ddr4-3200',
 '32GB DDR4 dual-channel kit, 3200MT/s.',
 'Matched 2x16GB DDR4 kit at 3200MT/s, CL22. A reliable, no-RGB upgrade for mainstream desktops and workstations.',
 'RAM-CRU-DDR4-32-3200', (SELECT id FROM categories WHERE slug='ram'), 'Crucial', 6400.00, 7100.00, 85, false,
 '{"capacity":"32GB","speed":"DDR4-3200","form_factor":"DIMM","cas_latency":"CL22","warranty":"Lifetime"}'::jsonb),

('Kingston Fury 16GB DDR4 SODIMM', 'kingston-fury-16gb-ddr4-sodimm',
 '16GB DDR4-3200 laptop memory.',
 'Single 16GB SODIMM at 3200MT/s for laptops and mini-PCs. Plug-and-play with automatic Plug N Play timings.',
 'RAM-KIN-DDR4-16-SO', (SELECT id FROM categories WHERE slug='ram'), 'Kingston', 3300.00, NULL, 60, false,
 '{"capacity":"16GB","speed":"DDR4-3200","form_factor":"SODIMM","cas_latency":"CL20","warranty":"Lifetime"}'::jsonb),

-- SSD
('Samsung 990 PRO 1TB NVMe', 'samsung-990-pro-1tb-nvme',
 '1TB PCIe 4.0 NVMe SSD, up to 7450MB/s.',
 'Flagship M.2 2280 NVMe drive with sequential reads up to 7450MB/s. Nickel-coated controller and optional heatsink model for sustained PS5 and desktop loads.',
 'SSD-SAM-990P-1TB', (SELECT id FROM categories WHERE slug='ssd'), 'Samsung', 9800.00, 11500.00, 140, true,
 '{"capacity":"1TB","interface":"NVMe PCIe 4.0","form_factor":"M.2 2280","read_speed":"7450MB/s","write_speed":"6900MB/s","warranty":"5 years"}'::jsonb),

('WD Blue SN580 2TB NVMe', 'wd-blue-sn580-2tb-nvme',
 '2TB PCIe 4.0 NVMe SSD for everyday builds.',
 'DRAM-less 2TB NVMe drive tuned for capacity and efficiency. nCache 4.0 keeps everyday transfers fast without breaking the budget.',
 'SSD-WD-SN580-2TB', (SELECT id FROM categories WHERE slug='ssd'), 'Western Digital', 12300.00, 13900.00, 70, false,
 '{"capacity":"2TB","interface":"NVMe PCIe 4.0","form_factor":"M.2 2280","read_speed":"4150MB/s","write_speed":"4150MB/s","warranty":"5 years"}'::jsonb),

('Crucial MX500 1TB SATA', 'crucial-mx500-1tb-sata',
 '1TB 2.5" SATA SSD for upgrades.',
 'The go-to 2.5" SATA drive for reviving older laptops and desktops. Hardware AES-256 encryption and integrated power-loss immunity.',
 'SSD-CRU-MX500-1TB', (SELECT id FROM categories WHERE slug='ssd'), 'Crucial', 5600.00, 6400.00, 95, false,
 '{"capacity":"1TB","interface":"SATA III","form_factor":"2.5-inch","read_speed":"560MB/s","write_speed":"510MB/s","warranty":"5 years"}'::jsonb),

-- HDD
('Seagate BarraCuda 4TB 3.5"', 'seagate-barracuda-4tb',
 '4TB 5400rpm desktop hard drive.',
 'High-capacity 3.5" drive for mass storage, backups and media libraries. Multi-tier caching keeps common files responsive.',
 'HDD-SEA-BAR-4TB', (SELECT id FROM categories WHERE slug='hdd'), 'Seagate', 7200.00, 8100.00, 50, true,
 '{"capacity":"4TB","interface":"SATA III","form_factor":"3.5-inch","speed":"5400rpm","cache":"256MB","warranty":"2 years"}'::jsonb),

('WD Red Plus 8TB NAS', 'wd-red-plus-8tb-nas',
 '8TB 7200rpm NAS-rated hard drive.',
 'CMR NAS drive validated for 24/7 operation in multi-bay enclosures. NASware 3.0 firmware tunes it for RAID workloads.',
 'HDD-WD-RED-8TB', (SELECT id FROM categories WHERE slug='hdd'), 'Western Digital', 17400.00, 19200.00, 30, false,
 '{"capacity":"8TB","interface":"SATA III","form_factor":"3.5-inch","speed":"7200rpm","cache":"256MB","workload":"180TB/yr","warranty":"3 years"}'::jsonb),

('Seagate FireCuda 2TB 2.5"', 'seagate-firecuda-2tb-25',
 '2TB 5400rpm laptop hard drive.',
 'Slim 7mm 2.5" drive that drops into most laptops and consoles for a cheap capacity boost.',
 'HDD-SEA-FC-2TB', (SELECT id FROM categories WHERE slug='hdd'), 'Seagate', 6100.00, NULL, 40, false,
 '{"capacity":"2TB","interface":"SATA III","form_factor":"2.5-inch","speed":"5400rpm","cache":"128MB","warranty":"2 years"}'::jsonb),

-- Accessories
('Arctic MX-6 Thermal Paste 4g', 'arctic-mx-6-thermal-paste-4g',
 '4g high-performance thermal compound.',
 'Non-conductive, non-capacitive thermal paste with excellent long-term stability. Ships with a spatula for even application.',
 'ACC-ARC-MX6-4G', (SELECT id FROM categories WHERE slug='accessories'), 'Arctic', 650.00, 850.00, 200, true,
 '{"volume":"4g","conductivity":"non-conductive","warranty":"None"}'::jsonb),

('Orico M.2 NVMe Enclosure USB 3.2', 'orico-m2-nvme-enclosure-usb-32',
 'USB 3.2 Gen2 10Gbps M.2 NVMe enclosure.',
 'Tool-free aluminium enclosure that turns a spare M.2 NVMe SSD into a 10Gbps portable drive. UASP and TRIM supported.',
 'ACC-ORI-NVME-ENC', (SELECT id FROM categories WHERE slug='accessories'), 'Orico', 1700.00, 2100.00, 110, false,
 '{"interface":"USB 3.2 Gen2","bandwidth":"10Gbps","supports":"M.2 NVMe","warranty":"1 year"}'::jsonb),

('SATA III Data Cable 50cm (3-pack)', 'sata-iii-data-cable-50cm-3pack',
 '3 x 6Gbps SATA cables with latch.',
 'Three locking SATA III cables rated for 6Gbps. Straight-to-right-angle connectors for tidy drive cable runs.',
 'ACC-GEN-SATA-3PK', (SELECT id FROM categories WHERE slug='accessories'), 'OursCart', 350.00, NULL, 300, false,
 '{"length":"50cm","rating":"6Gbps","quantity":"3","connector":"straight + right-angle","warranty":"1 year"}'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- One primary image per product (placeholder asset shipped in /uploads).
INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary)
SELECT id, '/uploads/placeholder.png', name, 0, true
FROM products
WHERE NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = products.id
);

-- -----------------------------------------------------------------------------
-- Coupons.
-- -----------------------------------------------------------------------------
INSERT INTO coupons (code, type, value, min_order_value, max_uses, expires_at, is_active) VALUES
    ('WELCOME10', 'percent', 10, 0,    1000, now() + interval '180 days', true),
    ('FLAT200',   'fixed',   200, 1000, 500,  now() + interval '180 days', true)
ON CONFLICT (code) DO NOTHING;

COMMIT;
