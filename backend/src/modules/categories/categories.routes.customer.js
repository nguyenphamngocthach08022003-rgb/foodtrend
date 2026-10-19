const express = require('express');
const controller = require('./categories.controller');

const router = express.Router();

router.get('/', controller.listPublic);
router.get('/:slug', controller.getBySlug);

module.exports = router;
