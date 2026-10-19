import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import TrendingBadge from "./TrendingBadge";
import StarRating from "../common/StarRating";
import { formatMoney } from "../common/Money";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { addFavorite, removeFavorite } from "../../api/favorites.api";

// Icon yêu thích
function HeartIcon({ filled }) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M12 20s-7-4.35-9.5-8.8C.8 7.6 2.3 4 6 4c2 0 3.4 1.1 4 2.2C10.6 5.1 12 4 14 4c3.7 0 5.2 3.6 3.5 7.2C19 15.65 12 20 12 20z" />
    </svg>
  );
}

// Icon thêm giỏ hàng
function CartPlusIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.76L20 8H6.2" />
      <circle cx="9" cy="20" r="1.3" />
      <circle cx="17" cy="20" r="1.3" />
      <path d="M15 10h4m-2-2v4" />
    </svg>
  );
}

function formatSold(value) {
  const num = Number(value || 0);

  if (num >= 1000) {
    return `${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)}k`;
  }

  return String(num);
}

function formatViews(value) {
  const num = Number(value);

  if (!Number.isFinite(num) || num < 0) return "0";
  if (num >= 1000) {
    return `${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)}k`;
  }

  return String(num);
}

export default function ProductCard({ product }) {
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();

  const [favorited, setFavorited] = useState(Boolean(product.is_favorited));
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState("");

  const discountPercent =
    product.compare_price &&
    Number(product.compare_price) > Number(product.min_price)
      ? Math.round(
          (1 - Number(product.min_price) / Number(product.compare_price)) * 100,
        )
      : 0;

  const showFlash = (message) => {
    setFlash(message);
    setTimeout(() => setFlash(""), 1500);
  };

  const toggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate("/dang-nhap");
      return;
    }

    if (busy) return;

    setBusy(true);

    try {
      if (favorited) {
        await removeFavorite(product.id);
        setFavorited(false);
      } else {
        await addFavorite(product.id);
        setFavorited(true);
        showFlash("Đã thêm vào yêu thích ❤️");
      }
    } catch (err) {
      showFlash(err.response?.data?.message || "Không thể cập nhật yêu thích");
    } finally {
      setBusy(false);
    }
  };

  const quickAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate("/dang-nhap");
      return;
    }

    if (!product.cheapest_variant_id || busy) return;

    setBusy(true);

    try {
      await addItem(product.cheapest_variant_id, 1);
      showFlash("Đã thêm vào giỏ 🛒");
    } catch (err) {
      showFlash(err.response?.data?.message || "Không thể thêm vào giỏ");
    } finally {
      setBusy(false);
    }
  };

  const hasViews = product.views_24h != null;
  const totalSold = Number(product.total_sold || 0);
  const reviewCount = Number(product.review_count || 0);

  return (
    <Link to={`/san-pham/${product.slug}`} className="card pc">
      <div className="pc-media">
        {product.thumbnail && (
          <img src={product.thumbnail} alt={product.name} loading="lazy" />
        )}

        <div className="pc-badges-top">
          {product.trend_label && <TrendingBadge label={product.trend_label} />}

          {discountPercent > 0 && (
            <span className="badge badge-sale">-{discountPercent}%</span>
          )}
        </div>

        <button
          type="button"
          className={`pc-heart${favorited ? " is-active" : ""}`}
          onClick={toggleFavorite}
          aria-label={favorited ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
          aria-pressed={favorited}
          disabled={busy}
        >
          <HeartIcon filled={favorited} />
        </button>

        {product.cheapest_variant_id && (
          <button
            type="button"
            className="pc-quickadd"
            onClick={quickAdd}
            aria-label="Thêm nhanh vào giỏ hàng"
            disabled={busy}
          >
            <CartPlusIcon />
          </button>
        )}

        {flash && (
          <div className="pc-flash" role="status">
            {flash}
          </div>
        )}
      </div>

      <div className="pc-body">
        <h4 className="pc-name">{product.name}</h4>

        <div className="pc-meta">
          <span className="pc-stars">
            <StarRating value={Number(product.avg_rating || 0)} size={13} />
          </span>

          <span className="pc-rating-count">
            {reviewCount > 0 ? `(${reviewCount})` : "(Chưa có đánh giá)"}
          </span>

          {hasViews && (
            <>
              <span className="pc-dot">·</span>
              <span title="Lượt xem trong 24 giờ gần nhất">
                🔥 {formatViews(product.views_24h)} lượt xem
              </span>
            </>
          )}

          {totalSold > 0 && (
            <>
              <span className="pc-dot">·</span>
              <span>Đã bán {formatSold(totalSold)}</span>
            </>
          )}
        </div>

        <div className="pc-price-row">
          <strong className="pc-price">{formatMoney(product.min_price)}</strong>

          {discountPercent > 0 && (
            <span className="pc-compare">
              {formatMoney(product.compare_price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
