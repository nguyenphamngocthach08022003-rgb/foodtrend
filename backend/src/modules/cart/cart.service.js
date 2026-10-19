const { query, withTransaction } = require('../../config/db');
const AppError = require('../../utils/AppError');

async function getOrCreateCartId(userId) {
  const existing = await query('SELECT id FROM carts WHERE user_id = $1', [userId]);
  if (existing.rows[0]) return existing.rows[0].id;
  const created = await query('INSERT INTO carts (user_id) VALUES ($1) RETURNING id', [userId]);
  return created.rows[0].id;
}

async function getCart(userId) {
  const cartId = await getOrCreateCartId(userId);

  const itemsRes = await query(
    `SELECT
       ci.id AS cart_item_id, ci.quantity,
       pv.id AS variant_id, pv.variant_name, pv.price, pv.sale_price,
       pv.stock_quantity, pv.is_available AS variant_available,
       p.id AS product_id, p.name AS product_name, p.slug AS product_slug, p.is_available AS product_available,
       pi.image_url AS thumbnail
     FROM cart_items ci
     JOIN product_variants pv ON pv.id = ci.variant_id
     JOIN products p ON p.id = pv.product_id
     LEFT JOIN LATERAL (
       SELECT image_url FROM product_images WHERE product_id = p.id
       ORDER BY is_thumbnail DESC, sort_order ASC LIMIT 1
     ) pi ON TRUE
     WHERE ci.cart_id = $1
     ORDER BY ci.created_at DESC`,
    [cartId]
  );

  const items = itemsRes.rows.map((row) => {
    const unitPrice = Number(row.sale_price ?? row.price);
    return { ...row, unit_price: unitPrice, line_total: unitPrice * row.quantity };
  });

  const subtotal = items.reduce((sum, i) => sum + i.line_total, 0);

  return { cart_id: cartId, items, subtotal, item_count: items.reduce((s, i) => s + i.quantity, 0) };
}

async function addItem(userId, { variant_id, quantity }) {
  if (!variant_id || !quantity || quantity < 1) {
    throw new AppError('Vui lòng chọn biến thể và số lượng hợp lệ.', 400);
  }

  const variantRes = await query('SELECT * FROM product_variants WHERE id = $1', [variant_id]);
  const variant = variantRes.rows[0];
  if (!variant || !variant.is_available) throw new AppError('Sản phẩm hiện không khả dụng.', 400);
  if (variant.stock_quantity < quantity) throw new AppError('Số lượng tồn kho không đủ.', 400);

  const cartId = await getOrCreateCartId(userId);

  // Check for duplicate variant already in cart -> increase quantity instead of new row
  const existing = await query('SELECT * FROM cart_items WHERE cart_id = $1 AND variant_id = $2', [cartId, variant_id]);

  if (existing.rows[0]) {
    const newQty = existing.rows[0].quantity + quantity;
    if (variant.stock_quantity < newQty) throw new AppError('Số lượng tồn kho không đủ.', 400);
    await query('UPDATE cart_items SET quantity = $1 WHERE id = $2', [newQty, existing.rows[0].id]);
  } else {
    await query('INSERT INTO cart_items (cart_id, variant_id, quantity) VALUES ($1,$2,$3)', [
      cartId,
      variant_id,
      quantity,
    ]);
  }

  return getCart(userId);
}

async function updateItem(userId, cartItemId, quantity) {
  if (!quantity || quantity < 1) throw new AppError('Số lượng không hợp lệ.', 400);

  const cartId = await getOrCreateCartId(userId);
  const itemRes = await query('SELECT ci.*, pv.stock_quantity FROM cart_items ci JOIN product_variants pv ON pv.id = ci.variant_id WHERE ci.id = $1 AND ci.cart_id = $2', [cartItemId, cartId]);
  const item = itemRes.rows[0];
  if (!item) throw new AppError('Không tìm thấy sản phẩm trong giỏ hàng.', 404);
  if (item.stock_quantity < quantity) throw new AppError('Số lượng tồn kho không đủ.', 400);

  await query('UPDATE cart_items SET quantity = $1 WHERE id = $2', [quantity, cartItemId]);
  return getCart(userId);
}

async function removeItem(userId, cartItemId) {
  const cartId = await getOrCreateCartId(userId);
  await query('DELETE FROM cart_items WHERE id = $1 AND cart_id = $2', [cartItemId, cartId]);
  return getCart(userId);
}

async function clearCart(userId) {
  const cartId = await getOrCreateCartId(userId);
  await query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);
  return getCart(userId);
}

module.exports = { getCart, addItem, updateItem, removeItem, clearCart, getOrCreateCartId };
