const { query } = require("../../config/db");
const AppError = require("../../utils/AppError");

// Dùng chung các truy vấn giá, biến thể và đánh giá sản phẩm.
const PRICE_LATERAL = `
  LEFT JOIN LATERAL (
    SELECT
      MIN(COALESCE(sale_price, price)) AS min_price,
      MIN(price) AS raw_compare_price
    FROM product_variants
    WHERE product_id = p.id
      AND is_available = TRUE
  ) pp ON TRUE

  LEFT JOIN LATERAL (
    SELECT id
    FROM product_variants
    WHERE product_id = p.id
      AND is_available = TRUE
      AND stock_quantity > 0
    ORDER BY COALESCE(sale_price, price) ASC
    LIMIT 1
  ) cv ON TRUE

  LEFT JOIN LATERAL (
    SELECT
      ROUND(AVG(rating)::numeric, 2) AS avg_rating,
      COUNT(*) AS review_count
    FROM reviews
    WHERE product_id = p.id
  ) pr ON TRUE
`;

const PRICE_FIELDS = `
  pp.min_price,
  CASE
    WHEN pp.raw_compare_price > pp.min_price
    THEN pp.raw_compare_price
    ELSE NULL
  END AS compare_price,
  cv.id AS cheapest_variant_id,
  COALESCE(pr.avg_rating, 0) AS avg_rating,
  COALESCE(pr.review_count, 0) AS review_count
`;

function normalizeLimit(limit) {
  return Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
}

/**
 * HOT TREND
 * Ưu tiên sản phẩm có lượt xem trong 24 giờ gần nhất.
 * Nếu bằng nhau, xét lượt xem 7 ngày, sau đó đến trend_score.
 */
async function getHot({ limit }) {
  const limitNum = normalizeLimit(limit);

  const res = await query(
    `
      SELECT
        p.id,
        p.name,
        p.slug,
        tp.trend_score,
        tp.trend_label,
        tp.rank,
        pi.image_url AS thumbnail,

        COALESCE(views.views_24h, 0) AS views_24h,
        COALESCE(views.views_7d, 0) AS views_7d,

        ${PRICE_FIELDS}

      FROM trending_products tp

      JOIN products p
        ON p.id = tp.product_id

      LEFT JOIN LATERAL (
        SELECT image_url
        FROM product_images
        WHERE product_id = p.id
        ORDER BY is_thumbnail DESC, sort_order ASC
        LIMIT 1
      ) pi ON TRUE

      LEFT JOIN LATERAL (
        SELECT
          COUNT(*) FILTER (
            WHERE viewed_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
          ) AS views_24h,

          COUNT(*) FILTER (
            WHERE viewed_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
          ) AS views_7d

        FROM product_view_events
        WHERE product_id = p.id
      ) views ON TRUE

      ${PRICE_LATERAL}

      WHERE tp.is_active = TRUE
        AND p.is_available = TRUE

      ORDER BY
        views.views_24h DESC,
        views.views_7d DESC,
        tp.trend_score DESC,
        p.id ASC

      LIMIT $1
    `,
    [limitNum],
  );

  return res.rows;
}

/**
 * BEST SELLING
 * Lấy dữ liệu từ view best_selling_products.
 * View này cần tính total_sold theo trạng thái đơn hợp lệ,
 * loại trừ đơn đã hủy.
 */
async function getBestSelling({ limit }) {
  const limitNum = normalizeLimit(limit);

  const res = await query(
    `
      SELECT
        b.product_id AS id,
        b.name,
        b.slug,
        b.total_sold,
        b.order_count,

        pi.image_url AS thumbnail,

        ${PRICE_FIELDS}

      FROM best_selling_products b

      JOIN products p
        ON p.id = b.product_id

      LEFT JOIN LATERAL (
        SELECT image_url
        FROM product_images
        WHERE product_id = p.id
        ORDER BY is_thumbnail DESC, sort_order ASC
        LIMIT 1
      ) pi ON TRUE

      ${PRICE_LATERAL}

      WHERE p.is_available = TRUE
        AND COALESCE(b.total_sold, 0) > 0

      ORDER BY
        b.total_sold DESC,
        b.order_count DESC,
        p.id ASC

      LIMIT $1
    `,
    [limitNum],
  );

  return res.rows;
}

/**
 * Danh sách sản phẩm Hot Trend dành cho trang quản trị.
 */
async function adminList() {
  const res = await query(
    `
      SELECT
        tp.*,
        p.name,
        p.slug,
        pi.image_url AS thumbnail

      FROM trending_products tp

      JOIN products p
        ON p.id = tp.product_id

      LEFT JOIN LATERAL (
        SELECT image_url
        FROM product_images
        WHERE product_id = p.id
        ORDER BY is_thumbnail DESC, sort_order ASC
        LIMIT 1
      ) pi ON TRUE

      ORDER BY
        tp.is_active DESC,
        tp.trend_score DESC,
        tp.calculated_at DESC NULLS LAST
    `,
  );

  return res.rows;
}

/**
 * Thêm hoặc cập nhật sản phẩm Hot Trend.
 */
async function upsert({
  product_id,
  trend_score,
  rank,
  trend_label,
  is_active,
}) {
  if (!product_id) {
    throw new AppError("Vui lòng chọn sản phẩm.", 400);
  }

  const res = await query(
    `
      INSERT INTO trending_products (
        product_id,
        trend_score,
        rank,
        trend_label,
        is_active
      )
      VALUES (
        $1,
        COALESCE($2, 0),
        $3,
        $4,
        COALESCE($5, TRUE)
      )

      ON CONFLICT (product_id)
      DO UPDATE SET
        trend_score = COALESCE(
          $2,
          trending_products.trend_score
        ),
        rank = $3,
        trend_label = COALESCE(
          $4,
          trending_products.trend_label
        ),
        is_active = COALESCE(
          $5,
          trending_products.is_active
        ),
        calculated_at = CURRENT_TIMESTAMP

      RETURNING *
    `,
    [product_id, trend_score, rank || null, trend_label || null, is_active],
  );

  return res.rows[0];
}

/**
 * Xóa sản phẩm khỏi danh sách Hot Trend.
 */
async function remove(productId) {
  const res = await query(
    `
      DELETE FROM trending_products
      WHERE product_id = $1
      RETURNING *
    `,
    [productId],
  );

  if (res.rowCount === 0) {
    throw new AppError("Không tìm thấy sản phẩm Hot Trend.", 404);
  }

  return res.rows[0];
}

module.exports = {
  getHot,
  getBestSelling,
  adminList,
  upsert,
  remove,
};
