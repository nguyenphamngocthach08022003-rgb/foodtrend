const express = require('express');
const controller = require('./dashboard.controller');

const router = express.Router();
router.get('/summary', controller.summary);

module.exports = router;
