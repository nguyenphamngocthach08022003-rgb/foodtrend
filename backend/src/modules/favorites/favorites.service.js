const { query } = require('../../config/db');
const AppError = require('../../utils/AppError');

async function list(userId) {
  const res = await query(
    `SELECT f.id AS favorite_id, f.created_at AS favorited_at,
            p.id AS product_id, p.name, p.slug, p.is_available,
            pi.image_url AS thumbnail,
            pp.min_price
     FROM favorites f
     JOIN products p ON p.id = f.product_id
     LEFT JOIN LATERAL (
       SELECT image_url FROM product_images WHERE product_id = p.id
       ORDER BY is_thumbnail DESC, sort_order ASC LIMIT 1
     ) pi ON TRUE
     LEFT JOIN LATERAL (
       SELECT MIN(COALESCE(sale_price, price)) AS min_price FROM product_variants
       WHERE product_id = p.id AND is_available = TRUE
     ) pp ON TRUE
     WHERE f.user_id = $1
     ORDER BY f.created_at DESC`,
    [userId]
  );
  return res.rows;
}

async function add(userId, productId) {
  const existing = await query('SELECT id FROM favorites WHERE user_id = $1 AND product_id = $2', [userId, productId]);
  if (existing.rows[0]) throw new AppError('Sản phẩm đã có trong danh sách yêu thích.', 409);
  const res = await query('INSERT INTO favorites (user_id, product_id) VALUES ($1,$2) RETURNING *', [userId, productId]);
  return res.rows[0];
}

async function remove(userId, productId) {
  const res = await query('DELETE FROM favorites WHERE user_id = $1 AND product_id = $2 RETURNING id', [userId, productId]);
  if (!res.rows[0]) throw new AppError('Không tìm thấy sản phẩm trong danh sách yêu thích.', 404);
  return true;
}

module.exports = { list, add, remove };
