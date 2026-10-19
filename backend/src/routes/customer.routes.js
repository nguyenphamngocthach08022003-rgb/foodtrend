const express = require('express');

const authRoutes = require('../modules/auth/auth.routes');
const categoriesRoutes = require('../modules/categories/categories.routes.customer');
const productsRoutes = require('../modules/products/products.routes.customer');
const cartRoutes = require('../modules/cart/cart.routes');
const couponsRoutes = require('../modules/coupons/coupons.routes.customer');
const addressesRoutes = require('../modules/addresses/addresses.routes');
const ordersRoutes = require('../modules/orders/orders.routes.customer');
const favoritesRoutes = require('../modules/favorites/favorites.routes');
const reviewsRoutes = require('../modules/reviews/reviews.routes');
const trendingRoutes = require('../modules/trending/trending.routes.customer');
const chatRoutes = require('../modules/chat/chat.routes.customer');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/categories', categoriesRoutes);
router.use('/products', productsRoutes);
router.use('/cart', cartRoutes);
router.use('/coupons', couponsRoutes);
router.use('/addresses', addressesRoutes);
router.use('/orders', ordersRoutes);
router.use('/favorites', favoritesRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/trending', trendingRoutes);
router.use('/chat', chatRoutes);

module.exports = router;
