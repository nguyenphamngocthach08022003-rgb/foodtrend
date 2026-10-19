const express = require('express');
const controller = require('./trending.controller');

const router = express.Router();

router.get('/', controller.adminList);
router.put('/', controller.upsert);
router.delete('/:productId', controller.remove);

module.exports = router;
