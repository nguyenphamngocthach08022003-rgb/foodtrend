const { query } = require('../../config/db');
const AppError = require('../../utils/AppError');

async function adminList({ q, page, limit }) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [`role = 'CUSTOMER'`];
  const params = [];
  if (q) {
    params.push(`%${q}%`);
    conditions.push(`(full_name ILIKE $${params.length} OR phone ILIKE $${params.length} OR email ILIKE $${params.length})`);
  }
  params.push(limitNum);
  const limitIdx = params.length;
  params.push(offset);
  const offsetIdx = params.length;

  const result = await query(
    `SELECT u.id, u.full_name, u.email, u.phone, u.is_active, u.created_at,
            (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS order_count,
            (SELECT COALESCE(SUM(total_amount),0) FROM orders o WHERE o.user_id = u.id AND o.payment_status = 'PAID') AS total_spent,
            COUNT(*) OVER() AS total_count
     FROM users u
     WHERE ${conditions.join(' AND ')}
     ORDER BY u.created_at DESC
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    params
  );
  const totalCount = result.rows[0] ? Number(result.rows[0].total_count) : 0;
  const items = result.rows.map(({ total_count, ...rest }) => rest);
  return { items, pagination: { page: pageNum, limit: limitNum, total: totalCount, totalPages: Math.max(1, Math.ceil(totalCount / limitNum)) } };
}

async function adminGetById(id) {
  const res = await query(
    `SELECT id, full_name, email, phone, is_active, created_at FROM users WHERE id = $1 AND role = 'CUSTOMER'`,
    [id]
  );
  if (!res.rows[0]) throw new AppError('Không tìm thấy khách hàng.', 404);
  const orders = await query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20', [id]);
  return { ...res.rows[0], recent_orders: orders.rows };
}

async function toggleActive(id, is_active) {
  const res = await query(
    `UPDATE users SET is_active = $1 WHERE id = $2 AND role = 'CUSTOMER' RETURNING id, full_name, is_active`,
    [is_active, id]
  );
  if (!res.rows[0]) throw new AppError('Không tìm thấy khách hàng.', 404);
  return res.rows[0];
}

module.exports = { adminList, adminGetById, toggleActive };
