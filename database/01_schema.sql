-- =============================================================================
-- BrightBuy Database Systems Project
-- Engine: MySQL 8.0 (InnoDB)
-- =============================================================================

USE brightbuy;


-- 1. CATEGORY: Product category lookup
CREATE TABLE CATEGORY (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(60) NOT NULL UNIQUE,
    description VARCHAR(255) NULL
) ENGINE = InnoDB;

-- 2. PRODUCT: Catalogue master records
CREATE TABLE PRODUCT (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(150) NOT NULL,
    description VARCHAR(1000) NULL,
    brand VARCHAR(80) NULL,
    status ENUM('ACTIVE', 'DISCONTINUED') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;

-- 3. PRODUCT_CATEGORY: Composite junction table (Product <-> Category)
CREATE TABLE PRODUCT_CATEGORY (
    product_id INT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (product_id, category_id),
    CONSTRAINT fk_pc_product 
        FOREIGN KEY (product_id) REFERENCES PRODUCT(product_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_pc_category 
        FOREIGN KEY (category_id) REFERENCES CATEGORY(category_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

-- 4. VARIANT: Purchasable versions of products (price and inventory holder)
CREATE TABLE VARIANT (
    variant_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    sku VARCHAR(40) NOT NULL UNIQUE,
    variant_name VARCHAR(100) NOT NULL,
    colour VARCHAR(40) NULL,
    memory_size VARCHAR(40) NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    status ENUM('ACTIVE', 'DISCONTINUED') NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT chk_variant_price_positive CHECK (price > 0),
    CONSTRAINT chk_variant_stock_nonneg CHECK (stock_quantity >= 0),
    CONSTRAINT fk_variant_product 
        FOREIGN KEY (product_id) REFERENCES PRODUCT(product_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

-- 5. CUSTOMER: Registered user profiles
CREATE TABLE CUSTOMER (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(80) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;

-- 6. CART: Active shopping carts for registered customers
CREATE TABLE CART (
    cart_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    cart_status ENUM('ACTIVE', 'CHECKED_OUT', 'ABANDONED') NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT fk_cart_customer 
        FOREIGN KEY (customer_id) REFERENCES CUSTOMER(customer_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

-- 7. CART_ITEM: Line items in a customer's cart
CREATE TABLE CART_ITEM (
    cart_item_id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT NOT NULL,
    variant_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    CONSTRAINT chk_cart_item_quantity_positive CHECK (quantity > 0),
    CONSTRAINT fk_cart_item_cart 
        FOREIGN KEY (cart_id) REFERENCES CART(cart_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_cart_item_variant 
        FOREIGN KEY (variant_id) REFERENCES VARIANT(variant_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

-- 8. CUSTOMER_ORDER: Confirmed customer orders
CREATE TABLE CUSTOMER_ORDER (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    order_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    order_status ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    total_amount DECIMAL(12, 2) NOT NULL,
    delivery_mode ENUM('STORE_PICKUP', 'STANDARD_DELIVERY') NOT NULL,
    delivery_address VARCHAR(255) NULL,
    destination_city VARCHAR(80) NOT NULL,
    estimated_delivery_date DATE NOT NULL,
    CONSTRAINT chk_order_total_nonneg CHECK (total_amount >= 0),
    CONSTRAINT fk_order_customer 
        FOREIGN KEY (customer_id) REFERENCES CUSTOMER(customer_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

-- 9. ORDER_ITEM: Line items in a confirmed order
CREATE TABLE ORDER_ITEM (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    variant_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    CONSTRAINT chk_order_item_quantity_positive CHECK (quantity > 0),
    CONSTRAINT chk_order_item_unit_price_positive CHECK (unit_price > 0),
    CONSTRAINT chk_order_item_subtotal_nonneg CHECK (subtotal >= 0),
    CONSTRAINT fk_order_item_order 
        FOREIGN KEY (order_id) REFERENCES CUSTOMER_ORDER(order_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_order_item_variant 
        FOREIGN KEY (variant_id) REFERENCES VARIANT(variant_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

-- 10. PAYMENT: Order payment records (1-to-1 with CUSTOMER_ORDER)
CREATE TABLE PAYMENT (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL UNIQUE,
    payment_method ENUM('CASH_ON_DELIVERY', 'CARD_PAYMENT') NOT NULL,
    payment_status ENUM('PENDING', 'PAID', 'FAILED') NOT NULL DEFAULT 'PENDING',
    payment_date DATETIME NULL,
    amount DECIMAL(12, 2) NOT NULL,
    CONSTRAINT chk_payment_amount_nonneg CHECK (amount >= 0),
    CONSTRAINT fk_payment_order 
        FOREIGN KEY (order_id) REFERENCES CUSTOMER_ORDER(order_id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB;

-- 11. DELIVERY: Logistics records (1-to-1 with CUSTOMER_ORDER)
CREATE TABLE DELIVERY (
    delivery_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL UNIQUE,
    delivery_mode ENUM('STORE_PICKUP', 'STANDARD_DELIVERY') NOT NULL,
    destination_city VARCHAR(80) NOT NULL,
    delivery_status ENUM('PENDING', 'DISPATCHED', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    estimated_delivery_date DATE NOT NULL,
    actual_delivery_date DATE NULL,
    CONSTRAINT fk_delivery_order 
        FOREIGN KEY (order_id) REFERENCES CUSTOMER_ORDER(order_id) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB;

-- 12. STOCK_ADJUSTMENT: Audit trail for inventory modifications
CREATE TABLE STOCK_ADJUSTMENT (
    adjustment_id INT AUTO_INCREMENT PRIMARY KEY,
    variant_id INT NOT NULL,
    adjustment_type ENUM('RESTOCK', 'CORRECTION', 'DAMAGE', 'ORDER_DECREMENT') NOT NULL,
    quantity_change INT NOT NULL,
    reason VARCHAR(255) NULL,
    adjustment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_stock_adj_variant 
        FOREIGN KEY (variant_id) REFERENCES VARIANT(variant_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;

-- Reference: Main Texas Cities for Delivery Estimates
CREATE TABLE MAIN_CITY (
    city_id INT AUTO_INCREMENT PRIMARY KEY,
    city_name VARCHAR(80) NOT NULL UNIQUE
) ENGINE = InnoDB;