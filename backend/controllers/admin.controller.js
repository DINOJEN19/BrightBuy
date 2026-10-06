// controllers/admin.controller.js
// HTTP layer for Person 5 catalogue administration endpoints.
// Owned by Person 5.

'use strict';

const adminService = require('../services/admin.service');

/** Maps service errors to HTTP responses. Returns true if handled. */
function handleAdminError(err, res) {
  if (err.code === 'VALIDATION_ERROR') {
    res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: err.message },
    });
    return true;
  }
  if (err.code === 'NOT_FOUND') {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: err.message },
    });
    return true;
  }
  if (err.code === 'CATEGORY_EXISTS') {
    res.status(409).json({
      error: { code: 'CATEGORY_EXISTS', message: err.message },
    });
    return true;
  }
  if (err.code === 'SKU_TAKEN') {
    res.status(409).json({
      error: { code: 'SKU_TAKEN', message: err.message },
    });
    return true;
  }
  return false;
}

/**
 * POST /api/v1/admin/categories
 * Auth required: ADMIN
 * Body: { categoryName, description? }
 * Success response: 201 { data: { categoryId } }
 * Error responses:
 *   400 VALIDATION_ERROR: "Category name is required."
 *   409 CATEGORY_EXISTS: "A category with this name already exists."
 */
exports.createCategory = async (req, res, next) => {
  try {
    const { categoryName, description } = req.body || {};
    const result = await adminService.createCategory({ categoryName, description });
    return res.status(201).json({ data: result });
  } catch (err) {
    if (handleAdminError(err, res)) return;
    next(err);
  }
};

/**
 * POST /api/v1/admin/products
 * Auth required: ADMIN
 * Body: { productName, description?, brand?, categoryIds: [...], variants: [ { sku, variantName, colour?, memorySize?, price, stockQuantity } ] }
 * Success response: 201 { data: { productId, variantIds: [...] } }
 * Error responses:
 *   400 VALIDATION_ERROR: "Every product requires at least one category and one variant."
 *   409 SKU_TAKEN: "This SKU is already in use."
 */
exports.createProduct = async (req, res, next) => {
  try {
    const { productName, description, brand, categoryIds, variants } = req.body || {};
    const result = await adminService.createProduct({
      productName,
      description,
      brand,
      categoryIds,
      variants,
    });
    return res.status(201).json({ data: result });
  } catch (err) {
    if (handleAdminError(err, res)) return;
    next(err);
  }
};

/**
 * PUT /api/v1/admin/variants/:variantId
 * Auth required: ADMIN
 * Body: { variantName?, price?, status? }
 * Success response: 200 { data: { variantId, ...updated fields } }
 * Error responses:
 *   400 VALIDATION_ERROR
 *   404 NOT_FOUND: "Variant not found."
 */
exports.updateVariant = async (req, res, next) => {
  try {
    const { variantId } = req.params;
    const { variantName, price, status } = req.body || {};
    const result = await adminService.updateVariant(variantId, {
      variantName,
      price,
      status,
    });
    return res.status(200).json({ data: result });
  } catch (err) {
    if (handleAdminError(err, res)) return;
    next(err);
  }
};
