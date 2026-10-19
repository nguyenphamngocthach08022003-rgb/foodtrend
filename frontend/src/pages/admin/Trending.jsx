import { useEffect, useState } from 'react';
import { adminGetTrending, adminUpsertTrending, adminRemoveTrending, adminGetProducts } from '../../api/admin.api';
import TrendingBadge from '../../components/customer/TrendingBadge';

const LABELS = ['DANG_HOT', 'MOI_HOT', 'BAN_CHAY', 'HA_NHIET', 'AN_MON'];

export default function AdminTrending() {
  const [list, setList] = useState([]);
  const [productQuery, setProductQuery] = useState('');
  const [productOptions, setProductOptions] = useState([]);
  const [form, setForm] = useState({ product_id: '', trend_score: 50, trend_label: 'MOI_HOT', rank: '', is_active: true });

  const load = () => adminGetTrending().then(({ data }) => setList(data.data));
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!productQuery) return setProductOptions([]);
    const t = setTimeout(() => {
      adminGetProducts({ q: productQuery, limit: 8 }).then(({ data }) => setProductOptions(data.data));
    }, 300);
    return () => clearTimeout(t);
  }, [productQuery]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.product_id) return;
    await adminUpsertTrending({ ...form, rank: form.rank || null });
    setForm({ product_id: '', trend_score: 50, trend_label: 'MOI_HOT', rank: '', is_active: true });
    setProductQuery('');
    load();
  };

  const handleRemove = async (productId) => {
    if (!window.confirm('Gỡ sản phẩm này khỏi danh sách trending?')) return;
    await adminRemoveTrending(productId);
    load();
  };

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Quản lý Trending</h2>
      <p style={{ fontSize: 13, marginBottom: 20 }}>
        Điểm trend tự động tăng khi khách xem sản phẩm (chống spam 30 phút/thiết bị) và khi có đơn hàng mới.
        Bạn có thể ghi đè thủ công tại đây.
      </p>

      <form onSubmit={handleSubmit} className="card" style={{ padding: 20, marginBottom: 24, position: 'relative' }}>
        <h4 style={{ marginBottom: 14 }}>Thêm / cập nhật sản phẩm trending</h4>
        <div className="flex gap-8" style={{ marginBottom: 10 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input placeholder="Tìm sản phẩm..." value={productQuery} onChange={(e) => setProductQuery(e.target.value)} />
            {productOptions.length > 0 && (
              <div className="card" style={{ position: 'absolute', top: '105%', left: 0, right: 0, zIndex: 10, maxHeight: 200, overflowY: 'auto' }}>
                {productOptions.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    className="btn btn-ghost btn-block"
                    style={{ justifyContent: 'flex-start' }}
                    onClick={() => { setForm((f) => ({ ...f, product_id: p.id })); setProductQuery(p.name); setProductOptions([]); }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <select value={form.trend_label} onChange={(e) => setForm((f) => ({ ...f, trend_label: e.target.value }))}>
            {LABELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <input type="number" placeholder="Điểm" style={{ width: 100 }} value={form.trend_score} onChange={(e) => setForm((f) => ({ ...f, trend_score: e.target.value }))} />
          <input type="number" placeholder="Rank" style={{ width: 90 }} value={form.rank} onChange={(e) => setForm((f) => ({ ...f, rank: e.target.value }))} />
          <button className="btn btn-primary">Lưu</button>
        </div>
      </form>

      <div className="flex-col gap-10">
        {list.map((t) => (
          <div key={t.id} className="card flex items-center justify-between" style={{ padding: 14 }}>
            <div className="flex items-center gap-12">
              <TrendingBadge label={t.trend_label} />
              <strong>{t.name}</strong>
              <span style={{ fontSize: 13, color: 'var(--color-ink-soft)' }}>Điểm: {t.trend_score} {t.rank ? `• Rank #${t.rank}` : ''}</span>
            </div>
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-primary)' }} onClick={() => handleRemove(t.product_id)}>Gỡ khỏi trending</button>
          </div>
        ))}
      </div>
    </div>
  );
}
