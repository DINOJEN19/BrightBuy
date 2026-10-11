'use strict';

const express = require('express');
const Joi = require('joi');

const {
    authenticateJWT,
    requireRole
} = require('../middleware/auth');

const { validateBody } = require('../middleware/validateBody');

const service = require('../services/productManagement.service');
const images = require('../services/productImages.service');

const router = express.Router();

router.use(authenticateJWT, requireRole('ADMIN'));

router.param('imageId', (req, res, next, id) =>
    /^\d+$/.test(id) && Number(id) > 0
        ? next()
        : res.status(400).json({
            error: {
                message: 'Invalid picture ID.'
            }
        })
);

router.param('productId', (req, res, next, id) =>
    /^\d+$/.test(id) && Number(id) > 0
        ? next()
        : res.status(400).json({
            error: {
                message: 'Invalid product ID.'
            }
        })
);

const wrap = fn => async (req, res, next) => {
    try {
        await fn(req, res);
    } catch (e) {
        next(e);
    }
};

const productSchema = Joi.object({
    productName: Joi.string().trim().max(150).required(),
    description: Joi.string().max(1000).allow('', null).required(),
    brand: Joi.string().max(80).allow('', null).required(),
    status: Joi.string().valid('ACTIVE', 'DISCONTINUED').required(),
    categoryIds: Joi.array()
        .items(Joi.number().integer().positive())
        .min(1)
        .unique()
        .required()
});

router.get('/products', wrap(async (req, res) => {
    const { error, value } = Joi.object({
        q: Joi.string().max(150).allow('').default(''),
        page: Joi.number().integer().min(1).default(1),
        pageSize: Joi.number().integer().min(1).max(100).default(20)
    }).validate(req.query);

    if (error) {
        return res.status(400).json({
            error: {
                message: error.message
            }
        });
    }

    const r = await service.listProducts(value);

    res.json({
        data: r.products,
        meta: r.meta
    });
}));

router.get('/products/:productId', wrap(async (req, res) =>
    res.json({
        data: await service.getProduct(Number(req.params.productId))
    })
));

router.put(
    '/products/:productId',
    validateBody(productSchema),
    wrap(async (req, res) =>
        res.json({
            data: await service.updateProduct(
                Number(req.params.productId),
                req.body
            )
        })
    )
);

router.put(
    '/variants/:variantId/stock',
    validateBody(
        Joi.object({
            stockQuantity: Joi.number()
                .integer()
                .min(0)
                .max(2147483647)
                .required(),
            expectedStockQuantity: Joi.number()
                .integer()
                .min(0)
                .max(2147483647)
                .required(),
            reason: Joi.string().trim().min(1).max(255).required()
        })
    ),
    wrap(async (req, res) => {
        if (
            !/^\d+$/.test(req.params.variantId) ||
            Number(req.params.variantId) < 1
        ) {
            return res.status(400).json({
                error: {
                    message: 'Invalid variant ID.'
                }
            });
        }

        res.json({
            data: await service.setStock(
                Number(req.params.variantId),
                req.body
            )
        });
    })
);

router.post(
    '/products/:productId/images',
    express.raw({
        type: ['image/png', 'image/jpeg', 'image/webp'],
        limit: '2mb'
    }),
    wrap(async (req, res) =>
        res.status(201).json({
            data: await images.addImage(
                Number(req.params.productId),
                req.body
            )
        })
    )
);

router.delete(
    '/products/:productId/images/:imageId',
    wrap(async (req, res) =>
        res.json({
            data: await images.removeImage(
                Number(req.params.productId),
                req.params.imageId
            )
        })
    )
);

router.put(
    '/products/:productId/images/:imageId/cover',
    wrap(async (req, res) =>
        res.json({
            data: await images.setCover(
                Number(req.params.productId),
                req.params.imageId
            )
        })
    )
);

module.exports = router;