import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getHotTrending, getBestSelling } from "../../api/trending.api";
import { getCategories } from "../../api/categories.api";
import ProductCard from "../../components/customer/ProductCard";
import { getCategoryStyle } from "../../utils/categoryStyle";

export default function Home() {
  const [hot, setHot] = useState([]);
  const [bestSelling, setBestSelling] = useState([]);
  const [categories, setCategories] = useState([]);

  const [hotLoading, setHotLoading] = useState(true);
  const [bestSellingLoading, setBestSellingLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [hotError, setHotError] = useState(false);
  const [bestSellingError, setBestSellingError] = useState(false);
  const [categoriesError, setCategoriesError] = useState(false);

  useEffect(() => {
    let active = true;

    getHotTrending(8)
      .then(({ data }) => {
        if (active) {
          setHot(Array.isArray(data?.data) ? data.data : []);
        }
      })
      .catch(() => {
        if (active) setHotError(true);
      })
      .finally(() => {
        if (active) setHotLoading(false);
      });

    getBestSelling(8)
      .then(({ data }) => {
        if (active) {
          setBestSelling(Array.isArray(data?.data) ? data.data : []);
        }
      })
      .catch(() => {
        if (active) setBestSellingError(true);
      })
      .finally(() => {
        if (active) setBestSellingLoading(false);
      });

    getCategories()
      .then(({ data }) => {
        if (active) {
          setCategories(Array.isArray(data?.data) ? data.data : []);
        }
      })
      .catch(() => {
        if (active) setCategoriesError(true);
      })
      .finally(() => {
        if (active) setCategoriesLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="home-page">
      {/* HERO */}
      <section className="home-hero">
        <div className="container home-hero-inner">
          <div className="home-hero-copy">
            <span className="home-kicker">
              <span className="home-kicker-dot" />
              BẢN ĐỒ ĂN VẶT ĐANG GÂY SỐT
            </span>

            <h1 className="home-hero-title">
              Đói là phải
              <br />
              <span>ăn món hot!</span>
            </h1>

            <p className="home-hero-desc">
              Khám phá món ăn vặt đang được săn đón. Theo dõi xu hướng, tìm món
              hợp gu và chọn ngay món bạn thèm hôm nay.
            </p>

            <div className="home-hero-actions">
              <Link
                to="/san-pham?sort=trending"
                className="home-btn home-btn-primary"
              >
                <span>🔥</span> Khám phá Hot Trend
                <span aria-hidden="true">→</span>
              </Link>

              <Link to="/san-pham" className="home-btn home-btn-secondary">
                Xem tất cả món
              </Link>
            </div>

            <div className="home-hero-notes">
              <span>
                <b>✦</b> Bắt trend mỗi ngày
              </span>
              <span>
                <b>✦</b> Chọn món dễ dàng
              </span>
            </div>
          </div>

          <div className="home-hero-art">
            <div className="home-art-sun" />
            <span className="home-art-scribble">NGON!</span>
            <span className="home-art-sticker">
              ĂN LÀ
              <br />
              MÊ <span>♥</span>
            </span>

            {hot.slice(0, 4).map((p, i) => (
              <Link
                key={p.id}
                to={`/san-pham/${p.slug}`}
                className={`home-food-card home-food-card-${i + 1}`}
                aria-label={`Xem ${p.name}`}
              >
                {p.thumbnail ? (
                  <img src={p.thumbnail} alt={p.name} loading="lazy" />
                ) : (
                  <span className="home-food-placeholder">🍢</span>
                )}
                {i === 0 && <span className="home-food-tag">HOT 🔥</span>}
              </Link>
            ))}

            {hot.length === 0 && (
              <div className="home-art-fallback" aria-hidden="true">
                <span>🍢</span>
                <span>🍜</span>
                <span>🍟</span>
              </div>
            )}

            <div className="home-art-caption">
              <span>😋</span>
              <div>
                <strong>Hôm nay ăn gì?</strong>
                <small>Để FoodTrend gợi ý!</small>
              </div>
            </div>
          </div>
        </div>
        <div className="home-hero-bottom" />
      </section>

      <div className="container home-content">
        {/* CATEGORIES */}
        <section className="home-section home-category-section">
          <div className="home-section-heading">
            <div>
              <span className="home-section-kicker">CHỌN THEO KHẨU VỊ</span>
              <h2 className="home-section-title">
                Hôm nay thèm gì? <span>🍢</span>
              </h2>
              <p className="home-section-desc">
                Chọn một danh mục, tìm ngay món hợp gu.
              </p>
            </div>
          </div>

          {categoriesLoading ? (
            <div className="home-message">
              <span className="home-loading-dot" />
              Đang chuẩn bị danh mục món ngon...
            </div>
          ) : categoriesError ? (
            <div className="home-message home-message-error">
              Chưa thể tải danh mục. Bro thử tải lại trang nhé.
            </div>
          ) : categories.length === 0 ? (
            <div className="home-message">
              Danh mục món ăn sẽ sớm được cập nhật.
            </div>
          ) : (
            <div className="cat-grid home-cat-grid">
              {categories.map((c) => {
                const style = getCategoryStyle(c.slug);

                return (
                  <Link
                    key={c.id}
                    to={`/san-pham?category=${encodeURIComponent(c.slug)}`}
                    className="card cat-tile home-cat-tile"
                  >
                    <span
                      className="cat-icon home-cat-icon"
                      style={{
                        background: style.bg,
                        color: style.fg,
                      }}
                    >
                      {style.icon}
                    </span>
                    <span className="cat-tile-name">{c.name}</span>
                    <span className="home-cat-arrow" aria-hidden="true">
                      ↗
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* HOT TRENDING */}
        <section className="home-section home-trending-section">
          <div className="home-section-heading home-heading-hot">
            <div>
              <span className="home-section-kicker home-kicker-red">
                ĐANG ĐƯỢC QUAN TÂM
              </span>
              <h2 className="home-section-title">
                Đang hot trend <span>🔥</span>
              </h2>
              <p className="home-section-desc">
                Những món đang thu hút sự chú ý trên FoodTrend.
              </p>
            </div>

            <Link to="/san-pham?sort=trending" className="home-view-all">
              Xem tất cả <span>→</span>
            </Link>
          </div>

          {hotLoading ? (
            <div className="home-message">
              <span className="home-loading-dot" />
              Đang tìm món hot...
            </div>
          ) : hotError ? (
            <div className="home-message home-message-error">
              Chưa thể tải sản phẩm Hot Trend.
            </div>
          ) : hot.length === 0 ? (
            <div className="home-message">Hiện chưa có sản phẩm Hot Trend.</div>
          ) : (
            <div className="grid-products home-product-grid">
              {hot.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>

        {/* BEST SELLING */}
        <section className="home-section home-best-section">
          <div className="home-section-heading">
            <div>
              <span className="home-section-kicker home-kicker-yellow">
                ĐƯỢC KHÁCH HÀNG LỰA CHỌN
              </span>
              <h2 className="home-section-title">
                Món ngon bán chạy <span>🏆</span>
              </h2>
              <p className="home-section-desc">
                Những lựa chọn được yêu thích qua các đơn hàng.
              </p>
            </div>

            <Link to="/san-pham?sort=best_selling" className="home-view-all">
              Xem tất cả <span>→</span>
            </Link>
          </div>

          {bestSellingLoading ? (
            <div className="home-message">
              <span className="home-loading-dot" />
              Đang tải món bán chạy...
            </div>
          ) : bestSellingError ? (
            <div className="home-message home-message-error">
              Chưa thể tải sản phẩm bán chạy.
            </div>
          ) : bestSelling.length === 0 ? (
            <div className="home-message">Hiện chưa có sản phẩm bán chạy.</div>
          ) : (
            <div className="grid-products home-product-grid">
              {bestSelling.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>

        {/* BOTTOM CTA */}
        <section className="home-bottom-cta">
          <div className="home-bottom-emoji" aria-hidden="true">
            🌶️
          </div>
          <div className="home-bottom-copy">
            <span>ĐỪNG ĐỂ CƠN THÈM CHỜ LÂU</span>
            <h2>Gu ăn vặt của bạn, bắt đầu từ đây!</h2>
            <p>Khám phá menu và chọn món yêu thích ngay hôm nay.</p>
          </div>
          <Link to="/san-pham" className="home-btn home-btn-yellow">
            Khám phá menu <span>→</span>
          </Link>
        </section>
      </div>
    </main>
  );
}
