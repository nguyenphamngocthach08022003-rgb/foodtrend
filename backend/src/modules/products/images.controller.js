const path = require('path');
const fs = require('fs');
const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/apiResponse');
const { query } = require('../../config/db');
const AppError = require('../../utils/AppError');

exports.upload = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const files = req.files || [];
  if (files.length === 0) throw new AppError('Vui lòng chọn ít nhất 1 ảnh.', 400);

  const existingCount = await query('SELECT COUNT(*) FROM product_images WHERE product_id = $1', [productId]);
  const alreadyHasThumbnail = Number(existingCount.rows[0].count) > 0;

  const inserted = [];
  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];
    const imageUrl = `/uploads/products/${file.filename}`;
    const isThumbnail = !alreadyHasThumbnail && i === 0;
    const result = await query(
      `INSERT INTO product_images (product_id, image_url, sort_order, is_thumbnail)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [productId, imageUrl, i, isThumbnail]
    );
    inserted.push(result.rows[0]);
  }
  return ok(res, inserted, 'Tải ảnh lên thành công.', 201);
});

exports.setThumbnail = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const imgRes = await query('SELECT product_id FROM product_images WHERE id = $1', [id]);
  if (!imgRes.rows[0]) throw new AppError('Không tìm thấy ảnh.', 404);

  await query('UPDATE product_images SET is_thumbnail = FALSE WHERE product_id = $1', [imgRes.rows[0].product_id]);
  const result = await query('UPDATE product_images SET is_thumbnail = TRUE WHERE id = $1 RETURNING *', [id]);
  return ok(res, result.rows[0], 'Đặt ảnh đại diện thành công.');
});

exports.reorder = asyncHandler(async (req, res) => {
  const { items } = req.body; // [{id, sort_order}]
  if (!Array.isArray(items)) throw new AppError('Dữ liệu sắp xếp không hợp lệ.', 400);
  for (const item of items) {
    await query('UPDATE product_images SET sort_order = $1 WHERE id = $2', [item.sort_order, item.id]);
  }
  return ok(res, null, 'Sắp xếp ảnh thành công.');
});

exports.remove = asyncHandler(async (req, res) => {
  const result = await query('DELETE FROM product_images WHERE id = $1 RETURNING *', [req.params.id]);
  if (!result.rows[0]) throw new AppError('Không tìm thấy ảnh.', 404);

  // image_url có thể chứa tên file tiếng Việt đã mã hoá URL (%C3%A2...) -> giải mã để xoá đúng file thật
  let fileName = path.basename(result.rows[0].image_url);
  try { fileName = decodeURIComponent(fileName); } catch (e) { /* giữ nguyên nếu không giải mã được */ }
  const filePath = path.join(__dirname, '..', '..', '..', 'uploads', 'products', fileName);
  fs.unlink(filePath, () => {}); // best-effort cleanup, ignore errors

  return ok(res, null, 'Xoá ảnh thành công.');
});
