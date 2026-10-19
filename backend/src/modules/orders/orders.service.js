const { query, withTransaction } = require('../../config/db');
const AppError = require('../../utils/AppError');
const generateOrderCode = require('../../utils/orderCode');
const env = require('../../config/env');
const couponsService = require('../coupons/coupons.service');
const productsService = require('../products/products.service');

const ACTIVE_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];
const VALID_PAYMENT_METHODS = ['COD', 'BANK_TRANSFER', 'PAYPAL'];

async function resolveDeliveryAddress(client, userId, { address_id, receiver_name, receiver_phone, delivery_address }) {
  if (address_id) {
    const res = await client.query('SELECT * FROM user_addresses WHERE id = $1 AND user_id = $2', [address_id, userId]);
    const addr = res.rows[0];
    if (!addr) throw new AppError('Không tìm thấy địa chỉ giao hàng đã chọn.', 404);
    const fullAddress = `${addr.street_address}, ${addr.ward_name}, ${addr.district_name}, ${addr.province_name}`;
    return { receiver_name: addr.receiver_name, receiver_phone: addr.receiver_phone, delivery_address: fullAddress };
  }
  if (!receiver_name || !receiver_phone || !delivery_address) {
    throw new AppError('Vui lòng chọn địa chỉ giao hàng hoặc nhập thông tin giao hàng đầy đủ.', 400);
  }
  return { receiver_name, receiver_phone, delivery_address };
}

async function generateUniqueOrderCode(client) {
  for (let i = 0; i < 5; i += 1) {
    const code = generateOrderCode();
    const exists = await client.query('SELECT id FROM orders WHERE order_code = $1', [code]);
    if (exists.rows.length === 0) return code;
  }
  throw new AppError('Không thể tạo mã đơn hàng, vui lòng thử lại.', 500);
}

async function checkout(userId, body) {
  const { address_id, receiver_name, receiver_phone, delivery_address, payment_method = 'COD', coupon_code, customer_note } = body;

  if (!VALID_PAYMENT_METHODS.includes(payment_method)) {
    throw new AppError('Phương thức thanh toán không hợp lệ.', 400);
  }

  return withTransaction(async (client) => {
    const cartRes = await client.query('SELECT id FROM carts WHERE user_id = $1', [userId]);
    if (!cartRes.rows[0]) throw new AppError('Giỏ hàng trống.', 400);
    const cartId = cartRes.rows[0].id;

    const itemsRes = await client.query(
      `SELECT ci.id AS cart_item_id, ci.quantity, pv.id AS variant_id, pv.variant_name, pv.price, pv.sale_price,
              pv.stock_quantity, pv.is_available, p.id AS product_id, p.name AS product_name
       FROM cart_items ci
       JOIN product_variants pv ON pv.id = ci.variant_id
       JOIN products p ON p.id = pv.product_id
       WHERE ci.cart_id = $1
       FOR UPDATE OF pv`,
      [cartId]
    );
    const items = itemsRes.rows;
    if (items.length === 0) throw new AppError('Giỏ hàng trống.', 400);

    for (const item of items) {
      if (!item.is_available) throw new AppError(`Sản phẩm "${item.product_name}" hiện không khả dụng.`, 400);
      if (item.stock_quantity < item.quantity) {
        throw new AppError(`"${item.product_name}" (${item.variant_name}) không đủ tồn kho.`, 400);
      }
    }

    const subtotal = items.reduce((sum, i) => sum + Number(i.sale_price ?? i.price) * i.quantity, 0);
    const delivery_fee = env.defaultDeliveryFee;

    let discount_amount = 0;
    let appliedCoupon = null;
    if (coupon_code) {
      const validated = await couponsService.validate({ code: coupon_code, subtotal });
      discount_amount = validated.discount_amount;
      appliedCoupon = validated.coupon;
    }

    const total_amount = Math.max(0, subtotal + delivery_fee - discount_amount);
    const address = await resolveDeliveryAddress(client, userId, { address_id, receiver_name, receiver_phone, delivery_address });
    const orderCode = await generateUniqueOrderCode(client);

    // Simulate payment: BANK_TRANSFER = "mock online payment" that succeeds immediately.
    const initialPaymentStatus = payment_method === 'BANK_TRANSFER' ? 'PAID' : 'PENDING';

    const orderRes = await client.query(
      `INSERT INTO orders
         (order_code, user_id, coupon_id, receiver_name, receiver_phone, delivery_address,
          subtotal, delivery_fee, discount_amount, total_amount, payment_method, payment_status, status, customer_note)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'PENDING',$13)
       RETURNING *`,
      [
        orderCode, userId, appliedCoupon?.id || null, address.receiver_name, address.receiver_phone,
        address.delivery_address, subtotal, delivery_fee, discount_amount, total_amount,
        payment_method, initialPaymentStatus, customer_note || null,
      ]
    );
    const order = orderRes.rows[0];

    for (const item of items) {
      const unitPrice = Number(item.sale_price ?? item.price);
      await client.query(
        `INSERT INTO order_items (order_id, product_id, variant_id, product_name, variant_name, quantity, unit_price, subtotal)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [order.id, item.product_id, item.variant_id, item.product_name, item.variant_name, item.quantity, unitPrice, unitPrice * item.quantity]
      );
      await client.query('UPDATE product_variants SET stock_quantity = stock_quantity - $1 WHERE id = $2', [
        item.quantity,
        item.variant_id,
      ]);
      await productsService.bumpTrendForPurchase(client, item.product_id, item.quantity);
    }

    await client.query(
      `INSERT INTO order_status_history (order_id, status, changed_by, note) VALUES ($1,'PENDING',$2,'Khách hàng vừa tạo đơn hàng.')`,
      [order.id, userId]
    );

    await client.query(
      `INSERT INTO payments (order_id, payment_method, amount, status, paid_at)
       VALUES ($1,$2,$3,$4,$5)`,
      [order.id, payment_method, total_amount, initialPaymentStatus, initialPaymentStatus === 'PAID' ? new Date() : null]
    );

    if (appliedCoupon) {
      await client.query('UPDATE coupons SET used_count = used_count + 1 WHERE id = $1', [appliedCoupon.id]);
      // Mark as used if the user had collected it as a personal coupon
      await client.query(
        `UPDATE user_coupons SET is_used = TRUE, used_order_id = $1, used_at = CURRENT_TIMESTAMP
         WHERE user_id = $2 AND coupon_id = $3 AND is_used = FALSE`,
        [order.id, userId, appliedCoupon.id]
      );
    }

    await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);

    await client.query(
      `INSERT INTO notifications (user_id, title, message, type) VALUES ($1,$2,$3,'ORDER_STATUS')`,
      [userId, 'Đặt hàng thành công', `Đơn ${order.order_code} của bạn đã được tiếp nhận.`]
    );

    return getOrderDetail(order.id, userId, client);
  });
}

async function getOrderDetail(orderId, userId, client = null) {
  const runner = client || { query };
  const filterUser = userId ? 'AND o.user_id = $2' : '';
  const params = userId ? [orderId, userId] : [orderId];

  const orderRes = await runner.query(`SELECT o.* FROM orders o WHERE o.id = $1 ${filterUser}`, params);
  const order = orderRes.rows[0];
  if (!order) throw new AppError('Không tìm thấy đơn hàng.', 404);

  const [itemsRes, historyRes, paymentRes] = await Promise.all([
    runner.query('SELECT * FROM order_items WHERE order_id = $1', [orderId]),
    runner.query('SELECT * FROM order_status_history WHERE order_id = $1 ORDER BY created_at ASC', [orderId]),
    runner.query('SELECT * FROM payments WHERE order_id = $1', [orderId]),
  ]);

  return { ...order, items: itemsRes.rows, history: historyRes.rows, payment: paymentRes.rows[0] || null };
}

async function listMine(userId, { status, page, limit }) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const offset = (pageNum - 1) * limitNum;

  const conditions = ['user_id = $1'];
  const params = [userId];
  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }
  params.push(limitNum);
  const limitIdx = params.length;
  params.push(offset);
  const offsetIdx = params.length;

  const result = await query(
    `SELECT *, COUNT(*) OVER() AS total_count FROM orders
     WHERE ${conditions.join(' AND ')}
     ORDER BY created_at DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    params
  );
  const totalCount = result.rows[0] ? Number(result.rows[0].total_count) : 0;
  const items = result.rows.map(({ total_count, ...rest }) => rest);
  return { items, pagination: { page: pageNum, limit: limitNum, total: totalCount, totalPages: Math.max(1, Math.ceil(totalCount / limitNum)) } };
}

async function cancelOrder(userId, orderId) {
  return withTransaction(async (client) => {
    const res = await client.query('SELECT * FROM orders WHERE id = $1 AND user_id = $2 FOR UPDATE', [orderId, userId]);
    const order = res.rows[0];
    if (!order) throw new AppError('Không tìm thấy đơn hàng.', 404);
    if (order.status !== 'PENDING') {
      throw new AppError('Chỉ có thể huỷ đơn khi đơn đang ở trạng thái chờ xử lý.', 400);
    }

    const itemsRes = await client.query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);
    for (const item of itemsRes.rows) {
      if (item.variant_id) {
        await client.query('UPDATE product_variants SET stock_quantity = stock_quantity + $1 WHERE id = $2', [
          item.quantity,
          item.variant_id,
        ]);
      }
    }

    await client.query('UPDATE orders SET status = $1 WHERE id = $2', ['CANCELLED', orderId]);
    await client.query(
      `INSERT INTO order_status_history (order_id, status, changed_by, note) VALUES ($1,'CANCELLED',$2,'Khách hàng huỷ đơn hàng.')`,
      [orderId, userId]
    );
    return getOrderDetail(orderId, userId, client);
  });
}

// Mock PayPal confirmation - to be swapped for a real PayPal capture call later
async function confirmMockPayment(userId, orderId) {
  return withTransaction(async (client) => {
    const res = await client.query('SELECT * FROM orders WHERE id = $1 AND user_id = $2', [orderId, userId]);
    const order = res.rows[0];
    if (!order) throw new AppError('Không tìm thấy đơn hàng.', 404);
    if (order.payment_status === 'PAID') return getOrderDetail(orderId, userId, client);

    await client.query('UPDATE orders SET payment_status = $1 WHERE id = $2', ['PAID', orderId]);
    await client.query(
      `UPDATE payments SET status = 'PAID', paid_at = CURRENT_TIMESTAMP, transaction_id = $1 WHERE order_id = $2`,
      [`MOCK-${Date.now()}`, orderId]
    );
    return getOrderDetail(orderId, userId, client);
  });
}

// ---- admin ----

async function adminList({ status, q, page, limit }) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  const conditions = ['1=1'];
  const params = [];
  if (status) {
    params.push(status);
    conditions.push(`o.status = $${params.length}`);
  }
  if (q) {
    params.push(`%${q}%`);
    conditions.push(`(o.order_code ILIKE $${params.length} OR o.receiver_phone ILIKE $${params.length})`);
  }
  params.push(limitNum);
  const limitIdx = params.length;
  params.push(offset);
  const offsetIdx = params.length;

  const result = await query(
    `SELECT o.*, u.full_name AS customer_name, COUNT(*) OVER() AS total_count
     FROM orders o JOIN users u ON u.id = o.user_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY o.created_at DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    params
  );
  const totalCount = result.rows[0] ? Number(result.rows[0].total_count) : 0;
  const items = result.rows.map(({ total_count, ...rest }) => rest);
  return { items, pagination: { page: pageNum, limit: limitNum, total: totalCount, totalPages: Math.max(1, Math.ceil(totalCount / limitNum)) } };
}

const STATUS_FLOW = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED'];

async function updateStatus(orderId, { status, note, adminId }) {
  if (!ACTIVE_STATUSES.includes(status)) throw new AppError('Trạng thái không hợp lệ.', 400);

  return withTransaction(async (client) => {
    const res = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [orderId]);
    const order = res.rows[0];
    if (!order) throw new AppError('Không tìm thấy đơn hàng.', 404);
    if (order.status === 'CANCELLED' || order.status === 'COMPLETED') {
      throw new AppError('Đơn hàng đã kết thúc, không thể cập nhật thêm.', 400);
    }

    if (status === 'CANCELLED') {
      const itemsRes = await client.query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);
      for (const item of itemsRes.rows) {
        if (item.variant_id) {
          await client.query('UPDATE product_variants SET stock_quantity = stock_quantity + $1 WHERE id = $2', [
            item.quantity,
            item.variant_id,
          ]);
        }
      }
    }

    const paymentStatusUpdate = status === 'COMPLETED' && order.payment_method === 'COD' ? 'PAID' : order.payment_status;

    await client.query('UPDATE orders SET status = $1, payment_status = $2 WHERE id = $3', [
      status,
      paymentStatusUpdate,
      orderId,
    ]);

    if (paymentStatusUpdate !== order.payment_status) {
      await client.query(`UPDATE payments SET status = $1, paid_at = CURRENT_TIMESTAMP WHERE order_id = $2`, [
        paymentStatusUpdate,
        orderId,
      ]);
    }

    await client.query(
      `INSERT INTO order_status_history (order_id, status, changed_by, note) VALUES ($1,$2,$3,$4)`,
      [orderId, status, adminId, note || null]
    );

    await client.query(
      `INSERT INTO notifications (user_id, title, message, type) VALUES ($1,$2,$3,'ORDER_STATUS')`,
      [order.user_id, 'Cập nhật đơn hàng', `Đơn ${order.order_code} chuyển sang trạng thái ${status}.`]
    );

    return getOrderDetail(orderId, null, client);
  });
}

module.exports = {
  checkout,
  getOrderDetail,
  listMine,
  cancelOrder,
  confirmMockPayment,
  adminList,
  updateStatus,
  STATUS_FLOW,
};
