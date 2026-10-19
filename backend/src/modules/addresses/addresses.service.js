const { query, withTransaction } = require("../../config/db");
const AppError = require("../../utils/AppError");

async function list(userId) {
  const res = await query(
    `SELECT * FROM user_addresses
     WHERE user_id = $1
     ORDER BY is_default DESC, created_at DESC`,
    [userId],
  );

  return res.rows;
}

async function create(userId, data) {
  const {
    label,
    receiver_name,
    receiver_phone,
    province_code,
    province_name,
    district_code,
    district_name,
    ward_code,
    ward_name,
    street_address,
    is_default,
  } = data;

  // Quận/huyện không còn bắt buộc.
  if (
    !receiver_name ||
    !receiver_phone ||
    !province_code ||
    !province_name ||
    !ward_code ||
    !ward_name ||
    !street_address
  ) {
    throw new AppError("Vui lòng nhập đầy đủ thông tin địa chỉ.", 400);
  }

  return withTransaction(async (client) => {
    if (is_default) {
      await client.query(
        "UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1",
        [userId],
      );
    }

    const existingCount = await client.query(
      "SELECT COUNT(*) FROM user_addresses WHERE user_id = $1",
      [userId],
    );

    const shouldBeDefault =
      Boolean(is_default) || Number(existingCount.rows[0].count) === 0;

    const res = await client.query(
      `INSERT INTO user_addresses (
        user_id, label, receiver_name, receiver_phone,
        province_code, province_name,
        district_code, district_name,
        ward_code, ward_name,
        street_address, is_default
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        userId,
        label || "Nhà riêng",
        receiver_name,
        receiver_phone,
        province_code,
        province_name,
        district_code || null,
        district_name || null,
        ward_code,
        ward_name,
        street_address,
        shouldBeDefault,
      ],
    );

    return res.rows[0];
  });
}

async function update(userId, id, data) {
  const existing = await query(
    "SELECT * FROM user_addresses WHERE id = $1 AND user_id = $2",
    [id, userId],
  );

  if (!existing.rows[0]) {
    throw new AppError("Không tìm thấy địa chỉ.", 404);
  }

  const {
    label,
    receiver_name,
    receiver_phone,
    province_code,
    province_name,
    district_code,
    district_name,
    ward_code,
    ward_name,
    street_address,
    is_default,
  } = data;

  return withTransaction(async (client) => {
    if (is_default === true) {
      await client.query(
        "UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1",
        [userId],
      );
    }

    const res = await client.query(
      `UPDATE user_addresses SET
        label = COALESCE($1, label),
        receiver_name = COALESCE($2, receiver_name),
        receiver_phone = COALESCE($3, receiver_phone),
        province_code = COALESCE($4, province_code),
        province_name = COALESCE($5, province_name),
        district_code = COALESCE($6, district_code),
        district_name = COALESCE($7, district_name),
        ward_code = COALESCE($8, ward_code),
        ward_name = COALESCE($9, ward_name),
        street_address = COALESCE($10, street_address),
        is_default = COALESCE($11, is_default)
      WHERE id = $12 AND user_id = $13
      RETURNING *`,
      [
        label ?? null,
        receiver_name ?? null,
        receiver_phone ?? null,
        province_code ?? null,
        province_name ?? null,
        district_code ?? null,
        district_name ?? null,
        ward_code ?? null,
        ward_name ?? null,
        street_address ?? null,
        is_default ?? null,
        id,
        userId,
      ],
    );

    return res.rows[0];
  });
}

async function remove(userId, id) {
  const res = await query(
    "DELETE FROM user_addresses WHERE id = $1 AND user_id = $2 RETURNING id",
    [id, userId],
  );

  if (!res.rows[0]) {
    throw new AppError("Không tìm thấy địa chỉ.", 404);
  }

  return true;
}

async function setDefault(userId, id) {
  return withTransaction(async (client) => {
    const existing = await client.query(
      "SELECT id FROM user_addresses WHERE id = $1 AND user_id = $2",
      [id, userId],
    );

    if (!existing.rows[0]) {
      throw new AppError("Không tìm thấy địa chỉ.", 404);
    }

    await client.query(
      "UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1",
      [userId],
    );

    const res = await client.query(
      `UPDATE user_addresses
       SET is_default = TRUE
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId],
    );

    return res.rows[0];
  });
}

module.exports = { list, create, update, remove, setDefault };
