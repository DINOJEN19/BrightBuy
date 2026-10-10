// controllers/catalogue.controller.js
'use strict';

const catalogueService = require('../services/catalogue.service');

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await catalogueService.getCategories();
    res.json({ data: categories });
  } catch (err) {
    next(err);
  }
};

exports.getProducts = async (req, res, next) => {
  try {
    const category = req.query.category;
    const q = req.query.q;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    let pageSize = Math.max(1, parseInt(req.query.pageSize, 10) || 20);
    
    if (pageSize > 100) pageSize = 100; // max pageSize = 100 as per docs

    const result = await catalogueService.getProducts({ category, q, page, pageSize });
    res.json({ data: result.products, meta: result.meta });
  } catch (err) {
    next(err);
  }
};

exports.getProduct = async (req, res, next) => {
  try {
    const product = await catalogueService.getProduct(req.params.productId);
    if (!product) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Product not found.' },
      });
    }
    res.json({ data: product });
  } catch (err) {
    next(err);
  }
};

exports.getVariant = async (req, res, next) => {
  try {
    const variant = await catalogueService.getVariant(req.params.variantId);
    if (!variant) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Variant not found.' },
      });
    }
    res.json({ data: variant });
  } catch (err) {
    next(err);
  }
};
