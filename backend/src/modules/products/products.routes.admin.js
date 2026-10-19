const express = require('express');
const controller = require('./products.controller');
const variantsController = require('./variants.controller');
const imagesController = require('./images.controller');
const upload = require('../../middlewares/upload.middleware');

const router = express.Router();

router.get('/', controller.adminList);
router.get('/:id', controller.adminGetById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

// Variants nested under a product
router.post('/:productId/variants', variantsController.create);
router.put('/variants/:id', variantsController.update);
router.delete('/variants/:id', variantsController.remove);

// Images nested under a product
router.post('/:productId/images', upload.array('images', 8), imagesController.upload);
router.put('/images/:id/thumbnail', imagesController.setThumbnail);
router.put('/:productId/images/reorder', imagesController.reorder);
router.delete('/images/:id', imagesController.remove);

module.exports = router;
