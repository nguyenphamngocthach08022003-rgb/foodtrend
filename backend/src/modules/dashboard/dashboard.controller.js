const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/apiResponse');
const { query } = require('../../config/db');

exports.summary = asyncHandler(async (req, res) => {
  const [revenue, ordersByStatus, topProducts, recentOrders, customerCount] = await Promise.all([
    query(`SELECT COALESCE(SUM(total_amount),0) AS total_revenue FROM orders WHERE payment_status = 'PAID'`),
    query(`SELECT status, COUNT(*) AS count FROM orders GROUP BY status`),
    query(`SELECT name, slug, total_sold FROM best_selling_products WHERE total_sold > 0 ORDER BY total_sold DESC LIMIT 5`),
    query(`SELECT o.id, o.order_code, o.total_amount, o.status, o.created_at, u.full_name AS customer_name
           FROM orders o JOIN users u ON u.id = o.user_id ORDER BY o.created_at DESC LIMIT 10`),
    query(`SELECT COUNT(*) AS count FROM users WHERE role = 'CUSTOMER'`),
  ]);

  return ok(res, {
    total_revenue: Number(revenue.rows[0].total_revenue),
    orders_by_status: ordersByStatus.rows,
    top_products: topProducts.rows,
    recent_orders: recentOrders.rows,
    customer_count: Number(customerCount.rows[0].count),
  });
});
