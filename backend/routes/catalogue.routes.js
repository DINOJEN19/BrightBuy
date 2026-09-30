// routes/catalogue.routes.js
'use strict';

const router = require('express').Router();
const catalogueController = require('../controllers/catalogue.controller');

router.get('/categories', catalogueController.getCategories);
router.get('/products', catalogueController.getProducts);
router.get('/products/:productId', catalogueController.getProduct);
router.get('/variants/:variantId', catalogueController.getVariant);

module.exports = router;
