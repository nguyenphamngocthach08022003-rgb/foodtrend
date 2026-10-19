const { query } = require('../../config/db');
const AppError = require('../../utils/AppError');
const slugify = require('../../utils/slugify');

async function listActive() {
  const res = await query(
    `SELECT id, name, slug, description, image_url
     FROM categories WHERE is_active = TRUE ORDER BY name ASC`
  );
  return res.rows;
}

async function listAll() {
  const res = await query(`SELECT * FROM categories ORDER BY created_at DESC`);
  return res.rows;
}

async function getBySlug(slug) {
  const res = await query('SELECT * FROM categories WHERE slug = $1', [slug]);
  if (!res.rows[0]) throw new AppError('Không tìm thấy danh mục.', 404);
  return res.rows[0];
}

async function create({ name, description, image_url }) {
  if (!name) throw new AppError('Vui lòng nhập tên danh mục.', 400);
  const slug = slugify(name);
  const res = await query(
    `INSERT INTO categories (name, slug, description, image_url) VALUES ($1,$2,$3,$4) RETURNING *`,
    [name, slug, description || null, image_url || null]
  );
  return res.rows[0];
}

async function update(id, { name, description, image_url, is_active }) {
  const existing = await query('SELECT * FROM categories WHERE id = $1', [id]);
  if (!existing.rows[0]) throw new AppError('Không tìm thấy danh mục.', 404);

  const slug = name ? slugify(name) : existing.rows[0].slug;

  const res = await query(
    `UPDATE categories SET
       name = COALESCE($1, name),
       slug = $2,
       description = COALESCE($3, description),
       image_url = COALESCE($4, image_url),
       is_active = COALESCE($5, is_active)
     WHERE id = $6 RETURNING *`,
    [name || null, slug, description ?? null, image_url ?? null, is_active ?? null, id]
  );
  return res.rows[0];
}

async function remove(id) {
  const productCount = await query('SELECT COUNT(*) FROM products WHERE category_id = $1', [id]);
  if (Number(productCount.rows[0].count) > 0) {
    throw new AppError('Không thể xoá danh mục còn sản phẩm. Hãy chuyển sản phẩm sang danh mục khác trước.', 409);
  }
  const res = await query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
  if (!res.rows[0]) throw new AppError('Không tìm thấy danh mục.', 404);
  return true;
}

module.exports = { listActive, listAll, getBySlug, create, update, remove };
