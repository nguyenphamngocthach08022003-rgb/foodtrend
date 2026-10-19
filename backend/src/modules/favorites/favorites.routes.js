const express = require('express');
const controller = require('./favorites.controller');
const { requireAuth } = require('../../middlewares/auth.middleware');

const router = express.Router();
router.use(requireAuth);

router.get('/', controller.list);
router.post('/', controller.add);
router.delete('/:productId', controller.remove);

module.exports = router;
