import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getFavorites, removeFavorite } from '../../../api/favorites.api';
import { formatMoney } from '../../../components/common/Money';

export default function ProfileFavorites() {
  const [items, setItems] = useState([]);
  const load = () => getFavorites().then(({ data }) => setItems(data.data));
  useEffect(() => { load(); }, []);

  return (
    <div>
      <h3 style={{ marginBottom: 16 }}>Sản phẩm yêu thích</h3>
      {items.length === 0 ? (
        <p style={{ color: 'var(--color-ink-soft)' }}>Bạn chưa yêu thích sản phẩm nào.</p>
      ) : (
        <div className="grid-products">
          {items.map((p) => (
            <div key={p.favorite_id} className="card" style={{ overflow: 'hidden' }}>
              <Link to={`/san-pham/${p.slug}`}>
                <div style={{ aspectRatio: '1/1', background: 'var(--color-line-soft)' }}>
                  <img src={p.thumbnail} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              </Link>
              <div style={{ padding: 12 }}>
                <Link to={`/san-pham/${p.slug}`} style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</Link>
                <div className="flex items-center justify-between" style={{ marginTop: 6 }}>
                  <strong style={{ color: 'var(--color-primary)' }}>{formatMoney(p.min_price)}</strong>
                  <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => removeFavorite(p.product_id).then(load)}>Bỏ thích</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
