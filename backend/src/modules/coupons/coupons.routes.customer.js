const express = require('express');
const controller = require('./coupons.controller');
const { requireAuth, optionalAuth } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.get('/', optionalAuth, controller.listPublic);
router.post('/validate', optionalAuth, controller.validate);
router.get('/mine', requireAuth, controller.listMine);
router.post('/collect', requireAuth, controller.collect);

module.exports = router;
