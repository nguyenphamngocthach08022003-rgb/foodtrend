const express = require('express');
const controller = require('./addresses.controller');
const { requireAuth } = require('../../middlewares/auth.middleware');

const router = express.Router();
router.use(requireAuth);

router.get('/', controller.list);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);
router.put('/:id/default', controller.setDefault);

module.exports = router;
