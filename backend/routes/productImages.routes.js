'use strict';

const router = require('express').Router();
const images = require('../services/productImages.service');

router.get('/product-images/:imageId', async (req, res, next) => {
    try {
        if (!/^\d+$/.test(req.params.imageId)) {
            return res.sendStatus(404);
        }

        const image = await images.readImage(req.params.imageId);

        if (!image) {
            return res.sendStatus(404);
        }

        res.set({
            'Content-Type': image.mime_type,
            'X-Content-Type-Options': 'nosniff',
            'Cache-Control': 'no-cache'
        }).send(image.image_data);
    } catch (e) {
        next(e);
    }
});

module.exports = router;