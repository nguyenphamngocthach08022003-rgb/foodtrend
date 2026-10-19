import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { confirmMockPayment } from '../../api/orders.api';

// Trang mô phỏng cổng PayPal — thay bằng redirect PayPal thật khi tích hợp production.
export default function PaypalMock() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const approve = async () => {
    setLoading(true);
    try {
      await confirmMockPayment(id);
      navigate(`/dat-hang-thanh-cong/${id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '80px 20px', maxWidth: 420, margin: '0 auto', textAlign: 'center' }}>
      <div className="card" style={{ padding: 32 }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>💳</div>
        <h3>Mô phỏng thanh toán PayPal</h3>
        <p style={{ fontSize: 14 }}>
          Đây là trang giả lập cổng PayPal cho mục đích demo/đồ án. Khi tích hợp PayPal thật,
          bước này sẽ được thay bằng PayPal Checkout SDK thực tế.
        </p>
        <button className="btn btn-primary btn-block" onClick={approve} disabled={loading}>
          {loading ? 'Đang xử lý...' : '✅ Giả lập thanh toán thành công'}
        </button>
        <button className="btn btn-ghost btn-block" onClick={() => navigate('/gio-hang')} style={{ marginTop: 8 }}>
          Huỷ
        </button>
      </div>
    </div>
  );
}
