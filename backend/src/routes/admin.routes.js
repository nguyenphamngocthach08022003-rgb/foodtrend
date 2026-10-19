const express = require('express');

const { requireAuth } = require('../middlewares/auth.middleware');
const { requireAdmin } = require('../middlewares/admin.middleware');

const categoriesRoutes = require('../modules/categories/categories.routes.admin');
const productsRoutes = require('../modules/products/products.routes.admin');
const couponsRoutes = require('../modules/coupons/coupons.routes.admin');
const ordersRoutes = require('../modules/orders/orders.routes.admin');
const trendingRoutes = require('../modules/trending/trending.routes.admin');
const usersRoutes = require('../modules/users/users.routes.admin');
const dashboardRoutes = require('../modules/dashboard/dashboard.routes');
const chatRoutes = require('../modules/chat/chat.routes.admin');

const router = express.Router();

// Every /api/admin/* route requires a logged-in ADMIN
router.use(requireAuth, requireAdmin);

router.use('/categories', categoriesRoutes);
router.use('/products', productsRoutes);
router.use('/coupons', couponsRoutes);
router.use('/orders', ordersRoutes);
router.use('/trending', trendingRoutes);
router.use('/customers', usersRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/chat', chatRoutes);

module.exports = router;
