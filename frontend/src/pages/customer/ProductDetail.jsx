import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProductBySlug } from '../../api/products.api';
import { getReviewsByProduct, getReviewableOrders, createReview } from '../../api/reviews.api';
import { addFavorite, removeFavorite } from '../../api/favorites.api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import TrendingBadge from '../../components/customer/TrendingBadge';
import StarRating from '../../components/common/StarRating';
import { formatMoney } from '../../components/common/Money';

export default function ProductDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [variantId, setVariantId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isFavorited, setIsFavorited] = useState(false);
  const [toast, setToast] = useState('');

  const [reviews, setReviews] = useState({ items: [], pagination: {} });
  const [reviewableOrders, setReviewableOrders] = useState([]);
  const [reviewForm, setReviewForm] = useState({ order_id: '', rating: 5, comment: '' });

  useEffect(() => {
    getProductBySlug(slug).then(({ data }) => {
      setProduct(data.data);
      setIsFavorited(data.data.is_favorited);
      const firstAvailable = data.data.variants.find((v) => v.is_available && v.stock_quantity > 0) || data.data.variants[0];
      setVariantId(firstAvailable?.id);
    });
  }, [slug]);

  useEffect(() => {
    if (!product) return;
    getReviewsByProduct(product.id).then(({ data }) => setReviews({ items: data.data, pagination: data.pagination })).catch(() => {});
    if (user) {
      getReviewableOrders(product.id).then(({ data }) => setReviewableOrders(data.data)).catch(() => {});
    }
  }, [product, user]);

  if (!product) return <div className="container" style={{ padding: 60 }}>Đang tải...</div>;

  const selectedVariant = product.variants.find((v) => v.id === variantId);
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2200); };

  const handleAddToCart = async () => {
    if (!user) return showToast('Vui lòng đăng nhập để thêm vào giỏ hàng.');
    if (!selectedVariant) return;
    try {
      await addItem(selectedVariant.id, quantity);
      showToast('Đã thêm vào giỏ hàng!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Có lỗi xảy ra.');
    }
  };

  const toggleFavorite = async () => {
    if (!user) return showToast('Vui lòng đăng nhập để dùng tính năng yêu thích.');
    try {
      if (isFavorited) { await removeFavorite(product.id); setIsFavorited(false); }
      else { await addFavorite(product.id); setIsFavorited(true); }
    } catch (err) { /* ignore */ }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      await createReview({ product_id: product.id, ...reviewForm });
      showToast('Cảm ơn bạn đã đánh giá!');
      setReviewForm({ order_id: '', rating: 5, comment: '' });
      getReviewsByProduct(product.id).then(({ data }) => setReviews({ items: data.data, pagination: data.pagination }));
      getReviewableOrders(product.id).then(({ data }) => setReviewableOrders(data.data));
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể gửi đánh giá.');
    }
  };

  return (
    <div className="container" style={{ padding: '32px 20px 60px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
        {/* GALLERY */}
        <div>
          <div className="card" style={{ aspectRatio: '1/1', overflow: 'hidden', marginBottom: 10 }}>
            <img src={product.images[activeImage]?.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-8">
              {product.images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(i)}
                  className="card"
                  style={{ width: 64, height: 64, overflow: 'hidden', padding: 0, border: i === activeImage ? '2px solid var(--color-primary)' : undefined }}
                >
                  <img src={img.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* INFO */}
        <div>
          <div className="flex items-center gap-8" style={{ marginBottom: 10 }}>
            {product.trending?.trend_label && <TrendingBadge label={product.trending.trend_label} />}
            <Link to={`/san-pham?category=${product.category_slug}`} className="badge badge-outline">{product.category_name}</Link>
          </div>
          <h1 style={{ fontSize: '1.8rem' }}>{product.name}</h1>
          <div className="flex items-center gap-8" style={{ marginBottom: 16 }}>
            <StarRating value={product.avg_rating} />
            <span style={{ color: 'var(--color-ink-soft)', fontSize: 14 }}>
              {product.avg_rating > 0 ? `${product.avg_rating} (${product.review_count} đánh giá)` : 'Chưa có đánh giá'}
            </span>
          </div>

          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', color: 'var(--color-primary)', marginBottom: 18 }}>
            {selectedVariant && formatMoney(selectedVariant.sale_price ?? selectedVariant.price)}
            {selectedVariant?.sale_price && (
              <span style={{ fontSize: '1.1rem', color: 'var(--color-ink-soft)', textDecoration: 'line-through', marginLeft: 10, fontFamily: 'var(--font-body)' }}>
                {formatMoney(selectedVariant.price)}
              </span>
            )}
          </div>

          <p>{product.description}</p>

          {/* VARIANT SELECTOR = "tùy chọn thay đổi giá" */}
          <h4 style={{ fontSize: 14, marginTop: 20, marginBottom: 10 }}>Chọn loại</h4>
          <div className="flex gap-8" style={{ flexWrap: 'wrap', marginBottom: 20 }}>
            {product.variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setVariantId(v.id)}
                disabled={!v.is_available || v.stock_quantity === 0}
                className="btn btn-sm"
                style={{
                  border: v.id === variantId ? '2px solid var(--color-primary)' : '1.5px solid var(--color-line)',
                  background: v.id === variantId ? 'var(--color-primary-tint)' : '#fff',
                  color: 'var(--color-ink)',
                }}
              >
                {v.variant_name}{v.stock_quantity === 0 ? ' (Hết hàng)' : ''}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-16">
            <div className="flex items-center gap-8">
              <button className="btn btn-outline btn-sm" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
              <span style={{ minWidth: 24, textAlign: 'center' }}>{quantity}</span>
              <button className="btn btn-outline btn-sm" onClick={() => setQuantity((q) => q + 1)}>+</button>
            </div>
            <button className="btn btn-primary" onClick={handleAddToCart} disabled={!selectedVariant || selectedVariant.stock_quantity === 0}>
              🛒 Thêm vào giỏ hàng
            </button>
            <button className="btn btn-outline" onClick={toggleFavorite}>
              {isFavorited ? '❤️ Đã thích' : '🤍 Yêu thích'}
            </button>
          </div>
        </div>
      </div>

      {/* REVIEWS */}
      <div style={{ marginTop: 56, maxWidth: 700 }}>
        <h3 style={{ marginBottom: 18 }}>Đánh giá & bình luận ({reviews.pagination?.total ?? reviews.items?.length ?? 0})</h3>

        {user && (
          reviewableOrders.length > 0 ? (
            <form onSubmit={submitReview} className="card" style={{ padding: 18, marginBottom: 24 }}>
              <p style={{ fontWeight: 600, marginBottom: 8 }}>Bạn đã mua sản phẩm này — chia sẻ đánh giá nhé!</p>
              <select
                value={reviewForm.order_id}
                onChange={(e) => setReviewForm((f) => ({ ...f, order_id: e.target.value }))}
                required
                style={{ marginBottom: 10 }}
              >
                <option value="">-- Chọn đơn hàng đã mua --</option>
                {reviewableOrders.map((o) => (
                  <option key={o.order_id} value={o.order_id}>{o.order_code}</option>
                ))}
              </select>
              <div style={{ marginBottom: 10 }}>
                <StarRating value={reviewForm.rating} onChange={(r) => setReviewForm((f) => ({ ...f, rating: r }))} size={22} />
              </div>
              <textarea
                rows={3}
                placeholder="Cảm nhận của bạn về sản phẩm..."
                value={reviewForm.comment}
                onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                style={{ marginBottom: 10 }}
              />
              <button type="submit" className="btn btn-primary btn-sm">Gửi đánh giá</button>
            </form>
          ) : (
            <p style={{ fontSize: 14, color: 'var(--color-ink-soft)', marginBottom: 24 }}>
              Bạn cần mua sản phẩm này để có thể bình luận / đánh giá.
            </p>
          )
        )}

        {reviews.items?.length === 0 ? (
          <p style={{ color: 'var(--color-ink-soft)' }}>Chưa có đánh giá nào cho sản phẩm này.</p>
        ) : (
          <div className="flex-col gap-16">
            {reviews.items?.map((r) => (
              <div key={r.id} className="card" style={{ padding: 16 }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                  <strong>{r.full_name}</strong>
                  <StarRating value={r.rating} size={14} />
                </div>
                {r.comment && <p style={{ margin: 0 }}>{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
