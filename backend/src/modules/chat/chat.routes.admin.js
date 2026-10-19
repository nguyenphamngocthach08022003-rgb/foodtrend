const express = require('express');
const controller = require('./chat.controller');

const router = express.Router();

router.get('/conversations', controller.adminList);
router.get('/conversations/:id', controller.adminGetConversation);
router.get('/unread-total', controller.adminUnreadTotal);

module.exports = router;
