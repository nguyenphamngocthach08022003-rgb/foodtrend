const express = require('express');
const controller = require('./orders.controller');
const { requireAuth } = require('../../middlewares/auth.middleware');

const router = express.Router();
router.use(requireAuth);

router.post('/checkout', controller.checkout);
router.get('/', controller.listMine);
router.get('/:id', controller.getMine);
router.put('/:id/cancel', controller.cancel);
router.put('/:id/confirm-mock-payment', controller.confirmMockPayment);

module.exports = router;
