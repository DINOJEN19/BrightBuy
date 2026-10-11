'use strict';

// Initialize a new local database or upgrade an existing BrightBuy database without dropping data.

require('dotenv').config({
    path: require('path').join(__dirname, '../.env')
});

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const sqlRoot = path.join(__dirname, '../../database');

const read = name =>
    fs.readFileSync(path.join(sqlRoot, name), 'utf8')
        .replace(/^DELIMITER\s+.*$/gm, '')
        .replace(/\$\$/g, ';');

(async () => {
    if (process.env.DB_PASSWORD === undefined) {
        throw new Error(
            'DB_PASSWORD is not configured. Copy backend/.env.example to backend/.env and set your MySQL credentials.'
        );
    }

    const db = process.env.DB_NAME || 'brightbuy';

    if (db !== 'brightbuy') {
        throw new Error(
            'The supplied SQL scripts target DB_NAME=brightbuy.'
        );
    }

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD ?? 'root',
        multipleStatements: true
    });

    try {
        await connection.query(
            'CREATE DATABASE IF NOT EXISTS brightbuy'
        );

        await connection.query('USE brightbuy');

        const [[{ count }]] = await connection.query(
            "SELECT COUNT(*) AS count FROM information_schema.tables WHERE table_schema='brightbuy' AND table_name='CUSTOMER'"
        );

        if (!count) {
            for (
                const file of fs.readdirSync(sqlRoot)
                    .filter(name => /^\d+.*\.sql$/.test(name))
                    .sort()
            ) {
                await connection.query(read(file));
                console.log(`Applied ${file}`);
            }
        } else if (process.argv.includes('--upgrade')) {
            await connection.query(read('04_procedures.sql'));

            await connection.query(read('06_demo_accounts.sql'));

            const [[{ present }]] = await connection.query(
                "SELECT COUNT(*) AS present FROM information_schema.columns WHERE table_schema='brightbuy' AND table_name='CART' AND column_name='active_cart_marker'"
            );

            if (!present) {
                await connection.query(
                    "ALTER TABLE CART ADD COLUMN active_cart_marker INT GENERATED ALWAYS AS (CASE WHEN cart_status='ACTIVE' THEN 1 ELSE NULL END) STORED, ADD UNIQUE KEY uq_active_customer_cart(customer_id,active_cart_marker)"
                );
            }

            const [[{ indexed }]] = await connection.query(
                "SELECT COUNT(*) AS indexed FROM information_schema.statistics WHERE table_schema='brightbuy' AND table_name='CART_ITEM' AND index_name='uq_cart_variant'"
            );

            if (!indexed) {
                await connection.query(
                    'ALTER TABLE CART_ITEM ADD UNIQUE KEY uq_cart_variant(cart_id,variant_id)'
                );
            }

            const reports = read('05_reports_indexes.sql');

            const start = reports.indexOf(
                'DROP PROCEDURE IF EXISTS sp_TopSellingProducts'
            );

            const end = reports.indexOf('-- REPORT 3:', start);

            await connection.query(reports.slice(start, end));

            await connection.query(read('08_product_images.sql'));

            console.log(
                'Upgraded checkout locking, cart constraints, demo accounts, report date filtering, and editable product galleries.'
            );
        } else {
            throw new Error(
                'Database already exists. Use npm run db:upgrade to preserve and upgrade existing data.'
            );
        }
    } finally {
        await connection.end();
    }
})().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
});