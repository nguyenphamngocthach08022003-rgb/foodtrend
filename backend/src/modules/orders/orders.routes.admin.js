const express = require("express");
const controller = require("./orders.controller");

const router = express.Router();

router.get("/", controller.adminList);
router.get("/:id", controller.adminGetById);
router.put("/:id/status", controller.updateStatus);
router.put("/:id/verify-payment", controller.verifyBankTransfer);

module.exports = router;
