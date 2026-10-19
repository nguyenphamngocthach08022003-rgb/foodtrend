/* =========================================================================
   Gắn ảnh đã COPY TAY vào backend/uploads/products với sản phẩm trong DB.

   Vì sao cần? Web chỉ hiển thị ảnh mà bảng product_images trỏ tới. Copy file
   vào thư mục uploads thôi thì database chưa biết file đó thuộc sản phẩm nào.

   Cách dùng (chạy trong thư mục backend):
     node scripts/linkImages.js           -> CHẠY THỬ: chỉ in kết quả ghép, KHÔNG ghi DB
     node scripts/linkImages.js --apply   -> ghi thật vào DB

   Ghép theo độ giống tên (bỏ dấu, chịu được gõ sai nhẹ như "xã"/"sả", "dã"/"giã").
   Trường hợp mơ hồ hoặc không khớp sẽ được BÁO RA chứ không tự đoán bừa.
   Muốn ép ghép tay: tạo file scripts/image-map.json, ví dụ:
     { "Chân gà": "chan-ga-sot-tac", "Kem dâu": "matcha-dau" }
   (khoá = tên file không có đuôi, giá trị = slug của sản phẩm)
   ========================================================================= */
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/db');

const DIR = path.join(__dirname, '..', 'uploads', 'products');
const MAP_FILE = path.join(__dirname, 'image-map.json');
const EXTS = ['.jpg', '.jpeg', '.png', '.webp'];
const APPLY = process.argv.includes('--apply');

const ACCEPT_SCORE = 0.72; // điểm tối thiểu để tự ghép
const MIN_MARGIN = 0.04; // phải hơn ứng viên thứ 2 ít nhất ngần này, nếu không coi là mơ hồ

// ---------- chuẩn hoá & so khớp tên ----------
function norm(s) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function bigrams(str) {
  const out = new Map();
  for (let i = 0; i < str.length - 1; i += 1) {
    const g = str.slice(i, i + 2);
    out.set(g, (out.get(g) || 0) + 1);
  }
  return out;
}

function dice(a, b) {
  if (a.length < 2 || b.length < 2) return a === b ? 1 : 0;
  const A = bigrams(a);
  const B = bigrams(b);
  let inter = 0;
  A.forEach((cnt, g) => {
    if (B.has(g)) inter += Math.min(cnt, B.get(g));
  });
  return (2 * inter) / (a.length - 1 + b.length - 1);
}

function lev(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j += 1) dp[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[a.length][b.length];
}

function tokenSim(t, u) {
  if (t === u) return 1;
  if (t.length >= 3 && u.length >= 3 && lev(t, u) === 1) return 0.7;
  return 0;
}

function cover(from, to) {
  if (from.length === 0) return 0;
  const sum = from.reduce((acc, t) => acc + Math.max(0, ...to.map((u) => tokenSim(t, u))), 0);
  return sum / from.length;
}

function score(fileName, productName) {
  const f = norm(fileName);
  const p = norm(productName);
  const d = dice(f.replace(/ /g, ''), p.replace(/ /g, ''));
  const ft = f.split(' ');
  const pt = p.split(' ');
  const tok = 0.65 * cover(ft, pt) + 0.35 * cover(pt, ft);
  return 0.5 * d + 0.5 * tok;
}

// ---------- chính ----------
async function main() {
  if (!fs.existsSync(DIR)) {
    console.log(`Không thấy thư mục ảnh: ${DIR}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(DIR)
    .filter((f) => EXTS.includes(path.extname(f).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, 'vi'));

  if (files.length === 0) {
    console.log('Thư mục uploads/products chưa có file ảnh (.jpg/.jpeg/.png/.webp) nào.');
    process.exit(0);
  }

  const { rows: products } = await pool.query('SELECT id, name, slug FROM products ORDER BY name');
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  // Ảnh "hỏng": dòng trong DB trỏ tới /uploads/products/<file> nhưng file đó không còn trong thư mục
  // (vd ảnh từng upload qua admin rồi bị xoá thư mục cũ) -> web sẽ báo 404.
  const { rows: allImages } = await pool.query('SELECT id, product_id, image_url FROM product_images');
  const isBroken = (row) => {
    if (!row.image_url.startsWith('/uploads/products/')) return false;
    let name = path.basename(row.image_url);
    try { name = decodeURIComponent(name); } catch (e) { /* giữ nguyên */ }
    return !fs.existsSync(path.join(DIR, name));
  };
  const brokenRows = allImages.filter(isBroken);
  const brokenIds = brokenRows.map((r) => r.id);
  const manual = fs.existsSync(MAP_FILE) ? JSON.parse(fs.readFileSync(MAP_FILE, 'utf8')) : {};

  const matched = new Map(); // product.id -> { product, files: [{file, score}] }
  const unmatched = [];

  files.forEach((file) => {
    const base = path.basename(file, path.extname(file));

    if (manual[base]) {
      const prod = bySlug.get(manual[base]);
      if (!prod) {
        unmatched.push({ file, reason: `image-map.json trỏ tới slug "${manual[base]}" nhưng không có sản phẩm này` });
        return;
      }
      if (!matched.has(prod.id)) matched.set(prod.id, { product: prod, files: [] });
      matched.get(prod.id).files.push({ file, score: 1, manual: true });
      return;
    }

    // Quy tắc "nằm trọn": tên file (bỏ dấu, bỏ khoảng trắng) là một phần của tên sản phẩm
    // và CHỈ có đúng 1 sản phẩm chứa nó (vd "bơ già" -> "Bơ già dừa non").
    const compactFile = norm(base).replace(/ /g, '');
    if (compactFile.length >= 5) {
      const containing = products.filter((p) => norm(p.name).replace(/ /g, '').includes(compactFile));
      if (containing.length === 1) {
        if (!matched.has(containing[0].id)) matched.set(containing[0].id, { product: containing[0], files: [] });
        // điểm thấp hơn khớp chuẩn để ảnh khớp đủ tên luôn được chọn làm ảnh chính
        matched.get(containing[0].id).files.push({ file, score: 0.75, contained: true });
        return;
      }
    }

    const ranked = products
      .map((p) => ({ p, s: score(base, p.name) }))
      .sort((a, b) => b.s - a.s);
    const best = ranked[0];
    const second = ranked[1];

    if (best.s < ACCEPT_SCORE) {
      unmatched.push({ file, reason: `không khớp sản phẩm nào (giống nhất: "${best.p.name}", ${best.s.toFixed(2)})` });
      return;
    }
    if (second && best.s - second.s < MIN_MARGIN) {
      unmatched.push({
        file,
        reason: `mơ hồ giữa "${best.p.name}" (${best.s.toFixed(2)}) và "${second.p.name}" (${second.s.toFixed(2)})`,
      });
      return;
    }
    if (!matched.has(best.p.id)) matched.set(best.p.id, { product: best.p, files: [] });
    matched.get(best.p.id).files.push({ file, score: best.s });
  });

  // ---------- in kết quả ----------
  console.log(`\nTìm thấy ${files.length} file ảnh, ${products.length} sản phẩm trong DB.\n`);
  console.log('✅ GHÉP ĐƯỢC:');
  [...matched.values()]
    .sort((a, b) => a.product.name.localeCompare(b.product.name, 'vi'))
    .forEach(({ product, files: fl }) => {
      fl.sort((a, b) => b.score - a.score);
      fl.forEach((f, i) => {
        const role = i === 0 ? 'ảnh chính ' : 'ảnh phụ  ';
        console.log(`   ${role} "${f.file}"  →  ${product.name}  ${f.manual ? '(ghép tay)' : f.contained ? '(tên nằm trọn trong tên sản phẩm)' : `(độ giống ${f.score.toFixed(2)})`}`);
      });
    });

  if (unmatched.length) {
    console.log('\n⚠️  CHƯA GHÉP ĐƯỢC (cần xử lý tay, xem hướng dẫn image-map.json ở đầu file script):');
    unmatched.forEach((u) => console.log(`   "${u.file}"  —  ${u.reason}`));
  }

  if (brokenRows.length) {
    const names = new Map(products.map((p) => [p.id, p.name]));
    const perProduct = new Map();
    brokenRows.forEach((r) => perProduct.set(r.product_id, (perProduct.get(r.product_id) || 0) + 1));
    console.log(`\n🧹 ẢNH HỎNG: ${brokenRows.length} dòng trong DB trỏ tới file KHÔNG còn trong uploads/products (đang gây lỗi 404). Sẽ được dọn khi --apply:`);
    perProduct.forEach((n, id) => console.log(`   ${names.get(id)}: ${n} ảnh`));
  }

  const withoutImage = products.filter((p) => !matched.has(p.id));
  if (withoutImage.length) {
    console.log('\nℹ️  Sản phẩm CHƯA có file ảnh tương ứng (giữ nguyên ảnh hiện tại):');
    withoutImage.forEach((p) => console.log(`   ${p.name}`));
  }

  if (!APPLY) {
    console.log('\n👉 Đây mới là CHẠY THỬ, chưa ghi gì vào database.');
    console.log('   Nếu kết quả ghép đúng, chạy:  node scripts/linkImages.js --apply\n');
    await pool.end();
    return;
  }

  // ---------- ghi DB ----------
  const client = await pool.connect();
  let added = 0;
  let removedPlaceholders = 0;
  const summary = { restoredPlaceholders: 0 };
  try {
    await client.query('BEGIN');

    if (brokenIds.length) {
      await client.query('DELETE FROM product_images WHERE id = ANY($1::uuid[])', [brokenIds]);
    }

    for (const { product, files: fl } of matched.values()) {
      // Xoá ảnh giả placehold.co của seed (ảnh thật do admin upload được giữ nguyên)
      const del = await client.query(
        `DELETE FROM product_images WHERE product_id = $1 AND image_url LIKE 'https://placehold.co%'`,
        [product.id]
      );
      removedPlaceholders += del.rowCount;

      const cur = await client.query(
        'SELECT COALESCE(MAX(sort_order), -1) AS max_sort, BOOL_OR(is_thumbnail) AS has_thumb FROM product_images WHERE product_id = $1',
        [product.id]
      );
      let nextSort = Number(cur.rows[0].max_sort) + 1;
      let hasThumb = Boolean(cur.rows[0].has_thumb);

      for (const f of fl) {
        const url = `/uploads/products/${encodeURIComponent(f.file)}`;
        const exists = await client.query('SELECT 1 FROM product_images WHERE product_id = $1 AND image_url = $2', [product.id, url]);
        if (exists.rowCount) continue;
        await client.query(
          'INSERT INTO product_images (product_id, image_url, sort_order, is_thumbnail) VALUES ($1,$2,$3,$4)',
          [product.id, url, nextSort, !hasThumb]
        );
        nextSort += 1;
        hasThumb = true;
        added += 1;
      }
    }
    // Đảm bảo mọi sản phẩm đều có ảnh và có đúng 1 ảnh chính
    let restoredPlaceholders = 0;
    for (const p of products) {
      const cnt = await client.query('SELECT COUNT(*) AS n, BOOL_OR(is_thumbnail) AS has_thumb FROM product_images WHERE product_id = $1', [p.id]);
      if (Number(cnt.rows[0].n) === 0) {
        const text = encodeURIComponent(p.name).replace(/%20/g, '+');
        await client.query(
          'INSERT INTO product_images (product_id, image_url, sort_order, is_thumbnail) VALUES ($1,$2,0,TRUE)',
          [p.id, `https://placehold.co/800x800?text=${text}`]
        );
        restoredPlaceholders += 1;
      } else if (!cnt.rows[0].has_thumb) {
        await client.query(
          `UPDATE product_images SET is_thumbnail = TRUE
           WHERE id = (SELECT id FROM product_images WHERE product_id = $1 ORDER BY sort_order, created_at LIMIT 1)`,
          [p.id]
        );
      }
    }
    summary.restoredPlaceholders = restoredPlaceholders;

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  console.log(
    `\n✅ ĐÃ GHI VÀO DATABASE: thêm ${added} ảnh, xoá ${removedPlaceholders} ảnh giả placehold.co, ` +
    `dọn ${brokenIds.length} dòng ảnh hỏng` +
    (summary.restoredPlaceholders ? `, gắn lại ảnh giả cho ${summary.restoredPlaceholders} sản phẩm chưa có ảnh thật` : '') + '.'
  );
  console.log('   Tải lại trang web (Ctrl+F5) để thấy ảnh mới.\n');
  await pool.end();
}

main().catch((err) => {
  console.error('Lỗi:', err.message);
  process.exit(1);
});
