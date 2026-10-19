import { useEffect, useState } from 'react';
import { adminGetCategories, adminCreateCategory, adminUpdateCategory, adminDeleteCategory } from '../../api/admin.api';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', image_url: '' });
  const [editingId, setEditingId] = useState(null);

  const load = () => adminGetCategories().then(({ data }) => setCategories(data.data));
  useEffect(() => { load(); }, []);

  const resetForm = () => { setForm({ name: '', description: '', image_url: '' }); setEditingId(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) await adminUpdateCategory(editingId, form);
    else await adminCreateCategory(form);
    resetForm();
    load();
  };

  const handleEdit = (c) => { setForm({ name: c.name, description: c.description || '', image_url: c.image_url || '' }); setEditingId(c.id); };

  const handleDelete = async (id) => {
    if (!window.confirm('Xoá danh mục này?')) return;
    try { await adminDeleteCategory(id); load(); } catch (err) { alert(err.response?.data?.message); }
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>Danh mục sản phẩm</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
        <form onSubmit={handleSubmit} className="card" style={{ padding: 20, alignSelf: 'start' }}>
          <h4 style={{ marginBottom: 14 }}>{editingId ? 'Sửa danh mục' : 'Thêm danh mục mới'}</h4>
          <div className="flex-col gap-10">
            <input placeholder="Tên danh mục" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            <textarea placeholder="Mô tả" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            <input placeholder="URL hình ảnh (tuỳ chọn)" value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} />
            <div className="flex gap-8">
              <button className="btn btn-primary" type="submit">{editingId ? 'Cập nhật' : 'Thêm mới'}</button>
              {editingId && <button className="btn btn-outline" type="button" onClick={resetForm}>Huỷ</button>}
            </div>
          </div>
        </form>

        <div className="flex-col gap-10">
          {categories.map((c) => (
            <div key={c.id} className="card flex items-center justify-between" style={{ padding: 14 }}>
              <div>
                <strong>{c.name}</strong>
                <div style={{ fontSize: 13, color: 'var(--color-ink-soft)' }}>{c.description}</div>
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
