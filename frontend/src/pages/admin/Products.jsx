import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminGetProducts, adminDeleteProduct } from '../../api/admin.api';
import { formatMoney } from '../../components/common/Money';
import Pagination from '../../components/common/Pagination';

export default function AdminProducts() {
  const [params, setParams] = useSearchParams();
  const [result, setResult] = useState({ items: [], pagination: {} });
  const [q, setQ] = useState(params.get('q') || '');
  const page = Number(params.get('page') || 1);

  const load = () => adminGetProducts({ q: params.get('q') || '', page, limit: 10 }).then(({ data }) => setResult({ items: data.data, pagination: data.pagination }));
  useEffect(() => { load(); }, [params, page]);

  const submitSearch = (e) => {
    e.preventDefault();
    setParams(q ? { q } : {});
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xoá sản phẩm này? (Không thể hoàn tác)')) return;
    await adminDeleteProduct(id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
        <h2>Sản phẩm</h2>
        <Link to="/admin/san-pham/moi" className="btn btn-primary">+ Thêm sản phẩm</Link>
      </div>

      <form onSubmit={submitSearch} className="flex gap-8" style={{ marginBottom: 16, maxWidth: 360 }}>
        <input placeholder="Tìm theo tên..." value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn btn-outline">Tìm</button>
      </form>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--color-line-soft)', textAlign: 'left' }}>
              <th style={{ padding: 12 }}>Tên sản phẩm</th>
              <th style={{ padding: 12 }}>Danh mục</th>
              <th style={{ padding: 12 }}>Số biến thể</th>
              <th style={{ padding: 12 }}>Trạng thái</th>
              <th style={{ padding: 12 }}></th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((p) => (
              <tr key={p.id} style={{ borderTop: '1px solid var(--color-line-soft)' }}>
                <td style={{ padding: 12 }}>{p.name}</td>
                <td style={{ padding: 12 }}>{p.category_name}</td>
                <td style={{ padding: 12 }}>{p.variant_count}</td>
                <td style={{ padding: 12 }}>
                  <span className={p.is_available ? 'badge' : 'badge-outline'} style={{ background: p.is_available ? 'var(--color-green)' : undefined }}>
                    {p.is_available ? 'Đang bán' : 'Ngừng bán'}
                  </span>
                </td>
                <td style={{ padding: 12 }}>
                  <div className="flex gap-8">
                    <Link to={`/admin/san-pham/${p.id}`} className="btn btn-outline btn-sm">Sửa</Link>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-primary)' }} onClick={() => handleDelete(p.id)}>Xoá</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={result.pagination.page || 1} totalPages={result.pagination.totalPages || 1} onChange={(p) => setParams({ q: params.get('q') || '', page: p })} />
    </div>
  );
}
