const { query } = require('../../config/db');
const AppError = require('../../utils/AppError');

async function listByProduct(productId, { page, limit }) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const offset = (pageNum - 1) * limitNum;

  const result = await query(
    `SELECT r.*, u.full_name, COUNT(*) OVER() AS total_count
     FROM reviews r JOIN users u ON u.id = r.user_id
     WHERE r.product_id = $1
     ORDER BY r.created_at DESC
     LIMIT $2 OFFSET $3`,
    [productId, limitNum, offset]
  );
  const totalCount = result.rows[0] ? Number(result.rows[0].total_count) : 0;
  const items = result.rows.map(({ total_count, ...rest }) => rest);
  return { items, pagination: { page: pageNum, limit: limitNum, total: totalCount, totalPages: Math.max(1, Math.ceil(totalCount / limitNum)) } };
}

// Tìm đơn hàng (chưa review) mà user đã mua sản phẩm này -> điều kiện để được bình luận/đánh giá
async function getReviewableOrders(userId, productId) {
  const res = await query(
    `SELECT DISTINCT o.id AS order_id, o.order_code, o.created_at
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     WHERE o.user_id = $1 AND oi.product_id = $2 AND o.status <> 'CANCELLED'
       AND NOT EXISTS (
         SELECT 1 FROM reviews r WHERE r.user_id = $1 AND r.product_id = $2 AND r.order_id = o.id
       )
     ORDER BY o.created_at DESC`,
    [userId, productId]
  );
  return res.rows;
}

async function create(userId, { product_id, order_id, rating, comment }) {
  if (!product_id || !order_id || !rating) {
    throw new AppError('Vui lòng chọn đơn hàng và số sao đánh giá.', 400);
  }
  if (rating < 1 || rating > 5) throw new AppError('Số sao đánh giá phải từ 1 đến 5.', 400);

  const purchaseCheck = await query(
    `SELECT 1 FROM orders o JOIN order_items oi ON oi.order_id = o.id
     WHERE o.id = $1 AND o.user_id = $2 AND oi.product_id = $3 AND o.status <> 'CANCELLED'`,
    [order_id, userId, product_id]
  );
  if (purchaseCheck.rows.length === 0) {
    throw new AppError('Bạn cần mua sản phẩm này trước khi đánh giá / bình luận.', 403);
  }

  const res = await query(
    `INSERT INTO reviews (user_id, product_id, order_id, rating, comment)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [userId, product_id, order_id, rating, comment || null]
  );
  return res.rows[0];
}

async function update(userId, id, { rating, comment }) {
  const res = await query(
    `UPDATE reviews SET rating = COALESCE($1, rating), comment = COALESCE($2, comment)
     WHERE id = $3 AND user_id = $4 RETURNING *`,
    [rating ?? null, comment ?? null, id, userId]
  );
  if (!res.rows[0]) throw new AppError('Không tìm thấy đánh giá.', 404);
  return res.rows[0];
}

async function remove(userId, id) {
  const res = await query('DELETE FROM reviews WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);
  if (!res.rows[0]) throw new AppError('Không tìm thấy đánh giá.', 404);
  return true;
}

module.exports = { listByProduct, getReviewableOrders, create, update, remove };
