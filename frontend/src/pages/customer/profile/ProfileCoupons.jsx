import { useEffect, useState } from 'react';
import { getMyCoupons, getPublicCoupons, collectCoupon } from '../../../api/coupons.api';
import { formatMoney } from '../../../components/common/Money';

function CouponCard({ coupon, action }) {
  return (
    <div className="card flex items-center justify-between" style={{ padding: 16 }}>
      <div>
        <strong style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>{coupon.code}</strong>
        <div style={{ fontSize: 14 }}>{coupon.description}</div>
        <div style={{ fontSize: 12, color: 'var(--color-ink-soft)' }}>
          {coupon.discount_type === 'PERCENT' ? `Giảm ${coupon.discount_value}%` : `Giảm ${formatMoney(coupon.discount_value)}`}
          {coupon.max_discount_amount && ` (tối đa ${formatMoney(coupon.max_discount_amount)})`}
          {' • '}Đơn tối thiểu {formatMoney(coupon.min_order_amount)}
        </div>
      </div>
      {action}
    </div>
  );
}

export default function ProfileCoupons() {
  const [myCoupons, setMyCoupons] = useState([]);
  const [available, setAvailable] = useState([]);

  const load = () => {
    getMyCoupons().then(({ data }) => setMyCoupons(data.data));
    getPublicCoupons().then(({ data }) => setAvailable(data.data));
  };
  useEffect(() => { load(); }, []);

  const myCouponIds = new Set(myCoupons.map((c) => c.id));
  const collectible = available.filter((c) => !myCouponIds.has(c.id));

  return (
    <div>
      <h3 style={{ marginBottom: 16 }}>Mã giảm giá của tôi</h3>
      <div className="flex-col gap-12" style={{ marginBottom: 32 }}>
        {myCoupons.length === 0 && <p style={{ color: 'var(--color-ink-soft)' }}>Bạn chưa lưu mã giảm giá nào.</p>}
        {myCoupons.map((c) => (
          <CouponCard key={c.user_coupon_id} coupon={c} action={
            <span className={c.is_used ? 'badge badge-outline' : 'badge badge-DANG_HOT'}>{c.is_used ? 'Đã dùng' : 'Chưa dùng'}</span>
          } />
        ))}
      </div>

      {collectible.length > 0 && (
        <>
          <h3 style={{ marginBottom: 16 }}>Mã giảm giá khác có thể lưu</h3>
          <div className="flex-col gap-12">
            {collectible.map((c) => (
              <CouponCard key={c.id} coupon={c} action={
                <button className="btn btn-outline btn-sm" onClick={() => collectCoupon(c.id).then(load)}>Lưu mã</button>
              } />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
