-- =====================================================================
-- BrightBuy MIMS Database - Task 2: Data Population (02_seeds.sql)
-- Run AFTER 01_schema.sql has been applied.
-- Steps 1-5 below are direct INSERTs. Step 6 (sample orders) is deferred
-- until sp_PlaceOrder (Task 4) exists -- see the note at the bottom.
-- =====================================================================

START TRANSACTION;

-- -----------------------------------------------------------------
-- Step 1: CATEGORY (>= 10 rows, unique names)
-- -----------------------------------------------------------------
INSERT INTO CATEGORY (category_name, description) VALUES
  ('Mobiles', 'Smartphones and feature phones'),
  ('Laptops', 'Notebook and ultrabook computers'),
  ('Audio Devices', 'Headphones, earbuds, and speakers'),
  ('Wearables', 'Smartwatches and fitness bands'),
  ('Smart Home', 'Connected home devices and automation'),
  ('Gaming', 'Gaming accessories and peripherals'),
  ('Cameras', 'Digital cameras and imaging accessories'),
  ('Accessories', 'Chargers, cables, and cases'),
  ('Toys', 'Consumer toys for children'),
  ('Educational Toys', 'STEM and learning-focused toys');

-- -----------------------------------------------------------------
-- Step 2: PRODUCT (>= 40 rows, every category has >= 1 product)
-- -----------------------------------------------------------------
INSERT INTO PRODUCT (product_name, description, brand, status) VALUES
  ('TechNova Pulse 12', 'Flagship smartphone with a 6.5-inch OLED display.', 'TechNova', 'ACTIVE'),
  ('TechNova Pulse 12 Mini', 'Compact version of the Pulse 12 with the same core specs.', 'TechNova', 'ACTIVE'),
  ('Solaris Orbit S5', 'Mid-range smartphone with a triple-camera system.', 'Solaris Mobile', 'ACTIVE'),
  ('Solaris Orbit S5 Lite', 'Budget-friendly variant of the Orbit S5.', 'Solaris Mobile', 'ACTIVE'),
  ('Vertex Book Air 14', 'Thin-and-light laptop for everyday productivity.', 'Vertex', 'ACTIVE'),
  ('Vertex Book Pro 16', 'High-performance laptop for creative professionals.', 'Vertex', 'ACTIVE'),
  ('Nimbus Slate 13', 'Convertible 2-in-1 laptop with touchscreen.', 'Nimbus', 'ACTIVE'),
  ('Nimbus Slate 13 Ultra', 'Higher-spec version of the Slate 13.', 'Nimbus', 'ACTIVE'),
  ('EchoWave Buds Pro', 'Noise-cancelling true wireless earbuds.', 'EchoWave', 'ACTIVE'),
  ('EchoWave Buds Lite', 'Affordable true wireless earbuds.', 'EchoWave', 'ACTIVE'),
  ('PulseAudio Over-Ear X1', 'Over-ear headphones with 30-hour battery life.', 'PulseAudio', 'ACTIVE'),
  ('PulseAudio Speaker Mini', 'Portable Bluetooth speaker.', 'PulseAudio', 'ACTIVE'),
  ('Orbit Watch S2', 'Smartwatch with heart-rate and GPS tracking.', 'Solaris Mobile', 'ACTIVE'),
  ('Orbit Watch S2 Sport', 'Ruggedized sport edition of the Watch S2.', 'Solaris Mobile', 'ACTIVE'),
  ('Zenith Fit Band 3', 'Fitness tracker band with sleep monitoring.', 'Zenith', 'ACTIVE'),
  ('Zenith Fit Band 3 Kids', 'Kid-friendly fitness band with parental controls.', 'Zenith', 'ACTIVE'),
  ('HomeSense Hub Mini', 'Central hub for connected smart-home devices.', 'HomeSense', 'ACTIVE'),
  ('HomeSense Smart Plug', 'Wi-Fi enabled smart plug with app control.', 'HomeSense', 'ACTIVE'),
  ('HomeSense Security Cam', '1080p indoor security camera with night vision.', 'HomeSense', 'ACTIVE'),
  ('HomeSense Smart Bulb Pack', 'Pack of 2 colour-changing smart bulbs.', 'HomeSense', 'ACTIVE'),
  ('PlayForge Controller X', 'Wireless controller compatible with major consoles.', 'PlayForge', 'ACTIVE'),
  ('PlayForge Headset Elite', 'Gaming headset with surround sound.', 'PlayForge', 'ACTIVE'),
  ('GearUp Gaming Mouse', 'High-DPI gaming mouse with programmable buttons.', 'GearUp', 'ACTIVE'),
  ('GearUp Mechanical Keyboard', 'RGB mechanical keyboard with hot-swappable switches.', 'GearUp', 'ACTIVE'),
  ('LensCraft ActionCam 4K', 'Waterproof 4K action camera with accessory kit.', 'LensCraft', 'ACTIVE'),
  ('LensCraft Mirrorless M100', 'Entry-level mirrorless camera with kit lens.', 'LensCraft', 'ACTIVE'),
  ('ClearView Webcam HD', '1080p USB webcam with built-in microphone.', 'ClearView', 'ACTIVE'),
  ('ClearView Instant Print Cam', 'Instant-print camera with built-in printer.', 'ClearView', 'ACTIVE'),
  ('PowerCore 10000 Power Bank', '10000mAh portable charger with fast charging.', 'PowerCore', 'ACTIVE'),
  ('PowerCore Wireless Charger Pad', '15W wireless charging pad.', 'PowerCore', 'ACTIVE'),
  ('CablePro USB-C Cable 2m', 'Braided USB-C to USB-C charging cable, 2 metres.', 'CablePro', 'ACTIVE'),
  ('CasePro Phone Case Universal', 'Shockproof protective phone case.', 'CasePro', 'ACTIVE'),
  ('BrightBlocks Starter Set', '120-piece interlocking building block set.', 'BrightBlocks', 'ACTIVE'),
  ('BrightBlocks Mega Set', '450-piece interlocking building block set.', 'BrightBlocks', 'ACTIVE'),
  ('ZoomRacer RC Car', 'Remote-controlled sports car, 1:16 scale.', 'ZoomRacer', 'ACTIVE'),
  ('ZoomRacer RC Truck', 'Remote-controlled monster truck, 1:12 scale.', 'ZoomRacer', 'ACTIVE'),
  ('LearnSpark Coding Robot', 'Programmable robot that teaches basic coding logic.', 'LearnSpark', 'ACTIVE'),
  ('LearnSpark Math Puzzle Set', 'Hands-on puzzle set for early math skills.', 'LearnSpark', 'ACTIVE'),
  ('SmartKid Tablet Jr', 'Kid-safe learning tablet with preloaded apps.', 'SmartKid', 'ACTIVE'),
  ('SmartKid Globe Explorer', 'Interactive talking globe for geography learning.', 'SmartKid', 'ACTIVE');

-- -----------------------------------------------------------------
-- Step 3: PRODUCT_CATEGORY (link every product to its category)
-- Uses name-based lookups so this script never depends on assumed
-- auto-increment ID values.
-- -----------------------------------------------------------------
INSERT INTO PRODUCT_CATEGORY (product_id, category_id)
SELECT p.product_id, c.category_id FROM PRODUCT p, CATEGORY c WHERE p.product_name = 'TechNova Pulse 12' AND c.category_name = 'Mobiles'
UNION ALL
SELECT p.product_id, c.category_id FROM PRODUCT p, CATEGORY c WHERE p.product_name = 'TechNova Pulse 12 Mini' AND c.category_name = 'Mobiles'
UNION ALL
SELECT p.product_id, c.category_id FROM PRODUCT p, CATEGORY c WHERE p.product_name = 'Solaris Orbit S5' AND c.category_name = 'Mobiles'
UNION ALL
SELECT p.product_id, c.category_id FROM PRODUCT p, CATEGORY c WHERE p.product_name = 'Solaris Orbit S5 Lite' AND c.category_name = 'Mobiles'
UNION ALL
SELECT p.product_id, c.category_id FROM PRODUCT p, CATEGORY c WHERE p.product_name = 'Vertex Book Air 14' AND c.category_name = 'Laptops'
UNION ALL
SELECT p.product_id, c.category_id FROM PRODUCT p, CATEGORY c WHERE p.product_name = 'Vertex Book Pro 16' AND c.category_name = 'Laptops'
UNION ALL
SELECT p.product_id, c.category_id FROM PRODUCT p, CATEGORY c WHERE p.product_name = 'Nimbus Slate 13' AND c.category_name = 'Laptops'
UNION ALL
SELECT p.product_id, c.category_id FROM PRODUCT p, CATEGORY c WHERE p.product_name = 'Nimbus Slate 13 Ultra' AND c.category_name = 'Laptops'
UNION ALL
SELECT p.product_id, c.category_id FROM PRODUCT p, CATEGORY c WHERE p.product_name = 'EchoWave Buds Pro' AND c.category_name = 'Audio Devices'
UNION ALL
SELECT p.product_id, c.category_id FROM PRODUCT p, CATEGORY c WHERE p.product_name = 'EchoWave Buds Lite' AND c.category_name = 'Audio Devices'
UNION ALL
SELECT p.product_id, c.category_id FROM PRODUCT p, CATEGORY c WHERE p.product_name = 'PulseAudio Over-Ear X1' AND c.category_name = 'Audio Devices'
UNION ALL
SELECT p.product_id, c.category_id FROM PRODUCT p, CATEGORY c WHERE p.product_name = 'PulseAudio Speaker Mini' AND c.category_name = 'Audio Devices'
UNION ALL
SELECT p.product_id, c.category_id FROM PRODUCT p, CATEGORY c WHERE p.product_name = 'Orbit Watch S2' AND c.category_name = 'Wearables'
UNION ALL
SELECT p.product_id, c.category_id FROM PRODUCT p, CATEGORY c WHERE p.product_name = 'Orbit Watch S2 Sport' AND c.category_name = 'Wearables'
UNION ALL
SELECT p.product_id, c.category_id FROM PRODUCT p, CATEGORY c WHERE p.product_name = 'Zenith Fit Band 3' AND c.category_name = 'Wearables'
UNION ALL
SELECT p.product_id, c.category_id FROM PRODUCT p, CATEGORY c WHERE p.product_name = 'Zenith Fit Band 3 Kids' AND c.category_name = 'Wearables'
UNION ALL
SELECT p.product_id, c.category_id FROM PRODUCT p, CATEGORY c WHERE p.product_name = 'HomeSense Hub Mini' AND c.category_name = 'Smart Home'
UNION ALL
SELECT p.product_id, c.category_id FROM PRODUCT p, CATEGORY c WHERE p.product_name = 'HomeSense Smart Plug' AND c.category_name = 'Smart Home'
UNION ALL
SELECT p.product_id, c.category_id FROM PRODUCT p, CATEGORY c WHERE p.product_name = 'HomeSense Security Cam' AND c.category_name = 'Smart Home'
UNION ALL
SELECT p.product_id, c.category_id FROM PRODUCT p, CATEGORY c WHERE p.product_name = 'HomeSense Smart Bulb Pack' AND c.category_name = 'Smart Home'
UNION ALL
SELECT p.product_id, c.category_id FROM PRODUCT p, CATEGORY c WHERE p.product_name = 'PlayForge Controller X' AND c.category_name = 'Gaming'
UNION ALL
SELECT p.product_id, c.category_id FROM PRODUCT p, CATEGORY c WHERE p.product_name = 'PlayForge Headset Elite' AND c.category_name = 'Gaming'
UNION ALL
SELECT p.product_id, c.category_id FROM PRODUCT p, CATEGORY c WHERE p.product_name = 'GearUp Gaming Mouse' AND c.category_name = 'Gaming'
UNION ALL
SELECT p.product_id, c.category_id FROM PRODUCT p, CATEGORY c WHERE p.product_name = 'GearUp Mechanical Keyboard' AND c.category_name = 'Gaming'
UNION ALL
SELECT p.product_id, c.category_id FROM PRODUCT p, CATEGORY c WHERE p.product_name = 'LensCraft ActionCam 4K' AND c.category_name = 'Cameras'
UNION ALL
SELECT p.product_id, c.category_id FROM PRODUCT p, CATEGORY c WHERE p.product_name = 'LensCraft Mirrorless M100' AND c.category_name = 'Cameras'
UNION ALL
SELECT p.product_id, c.category_id FROM PRODUCT p, CATEGORY c WHERE p.product_name = 'ClearView Webcam HD' AND c.category_name = 'Cameras'
UNION ALL
SELECT p.product_id, c.category_id FROM PRODUCT p, CATEGORY c WHERE p.product_name = 'ClearView Instant Print Cam' AND c.category_name = 'Cameras'
UNION ALL
SELECT p.product_id, c.category_id FROM PRODUCT p, CATEGORY c WHERE p.product_name = 'PowerCore 10000 Power Bank' AND c.category_name = 'Accessories'
UNION ALL
SELECT p.product_id, c.category_id FROM PRODUCT p, CATEGORY c WHERE p.product_name = 'PowerCore Wireless Charger Pad' AND c.category_name = 'Accessories'
UNION ALL
SELECT p.product_id, c.category_id FROM PRODUCT p, CATEGORY c WHERE p.product_name = 'CablePro USB-C Cable 2m' AND c.category_name = 'Accessories'
UNION ALL
SELECT p.product_id, c.category_id FROM PRODUCT p, CATEGORY c WHERE p.product_name = 'CasePro Phone Case Universal' AND c.category_name = 'Accessories'
UNION ALL
SELECT p.product_id, c.category_id FROM PRODUCT p, CATEGORY c WHERE p.product_name = 'BrightBlocks Starter Set' AND c.category_name = 'Toys'
UNION ALL
SELECT p.product_id, c.category_id FROM PRODUCT p, CATEGORY c WHERE p.product_name = 'BrightBlocks Mega Set' AND c.category_name = 'Toys'
UNION ALL
SELECT p.product_id, c.category_id FROM PRODUCT p, CATEGORY c WHERE p.product_name = 'ZoomRacer RC Car' AND c.category_name = 'Toys'
UNION ALL
SELECT p.product_id, c.category_id FROM PRODUCT p, CATEGORY c WHERE p.product_name = 'ZoomRacer RC Truck' AND c.category_name = 'Toys'
UNION ALL
SELECT p.product_id, c.category_id FROM PRODUCT p, CATEGORY c WHERE p.product_name = 'LearnSpark Coding Robot' AND c.category_name = 'Educational Toys'
UNION ALL
SELECT p.product_id, c.category_id FROM PRODUCT p, CATEGORY c WHERE p.product_name = 'LearnSpark Math Puzzle Set' AND c.category_name = 'Educational Toys'
UNION ALL
SELECT p.product_id, c.category_id FROM PRODUCT p, CATEGORY c WHERE p.product_name = 'SmartKid Tablet Jr' AND c.category_name = 'Educational Toys'
UNION ALL
SELECT p.product_id, c.category_id FROM PRODUCT p, CATEGORY c WHERE p.product_name = 'SmartKid Globe Explorer' AND c.category_name = 'Educational Toys';

-- -----------------------------------------------------------------
-- Step 4: VARIANT (>= 1 per product, unique SKU, price > 0, stock >= 0)
-- -----------------------------------------------------------------
INSERT INTO VARIANT (product_id, sku, variant_name, colour, memory_size, price, stock_quantity, status)
SELECT p.product_id, 'BB-0001', 'TechNova Pulse 12 Black 128GB', 'Black', '128GB', 899.00, 15, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'TechNova Pulse 12'
UNION ALL
SELECT p.product_id, 'BB-0002', 'TechNova Pulse 12 Black 256GB', 'Black', '256GB', 939.00, 20, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'TechNova Pulse 12'
UNION ALL
SELECT p.product_id, 'BB-0003', 'TechNova Pulse 12 White 128GB', 'White', '128GB', 899.00, 25, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'TechNova Pulse 12'
UNION ALL
SELECT p.product_id, 'BB-0004', 'TechNova Pulse 12 White 256GB', 'White', '256GB', 939.00, 30, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'TechNova Pulse 12'
UNION ALL
SELECT p.product_id, 'BB-0005', 'TechNova Pulse 12 Mini Black 128GB', 'Black', '128GB', 749.00, 15, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'TechNova Pulse 12 Mini'
UNION ALL
SELECT p.product_id, 'BB-0006', 'TechNova Pulse 12 Mini Black 256GB', 'Black', '256GB', 789.00, 20, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'TechNova Pulse 12 Mini'
UNION ALL
SELECT p.product_id, 'BB-0007', 'TechNova Pulse 12 Mini White 128GB', 'White', '128GB', 749.00, 25, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'TechNova Pulse 12 Mini'
UNION ALL
SELECT p.product_id, 'BB-0008', 'TechNova Pulse 12 Mini White 256GB', 'White', '256GB', 789.00, 30, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'TechNova Pulse 12 Mini'
UNION ALL
SELECT p.product_id, 'BB-0009', 'Solaris Orbit S5 Black 128GB', 'Black', '128GB', 549.00, 15, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'Solaris Orbit S5'
UNION ALL
SELECT p.product_id, 'BB-0010', 'Solaris Orbit S5 Black 256GB', 'Black', '256GB', 589.00, 20, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'Solaris Orbit S5'
UNION ALL
SELECT p.product_id, 'BB-0011', 'Solaris Orbit S5 White 128GB', 'White', '128GB', 549.00, 25, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'Solaris Orbit S5'
UNION ALL
SELECT p.product_id, 'BB-0012', 'Solaris Orbit S5 White 256GB', 'White', '256GB', 589.00, 30, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'Solaris Orbit S5'
UNION ALL
SELECT p.product_id, 'BB-0013', 'Solaris Orbit S5 Lite Black 128GB', 'Black', '128GB', 379.00, 15, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'Solaris Orbit S5 Lite'
UNION ALL
SELECT p.product_id, 'BB-0014', 'Solaris Orbit S5 Lite Black 256GB', 'Black', '256GB', 419.00, 20, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'Solaris Orbit S5 Lite'
UNION ALL
SELECT p.product_id, 'BB-0015', 'Solaris Orbit S5 Lite White 128GB', 'White', '128GB', 379.00, 25, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'Solaris Orbit S5 Lite'
UNION ALL
SELECT p.product_id, 'BB-0016', 'Solaris Orbit S5 Lite White 256GB', 'White', '256GB', 419.00, 30, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'Solaris Orbit S5 Lite'
UNION ALL
SELECT p.product_id, 'BB-0017', 'Vertex Book Air 14 Black 128GB', 'Black', '128GB', 999.00, 15, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'Vertex Book Air 14'
UNION ALL
SELECT p.product_id, 'BB-0018', 'Vertex Book Air 14 Black 256GB', 'Black', '256GB', 1039.00, 20, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'Vertex Book Air 14'
UNION ALL
SELECT p.product_id, 'BB-0019', 'Vertex Book Air 14 White 128GB', 'White', '128GB', 999.00, 25, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'Vertex Book Air 14'
UNION ALL
SELECT p.product_id, 'BB-0020', 'Vertex Book Air 14 White 256GB', 'White', '256GB', 1039.00, 30, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'Vertex Book Air 14'
UNION ALL
SELECT p.product_id, 'BB-0021', 'Vertex Book Pro 16 Black 128GB', 'Black', '128GB', 1699.00, 15, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'Vertex Book Pro 16'
UNION ALL
SELECT p.product_id, 'BB-0022', 'Vertex Book Pro 16 Black 256GB', 'Black', '256GB', 1739.00, 20, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'Vertex Book Pro 16'
UNION ALL
SELECT p.product_id, 'BB-0023', 'Vertex Book Pro 16 White 128GB', 'White', '128GB', 1699.00, 25, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'Vertex Book Pro 16'
UNION ALL
SELECT p.product_id, 'BB-0024', 'Vertex Book Pro 16 White 256GB', 'White', '256GB', 1739.00, 30, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'Vertex Book Pro 16'
UNION ALL
SELECT p.product_id, 'BB-0025', 'Nimbus Slate 13 Black 128GB', 'Black', '128GB', 899.00, 15, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'Nimbus Slate 13'
UNION ALL
SELECT p.product_id, 'BB-0026', 'Nimbus Slate 13 Black 256GB', 'Black', '256GB', 939.00, 20, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'Nimbus Slate 13'
UNION ALL
SELECT p.product_id, 'BB-0027', 'Nimbus Slate 13 White 128GB', 'White', '128GB', 899.00, 25, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'Nimbus Slate 13'
UNION ALL
SELECT p.product_id, 'BB-0028', 'Nimbus Slate 13 White 256GB', 'White', '256GB', 939.00, 30, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'Nimbus Slate 13'
UNION ALL
SELECT p.product_id, 'BB-0029', 'Nimbus Slate 13 Ultra Black 128GB', 'Black', '128GB', 1199.00, 15, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'Nimbus Slate 13 Ultra'
UNION ALL
SELECT p.product_id, 'BB-0030', 'Nimbus Slate 13 Ultra Black 256GB', 'Black', '256GB', 1239.00, 20, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'Nimbus Slate 13 Ultra'
UNION ALL
SELECT p.product_id, 'BB-0031', 'Nimbus Slate 13 Ultra White 128GB', 'White', '128GB', 1199.00, 25, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'Nimbus Slate 13 Ultra'
UNION ALL
SELECT p.product_id, 'BB-0032', 'Nimbus Slate 13 Ultra White 256GB', 'White', '256GB', 1239.00, 30, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'Nimbus Slate 13 Ultra'
UNION ALL
SELECT p.product_id, 'BB-0033', 'EchoWave Buds Pro Black', 'Black', NULL, 179.00, 20, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'EchoWave Buds Pro'
UNION ALL
SELECT p.product_id, 'BB-0034', 'EchoWave Buds Pro White', 'White', NULL, 179.00, 25, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'EchoWave Buds Pro'
UNION ALL
SELECT p.product_id, 'BB-0035', 'EchoWave Buds Pro Blue', 'Blue', NULL, 179.00, 30, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'EchoWave Buds Pro'
UNION ALL
SELECT p.product_id, 'BB-0036', 'EchoWave Buds Lite Black', 'Black', NULL, 79.00, 20, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'EchoWave Buds Lite'
UNION ALL
SELECT p.product_id, 'BB-0037', 'EchoWave Buds Lite White', 'White', NULL, 79.00, 25, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'EchoWave Buds Lite'
UNION ALL
SELECT p.product_id, 'BB-0038', 'EchoWave Buds Lite Blue', 'Blue', NULL, 79.00, 30, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'EchoWave Buds Lite'
UNION ALL
SELECT p.product_id, 'BB-0039', 'PulseAudio Over-Ear X1 Black', 'Black', NULL, 149.00, 20, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'PulseAudio Over-Ear X1'
UNION ALL
SELECT p.product_id, 'BB-0040', 'PulseAudio Over-Ear X1 White', 'White', NULL, 149.00, 25, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'PulseAudio Over-Ear X1'
UNION ALL
SELECT p.product_id, 'BB-0041', 'PulseAudio Over-Ear X1 Blue', 'Blue', NULL, 149.00, 30, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'PulseAudio Over-Ear X1'
UNION ALL
SELECT p.product_id, 'BB-0042', 'PulseAudio Speaker Mini Black', 'Black', NULL, 59.00, 20, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'PulseAudio Speaker Mini'
UNION ALL
SELECT p.product_id, 'BB-0043', 'PulseAudio Speaker Mini White', 'White', NULL, 59.00, 25, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'PulseAudio Speaker Mini'
UNION ALL
SELECT p.product_id, 'BB-0044', 'PulseAudio Speaker Mini Blue', 'Blue', NULL, 59.00, 30, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'PulseAudio Speaker Mini'
UNION ALL
SELECT p.product_id, 'BB-0045', 'Orbit Watch S2 Black', 'Black', NULL, 249.00, 20, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'Orbit Watch S2'
UNION ALL
SELECT p.product_id, 'BB-0046', 'Orbit Watch S2 White', 'White', NULL, 249.00, 25, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'Orbit Watch S2'
UNION ALL
SELECT p.product_id, 'BB-0047', 'Orbit Watch S2 Blue', 'Blue', NULL, 249.00, 30, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'Orbit Watch S2'
UNION ALL
SELECT p.product_id, 'BB-0048', 'Orbit Watch S2 Sport Black', 'Black', NULL, 279.00, 20, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'Orbit Watch S2 Sport'
UNION ALL
SELECT p.product_id, 'BB-0049', 'Orbit Watch S2 Sport White', 'White', NULL, 279.00, 25, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'Orbit Watch S2 Sport'
UNION ALL
SELECT p.product_id, 'BB-0050', 'Orbit Watch S2 Sport Blue', 'Blue', NULL, 279.00, 30, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'Orbit Watch S2 Sport'
UNION ALL
SELECT p.product_id, 'BB-0051', 'Zenith Fit Band 3 Black', 'Black', NULL, 59.00, 20, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'Zenith Fit Band 3'
UNION ALL
SELECT p.product_id, 'BB-0052', 'Zenith Fit Band 3 White', 'White', NULL, 59.00, 25, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'Zenith Fit Band 3'
UNION ALL
SELECT p.product_id, 'BB-0053', 'Zenith Fit Band 3 Blue', 'Blue', NULL, 59.00, 30, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'Zenith Fit Band 3'
UNION ALL
SELECT p.product_id, 'BB-0054', 'Zenith Fit Band 3 Kids Black', 'Black', NULL, 49.00, 20, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'Zenith Fit Band 3 Kids'
UNION ALL
SELECT p.product_id, 'BB-0055', 'Zenith Fit Band 3 Kids White', 'White', NULL, 49.00, 25, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'Zenith Fit Band 3 Kids'
UNION ALL
SELECT p.product_id, 'BB-0056', 'Zenith Fit Band 3 Kids Blue', 'Blue', NULL, 49.00, 30, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'Zenith Fit Band 3 Kids'
UNION ALL
SELECT p.product_id, 'BB-0057', 'HomeSense Hub Mini Default', NULL, NULL, 89.00, 25, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'HomeSense Hub Mini'
UNION ALL
SELECT p.product_id, 'BB-0058', 'HomeSense Smart Plug Default', NULL, NULL, 19.00, 25, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'HomeSense Smart Plug'
UNION ALL
SELECT p.product_id, 'BB-0059', 'HomeSense Security Cam Default', NULL, NULL, 69.00, 25, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'HomeSense Security Cam'
UNION ALL
SELECT p.product_id, 'BB-0060', 'HomeSense Smart Bulb Pack Default', NULL, NULL, 39.00, 25, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'HomeSense Smart Bulb Pack'
UNION ALL
SELECT p.product_id, 'BB-0061', 'PlayForge Controller X Black', 'Black', NULL, 69.00, 20, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'PlayForge Controller X'
UNION ALL
SELECT p.product_id, 'BB-0062', 'PlayForge Controller X White', 'White', NULL, 69.00, 25, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'PlayForge Controller X'
UNION ALL
SELECT p.product_id, 'BB-0063', 'PlayForge Controller X Blue', 'Blue', NULL, 69.00, 30, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'PlayForge Controller X'
UNION ALL
SELECT p.product_id, 'BB-0064', 'PlayForge Headset Elite Default', NULL, NULL, 99.00, 25, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'PlayForge Headset Elite'
UNION ALL
SELECT p.product_id, 'BB-0065', 'GearUp Gaming Mouse Default', NULL, NULL, 49.00, 25, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'GearUp Gaming Mouse'
UNION ALL
SELECT p.product_id, 'BB-0066', 'GearUp Mechanical Keyboard Default', NULL, NULL, 119.00, 25, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'GearUp Mechanical Keyboard'
UNION ALL
SELECT p.product_id, 'BB-0067', 'LensCraft ActionCam 4K Default', NULL, NULL, 199.00, 25, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'LensCraft ActionCam 4K'
UNION ALL
SELECT p.product_id, 'BB-0068', 'LensCraft Mirrorless M100 Black', 'Black', NULL, 649.00, 20, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'LensCraft Mirrorless M100'
UNION ALL
SELECT p.product_id, 'BB-0069', 'LensCraft Mirrorless M100 White', 'White', NULL, 649.00, 25, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'LensCraft Mirrorless M100'
UNION ALL
SELECT p.product_id, 'BB-0070', 'LensCraft Mirrorless M100 Blue', 'Blue', NULL, 649.00, 30, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'LensCraft Mirrorless M100'
UNION ALL
SELECT p.product_id, 'BB-0071', 'ClearView Webcam HD Default', NULL, NULL, 45.00, 25, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'ClearView Webcam HD'
UNION ALL
SELECT p.product_id, 'BB-0072', 'ClearView Instant Print Cam Black', 'Black', NULL, 89.00, 20, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'ClearView Instant Print Cam'
UNION ALL
SELECT p.product_id, 'BB-0073', 'ClearView Instant Print Cam White', 'White', NULL, 89.00, 25, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'ClearView Instant Print Cam'
UNION ALL
SELECT p.product_id, 'BB-0074', 'ClearView Instant Print Cam Blue', 'Blue', NULL, 89.00, 30, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'ClearView Instant Print Cam'
UNION ALL
SELECT p.product_id, 'BB-0075', 'PowerCore 10000 Power Bank Black', 'Black', NULL, 29.00, 20, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'PowerCore 10000 Power Bank'
UNION ALL
SELECT p.product_id, 'BB-0076', 'PowerCore 10000 Power Bank White', 'White', NULL, 29.00, 25, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'PowerCore 10000 Power Bank'
UNION ALL
SELECT p.product_id, 'BB-0077', 'PowerCore 10000 Power Bank Blue', 'Blue', NULL, 29.00, 30, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'PowerCore 10000 Power Bank'
UNION ALL
SELECT p.product_id, 'BB-0078', 'PowerCore Wireless Charger Pad Default', NULL, NULL, 24.00, 25, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'PowerCore Wireless Charger Pad'
UNION ALL
SELECT p.product_id, 'BB-0079', 'CablePro USB-C Cable 2m Default', NULL, NULL, 12.00, 25, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'CablePro USB-C Cable 2m'
UNION ALL
SELECT p.product_id, 'BB-0080', 'CasePro Phone Case Universal Black', 'Black', NULL, 15.00, 20, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'CasePro Phone Case Universal'
UNION ALL
SELECT p.product_id, 'BB-0081', 'CasePro Phone Case Universal White', 'White', NULL, 15.00, 25, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'CasePro Phone Case Universal'
UNION ALL
SELECT p.product_id, 'BB-0082', 'CasePro Phone Case Universal Blue', 'Blue', NULL, 15.00, 30, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'CasePro Phone Case Universal'
UNION ALL
SELECT p.product_id, 'BB-0083', 'BrightBlocks Starter Set Default', NULL, NULL, 29.00, 25, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'BrightBlocks Starter Set'
UNION ALL
SELECT p.product_id, 'BB-0084', 'BrightBlocks Mega Set Default', NULL, NULL, 59.00, 25, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'BrightBlocks Mega Set'
UNION ALL
SELECT p.product_id, 'BB-0085', 'ZoomRacer RC Car Black', 'Black', NULL, 39.00, 20, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'ZoomRacer RC Car'
UNION ALL
SELECT p.product_id, 'BB-0086', 'ZoomRacer RC Car White', 'White', NULL, 39.00, 25, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'ZoomRacer RC Car'
UNION ALL
SELECT p.product_id, 'BB-0087', 'ZoomRacer RC Car Blue', 'Blue', NULL, 39.00, 30, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'ZoomRacer RC Car'
UNION ALL
SELECT p.product_id, 'BB-0088', 'ZoomRacer RC Truck Black', 'Black', NULL, 49.00, 20, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'ZoomRacer RC Truck'
UNION ALL
SELECT p.product_id, 'BB-0089', 'ZoomRacer RC Truck White', 'White', NULL, 49.00, 25, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'ZoomRacer RC Truck'
UNION ALL
SELECT p.product_id, 'BB-0090', 'ZoomRacer RC Truck Blue', 'Blue', NULL, 49.00, 30, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'ZoomRacer RC Truck'
UNION ALL
SELECT p.product_id, 'BB-0091', 'LearnSpark Coding Robot Default', NULL, NULL, 79.00, 25, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'LearnSpark Coding Robot'
UNION ALL
SELECT p.product_id, 'BB-0092', 'LearnSpark Math Puzzle Set Default', NULL, NULL, 22.00, 25, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'LearnSpark Math Puzzle Set'
UNION ALL
SELECT p.product_id, 'BB-0093', 'SmartKid Tablet Jr Default', NULL, NULL, 89.00, 25, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'SmartKid Tablet Jr'
UNION ALL
SELECT p.product_id, 'BB-0094', 'SmartKid Globe Explorer Default', NULL, NULL, 34.00, 25, 'ACTIVE' FROM PRODUCT p WHERE p.product_name = 'SmartKid Globe Explorer';

-- -----------------------------------------------------------------
-- Step 5: CUSTOMER (sample accounts for testing checkout/order-history)
-- NOTE: password_hash values below are PLACEHOLDERS, not real bcrypt
-- hashes (this sandbox has no network access to install bcrypt).
-- Before using these for login testing, generate real hashes with:
--   node -e "require('bcrypt').hash('Password123!',10).then(console.log)"
-- (bcrypt is already a dependency in package.json) and replace the
-- values below.
-- -----------------------------------------------------------------
INSERT INTO CUSTOMER (full_name, email, password_hash, phone, address, city) VALUES
  ('Nimal Perera', 'nimal.perera@example.com', '$2b$10$PLACEHOLDERHASHVALUE0000000000000000000000000000000u', '0771234567', '12 Galle Road', 'Colombo'),
  ('Sanduni Fernando', 'sanduni.fernando@example.com', '$2b$10$PLACEHOLDERHASHVALUE0000000000000000000000000000000u', '0712345678', '45 Kandy Road', 'Kandy'),
  ('Kasun Silva', 'kasun.silva@example.com', '$2b$10$PLACEHOLDERHASHVALUE0000000000000000000000000000000u', '0723456789', '8 Main Street', 'Galle'),
  ('Ishara Jayawardena', 'ishara.j@example.com', '$2b$10$PLACEHOLDERHASHVALUE0000000000000000000000000000000u', '0754567890', '21 Temple Lane', 'Negombo'),
  ('Ruwan Bandara', 'ruwan.bandara@example.com', '$2b$10$PLACEHOLDERHASHVALUE0000000000000000000000000000000u', '0765678901', '3 Lake Road', 'Kurunegala');

COMMIT;

-- =====================================================================
-- Step 6 (DEFERRED): sample CUSTOMER_ORDER / ORDER_ITEM / PAYMENT /
-- DELIVERY rows.
--
-- Per the build guide, these MUST be created only via sp_PlaceOrder
-- (Task 4), never by direct INSERT -- so they cannot be seeded until
-- that procedure exists. Once Task 4 is merged, run something like:
--
--   CALL sp_PlaceOrder(
--     <customer_id>, <cart_id>, 'STANDARD_DELIVERY',
--     '12 Galle Road, Colombo', 'Colombo', 'CASH_ON_DELIVERY'
--   );
--
-- which requires first creating a CART and CART_ITEM row(s) for that
-- customer (a normal, direct INSERT is fine for CART/CART_ITEM --
-- only CUSTOMER_ORDER and its children are restricted to sp_PlaceOrder).
-- =====================================================================

-- =====================================================================
-- OPTIONAL: main-cities reference list (Houston, Dallas, Austin,
-- San Antonio, Fort Worth) used by fn_calculate_delivery_estimate (Task 3).
--
-- Task 1's table list (CATEGORY, PRODUCT, PRODUCT_CATEGORY, VARIANT,
-- CUSTOMER, CART, CART_ITEM, CUSTOMER_ORDER, ORDER_ITEM, PAYMENT,
-- DELIVERY, STOCK_ADJUSTMENT) does NOT include a main-city lookup table.
-- CHECK WITH WHOEVER BUILT TASK 1 before running this block:
--   - If they added a MAIN_CITY table as a schema extension, uncomment
--     and adjust the INSERT below to match their exact column names.
--   - If not, skip this entirely -- the 5-city list can just live as
--     inline literals inside fn_calculate_delivery_estimate (Task 3),
--     which is explicitly allowed as a fallback per the guide.
-- =====================================================================
-- INSERT INTO MAIN_CITY (city_name) VALUES
--   ('Houston'), ('Dallas'), ('Austin'), ('San Antonio'), ('Fort Worth');

-- =====================================================================
-- Step 7: Verification queries -- run these after the script completes
-- =====================================================================
SELECT COUNT(*) AS category_count FROM CATEGORY;                 -- expect >= 10
SELECT COUNT(*) AS product_count FROM PRODUCT;                   -- expect >= 40

-- Every product must have at least 1 VARIANT row:
SELECT p.product_id, p.product_name
FROM PRODUCT p
LEFT JOIN VARIANT v ON v.product_id = p.product_id
WHERE v.variant_id IS NULL;                                      -- expect 0 rows

-- Every product must have at least 1 PRODUCT_CATEGORY row:
SELECT p.product_id, p.product_name
FROM PRODUCT p
LEFT JOIN PRODUCT_CATEGORY pc ON pc.product_id = p.product_id
WHERE pc.category_id IS NULL;                                    -- expect 0 rows

-- Every category must have at least 1 product:
SELECT c.category_id, c.category_name
FROM CATEGORY c
LEFT JOIN PRODUCT_CATEGORY pc ON pc.category_id = c.category_id
WHERE pc.product_id IS NULL;                                     -- expect 0 rows