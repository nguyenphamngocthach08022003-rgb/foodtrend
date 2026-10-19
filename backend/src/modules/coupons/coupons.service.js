const { query } = require('../../config/db');
const AppError = require('../../utils/AppError');

function computeDiscount(coupon, subtotal) {
  let discount = 0;
  if (coupon.discount_type === 'PERCENT') {
    discount = (subtotal * Number(coupon.discount_value)) / 100;
    if (coupon.max_discount_amount) {
      discount = Math.min(discount, Number(coupon.max_discount_amount));
    }
  } else {
    discount = Number(coupon.discount_value);
  }
  return Math.min(discount, subtotal);
}

async function validate({ code, subtotal }) {
  if (!code) throw new AppError('Vui lòng nhập mã giảm giá.', 400);

  const res = await query('SELECT * FROM coupons WHERE code = $1', [code.toUpperCase()]);
  const coupon = res.rows[0];
  if (!coupon) throw new AppError('Mã giảm giá không tồn tại.', 404);
  if (!coupon.is_active) throw new AppError('Mã giảm giá không còn hoạt động.', 400);

  const now = new Date();
  if (now < new Date(coupon.start_at) || now > new Date(coupon.end_at)) {
    throw new AppError('Mã giảm giá đã hết hạn hoặc chưa bắt đầu.', 400);
  }
  if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
    throw new AppError('Mã giảm giá đã hết lượt sử dụng.', 400);
  }
  if (Number(subtotal) < Number(coupon.min_order_amount)) {
    throw new AppError(
      `Đơn hàng tối thiểu ${Number(coupon.min_order_amount).toLocaleString('vi-VN')}đ để áp dụng mã này.`,
      400
    );
  }

  const discount_amount = computeDiscount(coupon, Number(subtotal));
  return { coupon, discount_amount };
}

async function listPublicActive() {
  const res = await query(
    `SELECT * FROM coupons
     WHERE is_active = TRUE AND end_at > CURRENT_TIMESTAMP
       AND (usage_limit IS NULL OR used_count < usage_limit)
     ORDER BY created_at DESC`
  );
  return res.rows;
}

async function listUserCoupons(userId) {
  const res = await query(
    `SELECT uc.id AS user_coupon_id, uc.is_used, uc.collected_at, uc.used_at, c.*
     FROM user_coupons uc JOIN coupons c ON c.id = uc.coupon_id
     WHERE uc.user_id = $1
     ORDER BY uc.collected_at DESC`,
    [userId]
  );
  return res.rows;
}

async function collect(userId, couponId) {
  const couponRes = await query('SELECT * FROM coupons WHERE id = $1', [couponId]);
  if (!couponRes.rows[0]) throw new AppError('Không tìm thấy mã giảm giá.', 404);

  const existing = await query('SELECT id FROM user_coupons WHERE user_id = $1 AND coupon_id = $2', [userId, couponId]);
  if (existing.rows[0]) throw new AppError('Bạn đã lưu mã giảm giá này rồi.', 409);

  const res = await query(
    'INSERT INTO user_coupons (user_id, coupon_id) VALUES ($1,$2) RETURNING *',
    [userId, couponId]
  );
  return res.rows[0];
}

// ---- admin ----

async function adminList() {
  const res = await query('SELECT * FROM coupons ORDER BY created_at DESC');
  return res.rows;
}

async function create(data) {
  const {
    code, description, discount_type, discount_value, min_order_amount,
    max_discount_amount, usage_limit, start_at, end_at, is_active,
  } = data;

  if (!code || !discount_type || discount_value === undefined || !start_at || !end_at) {
    throw new AppError('Vui lòng nhập đầy đủ thông tin mã giảm giá.', 400);
  }

  const res = await query(
    `INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount,
       max_discount_amount, usage_limit, start_at, end_at, is_active)
     VALUES ($1,$2,$3,$4,COALESCE($5,0),$6,$7,$8,$9,COALESCE($10,TRUE))
     RETURNING *`,
    [
      code.toUpperCase(), description || null, discount_type, discount_value,
      min_order_amount, max_discount_amount || null, usage_limit || null,
      start_at, end_at, is_active,
    ]
  );
  return res.rows[0];
}

async function update(id, data) {
  const {
    description, discount_type, discount_value, min_order_amount,
    max_discount_amount, usage_limit, start_at, end_at, is_active,
  } = data;

  const res = await query(
    `UPDATE coupons SET
       description = COALESCE($1, description),
       discount_type = COALESCE($2, discount_type),
       discount_value = COALESCE($3, discount_value),
       min_order_amount = COALESCE($4, min_order_amount),
       max_discount_amount = $5,
       usage_limit = $6,
       start_at = COALESCE($7, start_at),
       end_at = COALESCE($8, end_at),
       is_active = COALESCE($9, is_active)
     WHERE id = $10 RETURNING *`,
    [
      description ?? null, discount_type || null, discount_value ?? null, min_order_amount ?? null,
      max_discount_amount ?? null, usage_limit ?? null, start_at || null, end_at || null,
      is_active ?? null, id,
    ]
  );
  if (!res.rows[0]) throw new AppError('Không tìm thấy mã giảm giá.', 404);
  return res.rows[0];
}

async function remove(id) {
  const res = await query('DELETE FROM coupons WHERE id = $1 RETURNING id', [id]);
  if (!res.rows[0]) throw new AppError('Không tìm thấy mã giảm giá.', 404);
  return true;
}

module.exports = { validate, listPublicActive, listUserCoupons, collect, adminList, create, update, remove, computeDiscount };
