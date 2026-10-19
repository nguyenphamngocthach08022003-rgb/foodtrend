const express = require('express');
const controller = require('./chat.controller');
const { requireAuth } = require('../../middlewares/auth.middleware');

const router = express.Router();
router.use(requireAuth);

router.get('/mine', controller.getMine);

module.exports = router;
