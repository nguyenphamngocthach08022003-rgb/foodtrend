import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getProducts } from '../../api/products.api';
import { getCategories } from '../../api/categories.api';
import ProductCard from '../../components/customer/ProductCard';
import Pagination from '../../components/common/Pagination';
import { getCategoryStyle } from '../../utils/categoryStyle';

const SORT_OPTIONS = [
  { value: '', label: 'Nổi bật' },
  { value: 'trending', label: 'Đang hot' },
  { value: 'best_selling', label: 'Bán chạy' },
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
];

export default function ProductList() {
  const [params, setParams] = useSearchParams();
  const [result, setResult] = useState({ items: [], pagination: { page: 1, totalPages: 1 } });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const q = params.get('q') || '';
  const category = params.get('category') || '';
  const sort = params.get('sort') || '';
  const min_price = params.get('min_price') || '';
  const max_price = params.get('max_price') || '';
  const page = Number(params.get('page') || 1);

  useEffect(() => {
    getCategories().then(({ data }) => setCategories(data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    getProducts({ q, category, sort, min_price, max_price, page, limit: 12 })
      .then(({ data }) => setResult({ items: data.data, pagination: data.pagination }))
      .finally(() => setLoading(false));
  }, [q, category, sort, min_price, max_price, page]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  return (
    <div className="container" style={{ padding: '32px 20px 60px' }}>
      <div className="section-title">
        <h2>{q ? `Kết quả cho "${q}"` : 'Tất cả sản phẩm'}</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 28 }}>
        {/* FILTERS */}
        <aside className="card" style={{ padding: 18, alignSelf: 'start' }}>
          <h4 style={{ fontSize: 15, marginBottom: 12 }}>Danh mục</h4>
          <div className="cat-filter-list" style={{ marginBottom: 22 }}>
            <button
              className={`cat-chip${category === '' ? ' is-active' : ''}`}
              onClick={() => updateParam('category', '')}
            >
              <span className="cat-chip-icon" style={{ background: 'var(--color-primary-tint)', color: 'var(--color-primary)' }}>🍽️</span>
              Tất cả
            </button>
            {categories.map((c) => {
              const style = getCategoryStyle(c.slug);
              const isActive = category === c.slug;
              return (
                <button
                  key={c.id}
                  className={`cat-chip${isActive ? ' is-active' : ''}`}
                  onClick={() => updateParam('category', c.slug)}
                >
                  <span className="cat-chip-icon" style={{ background: style.bg, color: style.fg }}>{style.icon}</span>
                  {c.name}
                </button>
              );
            })}
          </div>

          <h4 style={{ fontSize: 15, marginBottom: 10 }}>Khoảng giá</h4>
          <div className="flex gap-8" style={{ marginBottom: 8 }}>
            <input type="number" placeholder="Từ" defaultValue={min_price} onBlur={(e) => updateParam('min_price', e.target.value)} />
            <input type="number" placeholder="Đến" defaultValue={max_price} onBlur={(e) => updateParam('max_price', e.target.value)} />
          </div>
        </aside>

        {/* RESULTS */}
        <div>
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <span style={{ color: 'var(--color-ink-soft)', fontSize: 14 }}>
              {result.pagination.total ?? 0} sản phẩm
            </span>
            <select value={sort} onChange={(e) => updateParam('sort', e.target.value)} style={{ width: 180 }}>
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="grid-products">
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton" style={{ aspectRatio: '3/4' }} />)}
            </div>
          ) : result.items.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <p>Không tìm thấy sản phẩm phù hợp.</p>
            </div>
          ) : (
            <div className="grid-products">
              {result.items.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}

          <Pagination page={result.pagination.page} totalPages={result.pagination.totalPages} onChange={(p) => updateParam('page', p)} />
        </div>
      </div>
    </div>
  );
}
