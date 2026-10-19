const crypto = require('crypto');
const { query, withTransaction } = require('../../config/db');
const AppError = require('../../utils/AppError');
const slugify = require('../../utils/slugify');
const env = require('../../config/env');

// ---- helpers -------------------------------------------------------------

function getDeviceKey(req) {
  const provided = req.headers['x-device-key'];
  if (provided) return String(provided).slice(0, 255);
  const raw = `${req.ip}-${req.headers['user-agent'] || ''}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

const SORT_MAP = {
  price_asc: 'min_price ASC NULLS LAST, p.created_at DESC',
  price_desc: 'min_price DESC NULLS LAST, p.created_at DESC',
  newest: 'p.created_at DESC',
  trending: 'trend_score DESC NULLS LAST, p.created_at DESC',
  best_selling: 'total_sold DESC NULLS LAST, p.created_at DESC',
};

// ---- listing / search / filter / sort / pagination -----------------------

async function list({ q, category, min_price, max_price, trend_label, sort, page, limit }) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(48, Math.max(1, parseInt(limit, 10) || 12));
  const offset = (pageNum - 1) * limitNum;

  const conditions = ['p.is_available = TRUE'];
  const params = [];

  if (category) {
    params.push(category);
    conditions.push(`c.slug = $${params.length}`);
  }
  if (q) {
    params.push(`%${q}%`);
    // unaccent() giúp khách gõ không dấu ("chan ga") vẫn tìm ra "Chân gà"
    conditions.push(`unaccent(p.name) ILIKE unaccent($${params.length})`);
  }
  if (trend_label) {
    params.push(trend_label);
    conditions.push(`tp.trend_label = $${params.length}`);
  }

  const havingParts = [];
  if (min_price) {
    params.push(Number(min_price));
    havingParts.push(`min_price >= $${params.length}`);
  }
  if (max_price) {
    params.push(Number(max_price));
    havingParts.push(`min_price <= $${params.length}`);
  }

  const orderBy = SORT_MAP[sort] || 'trend_score DESC NULLS LAST, p.created_at DESC';

  params.push(limitNum);
  const limitIdx = params.length;
  params.push(offset);
  const offsetIdx = params.length;

  const sql = `
    WITH product_price AS (
      SELECT product_id,
             MIN(COALESCE(sale_price, price)) AS min_price,
             MAX(COALESCE(sale_price, price)) AS max_price,
             MIN(price) AS compare_price
      FROM product_variants
      WHERE is_available = TRUE
      GROUP BY product_id
    ),
    product_rating AS (
      SELECT product_id, ROUND(AVG(rating)::numeric, 2) AS avg_rating, COUNT(*) AS review_count
      FROM reviews GROUP BY product_id
    )
    SELECT
      p.id, p.name, p.slug, p.description, p.is_available, p.created_at,
      c.id AS category_id, c.name AS category_name, c.slug AS category_slug,
      pp.min_price, pp.max_price,
      CASE WHEN pp.compare_price > pp.min_price THEN pp.compare_price ELSE NULL END AS compare_price,
      cv.id AS cheapest_variant_id,
      COALESCE(pr.avg_rating, 0) AS avg_rating,
      COALESCE(pr.review_count, 0) AS review_count,
      pi.image_url AS thumbnail,
      COALESCE(tp.trend_score, 0) AS trend_score,
      tp.trend_label,
      COALESCE(bsp.total_sold, 0) AS total_sold,
      COUNT(*) OVER() AS total_count
    FROM products p
    JOIN categories c ON c.id = p.category_id
    LEFT JOIN product_price pp ON pp.product_id = p.id
    LEFT JOIN product_rating pr ON pr.product_id = p.id
    LEFT JOIN LATERAL (
      SELECT image_url FROM product_images
      WHERE product_id = p.id
      ORDER BY is_thumbnail DESC, sort_order ASC
      LIMIT 1
    ) pi ON TRUE
    LEFT JOIN LATERAL (
      SELECT id FROM product_variants
      WHERE product_id = p.id AND is_available = TRUE AND stock_quantity > 0
      ORDER BY COALESCE(sale_price, price) ASC
      LIMIT 1
    ) cv ON TRUE
    LEFT JOIN trending_products tp ON tp.product_id = p.id
    LEFT JOIN best_selling_products bsp ON bsp.product_id = p.id
    WHERE ${conditions.join(' AND ')}
    ${havingParts.length ? `AND ${havingParts.join(' AND ')}` : ''}
    ORDER BY ${orderBy}
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;

  const result = await query(sql, params);
  const totalCount = result.rows[0] ? Number(result.rows[0].total_count) : 0;
  const items = result.rows.map(({ total_count, ...rest }) => rest);

  return {
    items,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / limitNum)),
    },
  };
}

// ---- detail ---------------------------------------------------------------

async function getBySlug(slug, { req, userId } = {}) {
  const productRes = await query(
    `SELECT p.*, c.name AS category_name, c.slug AS category_slug
     FROM products p JOIN categories c ON c.id = p.category_id
     WHERE p.slug = $1`,
    [slug]
  );
  const product = productRes.rows[0];
  if (!product) throw new AppError('Không tìm thấy sản phẩm.', 404);

  if (req) {
    // Track trước khi đọc trend_score để response phản ánh đúng điểm mới nhất
    await trackView(product.id, req, userId);
  }

  const [variantsRes, imagesRes, ratingRes, trendRes, favRes] = await Promise.all([
    query(
      `SELECT id, variant_name, price, sale_price, stock_quantity, is_available
       FROM product_variants WHERE product_id = $1 ORDER BY price ASC`,
      [product.id]
    ),
    query(
      `SELECT id, image_url, sort_order, is_thumbnail
       FROM product_images WHERE product_id = $1 ORDER BY is_thumbnail DESC, sort_order ASC`,
      [product.id]
    ),
    query(
      `SELECT ROUND(AVG(rating)::numeric, 2) AS avg_rating, COUNT(*) AS review_count
       FROM reviews WHERE product_id = $1`,
      [product.id]
    ),
    query(`SELECT trend_score, trend_label, rank, is_active FROM trending_products WHERE product_id = $1`, [
      product.id,
    ]),
    userId
      ? query('SELECT id FROM favorites WHERE user_id = $1 AND product_id = $2', [userId, product.id])
      : Promise.resolve({ rows: [] }),
  ]);

  return {
    ...product,
    variants: variantsRes.rows,
    images: imagesRes.rows,
    avg_rating: Number(ratingRes.rows[0]?.avg_rating || 0),
    review_count: Number(ratingRes.rows[0]?.review_count || 0),
    trending: trendRes.rows[0] || null,
    is_favorited: favRes.rows.length > 0,
  };
}

// ---- anti-spam view tracking (30p/thiết bị mặc định) -----------------------

async function trackView(productId, req, userId) {
  const deviceKey = getDeviceKey(req);
  const windowMinutes = env.viewSpamWindowMinutes;

  const recent = await query(
    `SELECT id FROM product_view_events
     WHERE product_id = $1 AND device_key = $2
       AND viewed_at > CURRENT_TIMESTAMP - ($3 || ' minutes')::interval
     LIMIT 1`,
    [productId, deviceKey, windowMinutes]
  );

  if (recent.rows.length > 0) {
    return false; // spam trong khung thời gian -> không tính thêm view
  }

  await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO product_view_events (product_id, user_id, device_key) VALUES ($1, $2, $3)`,
      [productId, userId || null, deviceKey]
    );
    await client.query(
      `INSERT INTO trending_products (product_id, trend_score, trend_label)
       VALUES ($1, 1, 'MOI_HOT')
       ON CONFLICT (product_id)
       DO UPDATE SET trend_score = trending_products.trend_score + 1, calculated_at = CURRENT_TIMESTAMP`,
      [productId]
    );
  });

  return true;
}

// Called by orders.service when an order is placed successfully
async function bumpTrendForPurchase(client, productId, quantity) {
  const points = quantity * 5;
  await client.query(
    `INSERT INTO trending_products (product_id, trend_score, trend_label)
     VALUES ($1, $2, 'BAN_CHAY')
     ON CONFLICT (product_id)
     DO UPDATE SET trend_score = trending_products.trend_score + $2, calculated_at = CURRENT_TIMESTAMP`,
    [productId, points]
  );
}

// ---- admin CRUD -------------------------------------------------------------

async function adminList({ q, category, page, limit }) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  const conditions = ['1=1'];
  const params = [];
  if (q) {
    params.push(`%${q}%`);
    conditions.push(`unaccent(p.name) ILIKE unaccent($${params.length})`);
  }
  if (category) {
    params.push(category);
    conditions.push(`p.category_id = $${params.length}`);
  }
  params.push(limitNum);
  const limitIdx = params.length;
  params.push(offset);
  const offsetIdx = params.length;

  const sql = `
    SELECT p.*, c.name AS category_name,
           (SELECT COUNT(*) FROM product_variants pv WHERE pv.product_id = p.id) AS variant_count,
           COUNT(*) OVER() AS total_count
    FROM products p
    JOIN categories c ON c.id = p.category_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY p.created_at DESC
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;
  const result = await query(sql, params);
  const totalCount = result.rows[0] ? Number(result.rows[0].total_count) : 0;
  const items = result.rows.map(({ total_count, ...rest }) => rest);
  return {
    items,
    pagination: { page: pageNum, limit: limitNum, total: totalCount, totalPages: Math.max(1, Math.ceil(totalCount / limitNum)) },
  };
}

async function adminGetById(id) {
  const productRes = await query('SELECT * FROM products WHERE id = $1', [id]);
  const product = productRes.rows[0];
  if (!product) throw new AppError('Không tìm thấy sản phẩm.', 404);
  const [variants, images] = await Promise.all([
    query('SELECT * FROM product_variants WHERE product_id = $1 ORDER BY created_at ASC', [id]),
    query('SELECT * FROM product_images WHERE product_id = $1 ORDER BY sort_order ASC', [id]),
  ]);
  return { ...product, variants: variants.rows, images: images.rows };
}

async function create({ category_id, name, description, is_available, variants }) {
  if (!category_id || !name) throw new AppError('Vui lòng nhập danh mục và tên sản phẩm.', 400);
  const slug = slugify(name);

  return withTransaction(async (client) => {
    const productRes = await client.query(
      `INSERT INTO products (category_id, name, slug, description, is_available)
       VALUES ($1,$2,$3,$4,COALESCE($5, TRUE)) RETURNING *`,
      [category_id, name, slug, description || null, is_available]
    );
    const product = productRes.rows[0];

    if (Array.isArray(variants) && variants.length > 0) {
      for (const v of variants) {
        await client.query(
          `INSERT INTO product_variants (product_id, variant_name, price, sale_price, stock_quantity)
           VALUES ($1,$2,$3,$4,$5)`,
          [product.id, v.variant_name, v.price, v.sale_price || null, v.stock_quantity || 0]
        );
      }
    }
    return product;
  });
}

async function update(id, { category_id, name, description, is_available }) {
  const existing = await query('SELECT * FROM products WHERE id = $1', [id]);
  if (!existing.rows[0]) throw new AppError('Không tìm thấy sản phẩm.', 404);

  const slug = name ? slugify(name) : existing.rows[0].slug;

  const res = await query(
    `UPDATE products SET
       category_id = COALESCE($1, category_id),
       name = COALESCE($2, name),
       slug = $3,
       description = COALESCE($4, description),
       is_available = COALESCE($5, is_available)
     WHERE id = $6 RETURNING *`,
    [category_id || null, name || null, slug, description ?? null, is_available ?? null, id]
  );
  return res.rows[0];
}

async function remove(id) {
  const res = await query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
  if (!res.rows[0]) throw new AppError('Không tìm thấy sản phẩm.', 404);
  return true;
}

module.exports = {
  list,
  getBySlug,
  trackView,
  bumpTrendForPurchase,
  adminList,
  adminGetById,
  create,
  update,
  remove,
  getDeviceKey,
};
