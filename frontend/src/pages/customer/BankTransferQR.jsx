import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getOrderById } from "../../api/orders.api";
import { formatMoney } from "../../components/common/Money";
import "../../styles/bank-transfer.css";

// Thông tin minh họa — không dùng để chuyển khoản thật.
const BANK = {
  bankId: "NGAN_HANG_MINH_HOA",
  accountNo: "0123456789",
  accountName: "FOODTREND",
};

function InfoRow({ label, value, copyable = false }) {
  const copyValue = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard có thể không khả dụng trên một số trình duyệt.
    }
  };

  return (
    <div className="bank-info-row">
      <div>
        <div className="bank-info-label">{label}</div>
        <strong className="bank-info-value">{value}</strong>
      </div>
      {copyable && (
        <button
          type="button"
          className="bank-copy-btn"
          onClick={copyValue}
          aria-label={`Sao chép ${label}`}
        >
          Sao chép
        </button>
      )}
    </div>
  );
}

export default function BankTransferQR() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getOrderById(id)
      .then(({ data }) => setOrder(data.data))
      .catch(() => setError("Không tải được thông tin đơn hàng."));
  }, [id]);

  if (error) {
    return <div className="container">{error}</div>;
  }

  if (!order) {
    return (
      <div className="container" style={{ padding: 40 }}>
        Đang tải thông tin đơn hàng...
      </div>
    );
  }

  if (order.payment_method !== "BANK_TRANSFER") {
    return (
      <div className="container" style={{ padding: 40 }}>
        Đơn hàng này không sử dụng chuyển khoản.
        <p>
          <Link to={`/dat-hang-thanh-cong/${id}`}>Xem đơn hàng</Link>
        </p>
      </div>
    );
  }

  const amount = Math.round(Number(order.total_amount));
  const description = `FT ${order.order_code}`;
  const isPaid = order.payment_status === "PAID";

  return (
    <div className="container bank-page">
      <section className="bank-card">
        <div className="bank-heading">
          <span className="bank-logo" aria-hidden="true">
            🌶️
          </span>
          <div>
            <h1>Thanh toán FoodTrend</h1>
            <p>Thanh toán đơn hàng bằng chuyển khoản</p>
          </div>
        </div>

        <div className="bank-order-code">
          Mã đơn hàng
          <strong>{order.order_code}</strong>
        </div>

        <div className="bank-amount">
          <span>Số tiền cần chuyển</span>
          <strong>{formatMoney(amount)}</strong>
        </div>

        <div className="bank-qr-box">
          <div className="bank-qr-placeholder" aria-label="QR minh họa">
            <svg viewBox="0 0 210 210" role="img" aria-label="Mã QR minh họa">
              <rect width="210" height="210" fill="white" />
              {Array.from({ length: 21 }, (_, y) =>
                Array.from({ length: 21 }, (_, x) => {
                  const inFinder = (ox, oy) =>
                    x >= ox && x < ox + 7 && y >= oy && y < oy + 7;

                  const finder =
                    inFinder(0, 0) || inFinder(14, 0) || inFinder(0, 14);

                  const finderX = x % 14;
                  const finderY = y % 14;
                  const edge =
                    finderX === 0 ||
                    finderX === 6 ||
                    finderY === 0 ||
                    finderY === 6;
                  const center =
                    finderX >= 2 &&
                    finderX <= 4 &&
                    finderY >= 2 &&
                    finderY <= 4;

                  const dark = finder
                    ? edge || center
                    : (x * 7 + y * 11 + x * y) % 5 < 2;

                  return dark ? (
                    <rect
                      key={`${x}-${y}`}
                      x={x * 10}
                      y={y * 10}
                      width="10"
                      height="10"
                      fill="#241D1B"
                    />
                  ) : null;
                }),
              )}
            </svg>
          </div>
          <strong>QR nhận tiền </strong>
          <span>Hình ảnh QR nhận tiền của cửa hàng</span>
        </div>

        <div className="bank-info">
          <InfoRow label="Ngân hàng" value="Techcombank" />
          <InfoRow
            label="Số tài khoản minh họa"
            value={BANK.accountNo}
            copyable
          />
          <InfoRow label="Chủ tài khoản" value={BANK.accountName} />
          <InfoRow label="Nội dung chuyển khoản" value={description} copyable />
        </div>

        <div className={`bank-payment-status ${isPaid ? "is-paid" : ""}`}>
          <span aria-hidden="true">{isPaid ? "✓" : "◷"}</span>
          <strong>
            {isPaid ? "Đã xác nhận thanh toán" : "Chờ xác nhận thanh toán"}
          </strong>
        </div>

        <p className="bank-notice">
          Đây là giao diện thanh toán minh họa của FoodTrend. Vui lòng chỉ
          chuyển tiền khi thông tin tài khoản đã được thay bằng thông tin chính
          thức của quán.
        </p>

        <Link className="bank-order-link" to={`/dat-hang-thanh-cong/${id}`}>
          Xem thông tin đơn hàng →
        </Link>
      </section>
    </div>
  );
}
