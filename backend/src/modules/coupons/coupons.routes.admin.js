const express = require('express');
const controller = require('./coupons.controller');

const router = express.Router();

router.get('/', controller.adminList);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
