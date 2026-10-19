const express = require('express');
const controller = require('./reviews.controller');
const { requireAuth } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.get('/product/:productId', controller.listByProduct);
router.get('/product/:productId/reviewable-orders', requireAuth, controller.getReviewableOrders);
router.post('/', requireAuth, controller.create);
router.put('/:id', requireAuth, controller.update);
router.delete('/:id', requireAuth, controller.remove);

module.exports = router;
