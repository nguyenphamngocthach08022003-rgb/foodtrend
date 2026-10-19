import { useEffect, useState } from 'react';
import { adminGetCoupons, adminCreateCoupon, adminUpdateCoupon, adminDeleteCoupon } from '../../api/admin.api';
import { formatMoney } from '../../components/common/Money';

const emptyForm = {
  code: '', description: '', discount_type: 'PERCENT', discount_value: '', min_order_amount: 0,
  max_discount_amount: '', usage_limit: '', start_at: '', end_at: '', is_active: true,
};

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState(null);

  const load = () => adminGetCoupons().then(({ data }) => setCoupons(data.data));
  useEffect(() => { load(); }, []);

  const resetForm = () => { setForm({ ...emptyForm }); setEditingId(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (editingId) await adminUpdateCoupon(editingId, payload);
    else await adminCreateCoupon(payload);
    resetForm();
    load();
  };

  const handleEdit = (c) => {
    setForm({
      code: c.code, description: c.description || '', discount_type: c.discount_type, discount_value: c.discount_value,
      min_order_amount: c.min_order_amount, max_discount_amount: c.max_discount_amount || '', usage_limit: c.usage_limit || '',
      start_at: c.start_at.slice(0, 16), end_at: c.end_at.slice(0, 16), is_active: c.is_active,
    });
    setEditingId(c.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xoá mã giảm giá này?')) return;
    await adminDeleteCoupon(id);
    load();
  };

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Mã giảm giá</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24 }}>
        <form onSubmit={handleSubmit} className="card" style={{ padding: 20, alignSelf: 'start' }}>
          <h4 style={{ marginBottom: 14 }}>{editingId ? 'Sửa mã' : 'Tạo mã mới'}</h4>
          <div className="flex-col gap-10">
            <input placeholder="Mã (VD: SALE20)" value={form.code} disabled={!!editingId} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} required />
            <input placeholder="Mô tả" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            <select value={form.discount_type} onChange={(e) => setForm((f) => ({ ...f, discount_type: e.target.value }))}>
              <option value="PERCENT">Giảm theo % </option>
              <option value="FIXED">Giảm số tiền cố định</option>
            </select>
            <input type="number" placeholder={form.discount_type === 'PERCENT' ? 'Phần trăm giảm (VD: 20)' : 'Số tiền giảm (VD: 30000)'} value={form.discount_value} onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))} required />
            <input type="number" placeholder="Đơn tối thiểu" value={form.min_order_amount} onChange={(e) => setForm((f) => ({ ...f, min_order_amount: e.target.value }))} />
            {form.discount_type === 'PERCENT' && (
              <input type="number" placeholder="Giảm tối đa (đ)" value={form.max_discount_amount} onChange={(e) => setForm((f) => ({ ...f, max_discount_amount: e.target.value }))} />
            )}
            <input type="number" placeholder="Giới hạn lượt dùng (để trống = không giới hạn)" value={form.usage_limit} onChange={(e) => setForm((f) => ({ ...f, usage_limit: e.target.value }))} />
            <label style={{ fontSize: 13 }}>Bắt đầu</label>
            <input type="datetime-local" value={form.start_at} onChange={(e) => setForm((f) => ({ ...f, start_at: e.target.value }))} required />
            <label style={{ fontSize: 13 }}>Kết thúc</label>
            <input type="datetime-local" value={form.end_at} onChange={(e) => setForm((f) => ({ ...f, end_at: e.target.value }))} required />
            <label className="flex items-center gap-8">
              <input type="checkbox" style={{ width: 'auto' }} checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
              Đang hoạt động
            </label>
            <div className="flex gap-8">
              <button className="btn btn-primary">{editingId ? 'Cập nhật' : 'Tạo mã'}</button>
              {editingId && <button type="button" className="btn btn-outline" onClick={resetForm}>Huỷ</button>}
            </div>
          </div>
        </form>

        <div className="flex-col gap-10">
          {coupons.map((c) => (
            <div key={c.id} className="card flex items-center justify-between" style={{ padding: 16 }}>
              <div>
                <strong style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>{c.code}</strong>{' '}
                <span className="badge" style={{ background: c.is_active ? 'var(--color-green)' : 'var(--color-ink-soft)' }}>{c.is_active ? 'Hoạt động' : 'Tắt'}</span>
                <div style={{ fontSize: 14 }}>{c.description}</div>
                <div style={{ fontSize: 12, color: 'var(--color-ink-soft)' }}>
                  Đã dùng {c.used_count}{c.usage_limit ? `/${c.usage_limit}` : ''} • Đơn tối thiểu {formatMoney(c.min_order_amount)}
                </div>
              </div>
              <div className="flex gap-8">
                <button className="btn btn-outline btn-sm" onClick={() => handleEdit(c)}>Sửa</button>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-primary)' }} onClick={() => handleDelete(c.id)}>Xoá</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
