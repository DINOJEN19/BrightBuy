-- Local development only: two usable roles. Password: BrightBuy123!
USE brightbuy;
INSERT INTO CUSTOMER (full_name,email,password_hash,phone,address,city,role) VALUES
('Demo Customer','customer@brightbuy.test','$2b$10$X4.ILp/qi7UYACDryNbb.OjegYpPQQqr8eHpOAf8.sL4e2tunir92','5125550199','100 Demo Street','Austin','CUSTOMER'),
('Demo Admin','admin@brightbuy.test','$2b$10$X4.ILp/qi7UYACDryNbb.OjegYpPQQqr8eHpOAf8.sL4e2tunir92','5125550199','100 Demo Street','Austin','ADMIN')
ON DUPLICATE KEY UPDATE email=VALUES(email);
