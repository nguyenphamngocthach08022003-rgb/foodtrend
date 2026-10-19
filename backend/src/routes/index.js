const express = require('express');
const customerRoutes = require('./customer.routes');
const adminRoutes = require('./admin.routes');

const router = express.Router();

// Tách bạch hoàn toàn theo chức năng:
//   /api/*        -> dành cho khách hàng (public + cần đăng nhập)
//   /api/admin/*  -> dành cho quản trị viên (luôn yêu cầu role ADMIN)
router.use('/admin', adminRoutes);
router.use('/', customerRoutes);

module.exports = router;
