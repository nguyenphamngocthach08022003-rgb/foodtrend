import { MailIcon, ClockIcon, PhoneIcon } from '../common/Icons';

// Thanh thông tin trên cùng (slogan + liên hệ + giờ mở cửa + hotline)
export default function TopBar() {
  return (
    <div className="hd-topbar">
      <div className="container hd-topbar-inner">
        <span className="hd-topbar-slogan">FoodTrend – món hot trend, ngon hết ý</span>
        <ul className="hd-topbar-info">
          <li>
            <MailIcon size={16} />
            <a href="mailto:hotro@foodtrend.vn">Liên hệ</a>
          </li>
          <li>
            <ClockIcon size={16} />
            <span>08:00 - 22:00</span>
          </li>
          <li>
            <PhoneIcon size={16} />
            <a href="tel:19001234">1900 1234</a>
          </li>
        </ul>
      </div>
    </div>
  );
}
