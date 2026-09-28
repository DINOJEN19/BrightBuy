-- BrightBuy MIMS Database System
-- Task 4: ACID Transactions (04_procedures.sql)
-- Group 15

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_PlaceOrder$$

CREATE PROCEDURE sp_PlaceOrder(
    IN p_customer_id INT,
    IN p_cart_id INT,
    IN p_delivery_mode ENUM('STORE_PICKUP', 'STANDARD_DELIVERY'),
    IN p_delivery_address VARCHAR(255),
    IN p_destination_city VARCHAR(80),
    IN p_payment_method ENUM('CASH_ON_DELIVERY', 'CARD_PAYMENT'),
    OUT p_order_id INT,
    OUT p_estimated_delivery_date DATE
)
PROC_BODY: BEGIN
    -- Variables for validation and calculations
    DECLARE v_cart_customer_id INT;
    DECLARE v_cart_status VARCHAR(20);
    DECLARE v_item_count INT DEFAULT 0;
    DECLARE v_insufficient_stock INT DEFAULT 0;
    DECLARE v_total_amount DECIMAL(12,2) DEFAULT 0.00;
    DECLARE v_all_items_in_stock BOOLEAN DEFAULT TRUE;
    DECLARE v_payment_status ENUM('PENDING', 'PAID', 'FAILED');

    -- SQLEXCEPTION Handler for atomic rollback
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;
    -- =========================================================================
    -- PRECONDITIONS CHECK (Executed before touching or modifying data)
    -- =========================================================================

    -- 1. Validate Cart Ownership & Status
    SELECT customer_id, cart_status 
    INTO v_cart_customer_id, v_cart_status
    FROM CART 
    WHERE cart_id = p_cart_id;

    IF v_cart_customer_id IS NULL OR v_cart_customer_id <> p_customer_id OR v_cart_status <> 'ACTIVE' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Order rejected: cart does not belong to this customer or is not active.';
    END IF;

    -- 2. Validate Cart Content
    SELECT COUNT(*) 
    INTO v_item_count
    FROM CART_ITEM 
    WHERE cart_id = p_cart_id;

    IF v_item_count = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Order rejected: cart is empty.';
    END IF;

    -- 3. Validate Delivery Address
    IF p_delivery_mode = 'STANDARD_DELIVERY' AND (p_delivery_address IS NULL OR TRIM(p_delivery_address) = '') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Order rejected: a delivery address is required for Standard Delivery.';
    END IF;

    -- =========================================================================
    -- TRANSACTIONAL EXECUTION
    -- =========================================================================

    -- Step 2: Lock all referenced VARIANT rows for this cart to prevent race conditions
    SELECT v.variant_id 
    FROM VARIANT v
    JOIN CART_ITEM ci ON v.variant_id = ci.variant_id
    WHERE ci.cart_id = p_cart_id
    FOR UPDATE;

    -- Step 3 & 4: Check if available stock meets requested quantity across all items
    SELECT COUNT(*)
    INTO v_insufficient_stock
    FROM CART_ITEM ci
    JOIN VARIANT v ON ci.variant_id = v.variant_id
    WHERE ci.cart_id = p_cart_id AND ci.quantity > v.stock_quantity;

    IF v_insufficient_stock > 0 THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Order rejected: one or more items no longer have sufficient stock.';
    END IF;

    -- Step 5: Compute total amount snapshot
    SELECT SUM(v.price * ci.quantity)
    INTO v_total_amount
    FROM CART_ITEM ci
    JOIN VARIANT v ON ci.variant_id = v.variant_id
    WHERE ci.cart_id = p_cart_id;

    -- Step 6 & 7: Calculate estimated delivery date using Task 3 function
    SET v_all_items_in_stock = TRUE;
    SET p_estimated_delivery_date = fn_calculate_delivery_estimate(p_destination_city, v_all_items_in_stock);

    -- Step 8: Create CUSTOMER_ORDER record
    INSERT INTO CUSTOMER_ORDER (
        customer_id,
        order_date,
        order_status,
        total_amount,
        delivery_mode,
        delivery_address,
        destination_city,
        estimated_delivery_date
    ) VALUES (
        p_customer_id,
        NOW(),
        'CONFIRMED',
        v_total_amount,
        p_delivery_mode,
        p_delivery_address,
        p_destination_city,
        p_estimated_delivery_date
    );

    SET p_order_id = LAST_INSERT_ID();

    -- Step 9: Insert snapshots into ORDER_ITEM
    INSERT INTO ORDER_ITEM (order_id, variant_id, quantity, unit_price, subtotal)
    SELECT 
        p_order_id,
        ci.variant_id,
        ci.quantity,
        v.price,
        (v.price * ci.quantity)
    FROM CART_ITEM ci
    JOIN VARIANT v ON ci.variant_id = v.variant_id
    WHERE ci.cart_id = p_cart_id;

    -- Step 10: Append audit log into STOCK_ADJUSTMENT
    INSERT INTO STOCK_ADJUSTMENT (variant_id, adjustment_type, quantity_change, reason, adjustment_date)
    SELECT 
        variant_id,
        'ORDER_DECREMENT',
        -quantity,
        CONCAT('Order placement #', p_order_id),
        NOW()
    FROM CART_ITEM
    WHERE cart_id = p_cart_id;

    -- Step 10 (cont.): Decrement VARIANT stock_quantity
    UPDATE VARIANT v
    JOIN CART_ITEM ci ON v.variant_id = ci.variant_id
    SET v.stock_quantity = v.stock_quantity - ci.quantity
    WHERE ci.cart_id = p_cart_id;

    -- Step 11 & 12: Resolve and process payment status
    IF p_payment_method = 'CASH_ON_DELIVERY' THEN
        SET v_payment_status = 'PENDING';
    ELSE
        -- Basic card validation simulation
        SET v_payment_status = 'PAID';
    END IF;

    IF v_payment_status = 'FAILED' THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Order rejected: card payment validation failed.';
    END IF;

    INSERT INTO PAYMENT (order_id, payment_method, payment_status, payment_date, amount)
    VALUES (
        p_order_id,
        p_payment_method,
        v_payment_status,
        IF(v_payment_status = 'PAID', NOW(), NULL),
        v_total_amount
    );

    -- Step 13: Insert DELIVERY tracking record
    INSERT INTO DELIVERY (
        order_id,
        delivery_mode,
        destination_city,
        delivery_status,
        estimated_delivery_date
    ) VALUES (
        p_order_id,
        p_delivery_mode,
        p_destination_city,
        'PENDING',
        p_estimated_delivery_date
    );

    -- Step 14: Mark cart as CHECKED_OUT
    UPDATE CART 
    SET cart_status = 'CHECKED_OUT'
    WHERE cart_id = p_cart_id;

    -- Step 15: Commit transaction
    COMMIT;

END PROC_BODY$$

DELIMITER ;
