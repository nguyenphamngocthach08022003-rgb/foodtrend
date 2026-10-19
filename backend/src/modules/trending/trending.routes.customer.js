const express = require('express');
const controller = require('./trending.controller');

const router = express.Router();

router.get('/hot', controller.getHot);
router.get('/best-selling', controller.getBestSelling);

module.exports = router;
