const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/apiResponse');
const { query } = require('../../config/db');
const AppError = require('../../utils/AppError');

exports.create = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { variant_name, price, sale_price, stock_quantity, is_available } = req.body;
  if (!variant_name || price === undefined) {
    throw new AppError('Vui lòng nhập tên biến thể và giá.', 400);
  }
  const result = await query(
    `INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity, is_available)
     VALUES ($1,$2,$3,$4,COALESCE($5,0),COALESCE($6,TRUE)) RETURNING *`,
    [productId, variant_name, price, sale_price || null, stock_quantity, is_available]
  );
  return ok(res, result.rows[0], 'Thêm biến thể thành công.', 201);
});

exports.update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { variant_name, price, sale_price, stock_quantity, is_available } = req.body;
  const result = await query(
    `UPDATE product_variants SET
       variant_name = COALESCE($1, variant_name),
       price = COALESCE($2, price),
       sale_price = $3,
       stock_quantity = COALESCE($4, stock_quantity),
       is_available = COALESCE($5, is_available)
     WHERE id = $6 RETURNING *`,
    [variant_name || null, price ?? null, sale_price ?? null, stock_quantity ?? null, is_available ?? null, id]
  );
  if (!result.rows[0]) throw new AppError('Không tìm thấy biến thể.', 404);
  return ok(res, result.rows[0], 'Cập nhật biến thể thành công.');
});

exports.remove = asyncHandler(async (req, res) => {
  const result = await query('DELETE FROM product_variants WHERE id = $1 RETURNING id', [req.params.id]);
  if (!result.rows[0]) throw new AppError('Không tìm thấy biến thể.', 404);
  return ok(res, null, 'Xoá biến thể thành công.');
});
