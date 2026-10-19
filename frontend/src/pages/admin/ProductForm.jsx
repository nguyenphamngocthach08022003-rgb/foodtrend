import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  adminGetCategories, adminGetProductById, adminCreateProduct, adminUpdateProduct,
  adminCreateVariant, adminUpdateVariant, adminDeleteVariant,
  adminUploadImages, adminSetThumbnail, adminDeleteImage,
} from '../../api/admin.api';
import { formatMoney } from '../../components/common/Money';

const emptyVariant = { variant_name: '', price: '', sale_price: '', stock_quantity: 0 };

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ category_id: '', name: '', description: '', is_available: true });
  const [variants, setVariants] = useState([{ ...emptyVariant }]);
  const [images, setImages] = useState([]);
  const [newVariant, setNewVariant] = useState({ ...emptyVariant });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminGetCategories().then(({ data }) => setCategories(data.data));
    if (isEdit) {
      adminGetProductById(id).then(({ data }) => {
        const p = data.data;
        setForm({ category_id: p.category_id, name: p.name, description: p.description || '', is_available: p.is_available });
        setVariants(p.variants);
        setImages(p.images);
      });
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await adminUpdateProduct(id, form);
        navigate('/admin/san-pham');
      } else {
        const { data } = await adminCreateProduct({ ...form, variants: variants.filter((v) => v.variant_name && v.price) });
        navigate(`/admin/san-pham/${data.data.id}`);
      }
    } finally {
      setSaving(false);
    }
  };

  // ---- edit-mode variant management ----
  const addVariant = async () => {
    if (!newVariant.variant_name || !newVariant.price) return;
    const { data } = await adminCreateVariant(id, newVariant);
    setVariants((v) => [...v, data.data]);
    setNewVariant({ ...emptyVariant });
  };
  const saveVariant = async (v) => { await adminUpdateVariant(v.id, v); };
  const removeVariant = async (variantId) => {
    if (!window.confirm('Xoá biến thể này?')) return;
    await adminDeleteVariant(variantId);
    setVariants((list) => list.filter((v) => v.id !== variantId));
  };

  // ---- edit-mode image management ----
  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;
    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append('images', f));
    const { data } = await adminUploadImages(id, formData);
    setImages((imgs) => [...imgs, ...data.data]);
  };
  const handleSetThumbnail = async (imgId) => {
    await adminSetThumbnail(imgId);
    setImages((imgs) => imgs.map((i) => ({ ...i, is_thumbnail: i.id === imgId })));
  };
  const handleDeleteImage = async (imgId) => {
    await adminDeleteImage(imgId);
    setImages((imgs) => imgs.filter((i) => i.id !== imgId));
  };

  return (
    <div style={{ maxWidth: 760 }}>
      <h2 style={{ marginBottom: 20 }}>{isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</h2>

      <form onSubmit={handleSubmit} className="card" style={{ padding: 20, marginBottom: 24 }}>
        <div className="flex-col gap-12">
          <input placeholder="Tên sản phẩm" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <select value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))} required>
            <option value="">-- Chọn danh mục --</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <textarea placeholder="Mô tả sản phẩm" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <label className="flex items-center gap-8">
            <input type="checkbox" style={{ width: 'auto' }} checked={form.is_available} onChange={(e) => setForm((f) => ({ ...f, is_available: e.target.checked }))} />
            Đang bán (hiển thị cho khách hàng)
          </label>

          {!isEdit && (
            <>
              <h4 style={{ marginTop: 8 }}>Biến thể (giá, size, phần...)</h4>
              {variants.map((v, i) => (
                <div key={i} className="flex gap-8">
                  <input placeholder="Tên biến thể (VD: 500g)" value={v.variant_name} onChange={(e) => setVariants((list) => list.map((x, xi) => xi === i ? { ...x, variant_name: e.target.value } : x))} />
                  <input type="number" placeholder="Giá gốc" value={v.price} onChange={(e) => setVariants((list) => list.map((x, xi) => xi === i ? { ...x, price: e.target.value } : x))} />
                  <input type="number" placeholder="Giá KM" value={v.sale_price} onChange={(e) => setVariants((list) => list.map((x, xi) => xi === i ? { ...x, sale_price: e.target.value } : x))} />
                  <input type="number" placeholder="Tồn kho" value={v.stock_quantity} onChange={(e) => setVariants((list) => list.map((x, xi) => xi === i ? { ...x, stock_quantity: e.target.value } : x))} />
                </div>
              ))}
              <button type="button" className="btn btn-ghost" style={{ alignSelf: 'flex-start' }} onClick={() => setVariants((v) => [...v, { ...emptyVariant }])}>+ Thêm dòng biến thể</button>
            </>
          )}

          <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={saving}>
            {saving ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
          </button>
        </div>
      </form>

      {isEdit && (
        <>
          {/* VARIANTS MANAGEMENT */}
          <div className="card" style={{ padding: 20, marginBottom: 24 }}>
            <h4 style={{ marginBottom: 14 }}>Quản lý biến thể</h4>
            <div className="flex-col gap-8" style={{ marginBottom: 14 }}>
              {variants.map((v) => (
                <div key={v.id} className="flex gap-8 items-center">
                  <input value={v.variant_name} onChange={(e) => setVariants((list) => list.map((x) => x.id === v.id ? { ...x, variant_name: e.target.value } : x))} />
                  <input type="number" value={v.price} onChange={(e) => setVariants((list) => list.map((x) => x.id === v.id ? { ...x, price: e.target.value } : x))} />
                  <input type="number" value={v.sale_price || ''} onChange={(e) => setVariants((list) => list.map((x) => x.id === v.id ? { ...x, sale_price: e.target.value } : x))} />
                  <input type="number" value={v.stock_quantity} onChange={(e) => setVariants((list) => list.map((x) => x.id === v.id ? { ...x, stock_quantity: e.target.value } : x))} />
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => saveVariant(v)}>Lưu</button>
                  <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--color-primary)' }} onClick={() => removeVariant(v.id)}>Xoá</button>
                </div>
              ))}
            </div>
            <h5 style={{ marginBottom: 8 }}>Thêm biến thể mới</h5>
            <div className="flex gap-8">
              <input placeholder="Tên" value={newVariant.variant_name} onChange={(e) => setNewVariant((v) => ({ ...v, variant_name: e.target.value }))} />
              <input type="number" placeholder="Giá" value={newVariant.price} onChange={(e) => setNewVariant((v) => ({ ...v, price: e.target.value }))} />
              <input type="number" placeholder="Giá KM" value={newVariant.sale_price} onChange={(e) => setNewVariant((v) => ({ ...v, sale_price: e.target.value }))} />
              <input type="number" placeholder="Tồn kho" value={newVariant.stock_quantity} onChange={(e) => setNewVariant((v) => ({ ...v, stock_quantity: e.target.value }))} />
              <button type="button" className="btn btn-primary btn-sm" onClick={addVariant}>Thêm</button>
            </div>
          </div>

          {/* IMAGES MANAGEMENT */}
          <div className="card" style={{ padding: 20 }}>
            <h4 style={{ marginBottom: 14 }}>Hình ảnh sản phẩm</h4>
            <div className="flex gap-12" style={{ flexWrap: 'wrap', marginBottom: 14 }}>
              {images.map((img) => (
                <div key={img.id} style={{ position: 'relative' }}>
                  <img src={img.image_url} alt="" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8, border: img.is_thumbnail ? '2px solid var(--color-primary)' : '1px solid var(--color-line)' }} />
                  <div className="flex gap-4" style={{ marginTop: 4 }}>
                    {!img.is_thumbnail && <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => handleSetThumbnail(img.id)}>Đặt đại diện</button>}
                    <button className="btn-ghost" style={{ fontSize: 11, color: 'var(--color-primary)' }} onClick={() => handleDeleteImage(img.id)}>Xoá</button>
                  </div>
                </div>
              ))}
            </div>
            <input type="file" multiple accept="image/*" onChange={handleUpload} />
            <p style={{ fontSize: 12, color: 'var(--color-ink-soft)', marginTop: 6 }}>Hỗ trợ nhiều ảnh (1 ảnh hoặc nhiều ảnh). Ảnh đầu tiên tự động là ảnh đại diện.</p>
          </div>
        </>
      )}
    </div>
  );
}
