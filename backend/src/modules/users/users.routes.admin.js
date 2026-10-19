const express = require('express');
const controller = require('./users.controller');

const router = express.Router();

router.get('/', controller.adminList);
router.get('/:id', controller.adminGetById);
router.put('/:id/active', controller.toggleActive);

module.exports = router;
