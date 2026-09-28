-- =====================================================================
-- BrightBuy MIMS Database - Task 5: Performance & Analytics
-- File: 05_reports_indexes.sql
-- Run AFTER 01_schema.sql, 02_seeds.sql, 03_functions_triggers.sql,
-- and 04_procedures.sql.
-- =====================================================================

USE brightbuy;

-- Section 5.1: Required Indexes

CREATE INDEX idx_prodcat_category ON PRODUCT_CATEGORY(category_id);
CREATE INDEX idx_variant_product ON VARIANT(product_id);
CREATE INDEX idx_cartitem_cart ON CART_ITEM(cart_id);
CREATE INDEX idx_cartitem_variant ON CART_ITEM(variant_id);
CREATE INDEX idx_order_customer ON CUSTOMER_ORDER(customer_id);
CREATE INDEX idx_order_date ON CUSTOMER_ORDER(order_date);
CREATE INDEX idx_order_status ON CUSTOMER_ORDER(order_status);
CREATE INDEX idx_order_dest_city ON CUSTOMER_ORDER(destination_city);
CREATE INDEX idx_orderitem_order ON ORDER_ITEM(order_id);
CREATE INDEX idx_orderitem_variant ON ORDER_ITEM(variant_id);
CREATE INDEX idx_payment_status ON PAYMENT(payment_status);
CREATE INDEX idx_delivery_status ON DELIVERY(delivery_status);
CREATE INDEX idx_delivery_est_date ON DELIVERY(estimated_delivery_date);
CREATE INDEX idx_stockadj_variant ON STOCK_ADJUSTMENT(variant_id);
CREATE INDEX idx_stockadj_date ON STOCK_ADJUSTMENT(adjustment_date);
CREATE INDEX idx_product_name ON PRODUCT(product_name);
CREATE INDEX idx_category_name ON CATEGORY(category_name);

-- Section 5.2: Required Management Reports

DELIMITER $$

-- REPORT 1: Quarterly Sales Report
DROP PROCEDURE IF EXISTS sp_QuarterlySalesReport$$

CREATE PROCEDURE sp_QuarterlySalesReport(
    IN p_year INT
)
BEGIN
    SELECT
        p_year                       AS report_year,
        QUARTER(order_date)          AS sales_quarter,
        COUNT(*)                     AS order_count,
        SUM(total_amount)            AS total_sales
    FROM CUSTOMER_ORDER
    WHERE YEAR(order_date) = p_year
    GROUP BY QUARTER(order_date)
    ORDER BY sales_quarter;
END$$

-- REPORT 2: Top-Selling Products Report

CREATE PROCEDURE sp_TopSellingProducts(
    IN p_start_date DATE,
    IN p_end_date   DATE,
    IN p_limit      INT
)
BEGIN
    SET @top_n = IFNULL(p_limit, 10);

    SET @sql = 'SELECT
                    p.product_id,
                    p.product_name,
                    SUM(oi.quantity)  AS total_quantity_sold,
                    SUM(oi.subtotal)  AS total_revenue
                FROM ORDER_ITEM oi
                JOIN VARIANT v          ON oi.variant_id = v.variant_id
                JOIN PRODUCT p          ON v.product_id = p.product_id
                JOIN CUSTOMER_ORDER co  ON oi.order_id = co.order_id
                WHERE co.order_date BETWEEN ? AND ?
                GROUP BY p.product_id, p.product_name
                ORDER BY total_quantity_sold DESC
                LIMIT ?';

    PREPARE stmt FROM @sql;
    SET @p_start = p_start_date;
    SET @p_end   = p_end_date;
    EXECUTE stmt USING @p_start, @p_end, @top_n;
    DEALLOCATE PREPARE stmt;
END$$

DELIMITER ;


-- REPORT 3: Category-wise Order Count

DROP VIEW IF EXISTS vw_category_order_count;

CREATE VIEW vw_category_order_count AS
SELECT
    c.category_id,
    c.category_name,
    COUNT(DISTINCT oi.order_id) AS order_count
FROM CATEGORY c
JOIN PRODUCT_CATEGORY pc ON pc.category_id = c.category_id
JOIN PRODUCT p           ON p.product_id = pc.product_id
JOIN VARIANT v            ON v.product_id = p.product_id
JOIN ORDER_ITEM oi        ON oi.variant_id = v.variant_id
GROUP BY c.category_id, c.category_name;


-- REPORT 4: Delivery Time Estimates

DROP VIEW IF EXISTS vw_delivery_estimates;

CREATE VIEW vw_delivery_estimates AS
SELECT
    d.delivery_id,
    d.order_id,
    d.delivery_mode,
    d.destination_city,
    d.delivery_status,
    d.estimated_delivery_date
FROM DELIVERY d
WHERE d.delivery_status <> 'DELIVERED';

-- REPORT 5: Customer-wise Order Summary

DROP VIEW IF EXISTS vw_customer_order_summary;

CREATE VIEW vw_customer_order_summary AS
SELECT
    cu.customer_id,
    cu.full_name,
    cu.email,
    pay.payment_status,
    COUNT(co.order_id)       AS order_count,
    SUM(co.total_amount)     AS total_spent
FROM CUSTOMER cu
JOIN CUSTOMER_ORDER co ON co.customer_id = cu.customer_id
JOIN PAYMENT pay       ON pay.order_id = co.order_id
GROUP BY cu.customer_id, cu.full_name, cu.email, pay.payment_status;
