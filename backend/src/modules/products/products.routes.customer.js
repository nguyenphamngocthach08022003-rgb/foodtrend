const express = require('express');
const controller = require('./products.controller');
const { optionalAuth } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.get('/', controller.list);
router.get('/:slug', optionalAuth, controller.getBySlug);

module.exports = router;
