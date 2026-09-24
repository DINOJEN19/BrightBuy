-- =====================================================================
-- BrightBuy MIMS Database - Task 3: Business Logic & Triggers
-- File: 03_functions_triggers.sql
-- Run AFTER 01_schema.sql (needs VARIANT and MAIN_CITY tables).
-- Engine: MySQL 8.0 (InnoDB)
-- =====================================================================

USE brightbuy;

-- ---------------------------------------------------------------------
-- Prerequisite: main-cities reference data (MAIN_CITY was added to the
-- schema as an extension). INSERT IGNORE makes this safe to re-run
-- because city_name is UNIQUE. If you uncomment the same block in
-- 02_seeds.sql, you can delete this one.
-- ---------------------------------------------------------------------
INSERT IGNORE INTO MAIN_CITY (city_name) VALUES
  ('Houston'),
  ('Dallas'),
  ('Austin'),
  ('San Antonio'),
  ('Fort Worth');

DELIMITER $$

-- =====================================================================
-- FUNCTION: fn_calculate_delivery_estimate
-- Returns today's date + delivery days:
--   main city  -> 5 days,  other city -> 7 days
--   not all items in stock -> +3 days
-- =====================================================================
DROP FUNCTION IF EXISTS fn_calculate_delivery_estimate$$

CREATE FUNCTION fn_calculate_delivery_estimate(
    p_destination_city   VARCHAR(80),
    p_all_items_in_stock BOOLEAN
)
RETURNS DATE
NOT DETERMINISTIC          -- depends on CURDATE()
READS SQL DATA             -- reads MAIN_CITY
BEGIN
    DECLARE v_base_days INT;

    -- Step 1: main city (5 days) or other city (7 days)
    IF EXISTS (
        SELECT 1
        FROM MAIN_CITY
        WHERE city_name = TRIM(p_destination_city)
    ) THEN
        SET v_base_days = 5;
    ELSE
        SET v_base_days = 7;
    END IF;

    -- Step 2: out-of-stock penalty (NULL is treated as "not in stock")
    IF p_all_items_in_stock IS NULL OR p_all_items_in_stock = FALSE THEN
        SET v_base_days = v_base_days + 3;
    END IF;

    -- Steps 3 & 4: today + base_days
    RETURN DATE_ADD(CURDATE(), INTERVAL v_base_days DAY);
END$$


-- =====================================================================
-- TRIGGER: trg_prevent_negative_stock (BEFORE UPDATE)
-- Only fires its check when stock_quantity is actually changing.
-- BEFORE triggers run ahead of CHECK constraints, so callers get
-- BrightBuy's message instead of the generic CHECK violation.
-- =====================================================================
DROP TRIGGER IF EXISTS trg_prevent_negative_stock$$

CREATE TRIGGER trg_prevent_negative_stock
BEFORE UPDATE ON VARIANT
FOR EACH ROW
BEGIN
    IF NOT (NEW.stock_quantity <=> OLD.stock_quantity)
       AND NEW.stock_quantity < 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Stock adjustment rejected: resulting stock quantity cannot fall below zero.';
    END IF;
END$$


-- =====================================================================
-- TRIGGER: trg_prevent_negative_stock_insert (BEFORE INSERT)
-- MySQL does not allow one trigger for both events, so INSERT gets its
-- own trigger with the same guard and the same message.
-- =====================================================================
DROP TRIGGER IF EXISTS trg_prevent_negative_stock_insert$$

CREATE TRIGGER trg_prevent_negative_stock_insert
BEFORE INSERT ON VARIANT
FOR EACH ROW
BEGIN
    IF NEW.stock_quantity < 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Stock adjustment rejected: resulting stock quantity cannot fall below zero.';
    END IF;
END$$

DELIMITER ;
