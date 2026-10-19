export default function Footer() {
  return (
    <footer style={{ background: 'var(--color-ink)', color: '#fff', marginTop: 60 }}>
      <div className="container" style={{ padding: '40px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 32 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, marginBottom: 10 }}>
            🌶️ FoodTrend
          </div>
          <p style={{ color: '#D8C9BC', fontSize: 14 }}>
            Ăn vặt hot trend mỗi ngày — cập nhật liên tục các món đang gây sốt mạng xã hội.
          </p>
        </div>
        <div>
          <h4 style={{ color: '#fff', fontSize: 15, marginBottom: 12 }}>Hỗ trợ khách hàng</h4>
          <p style={{ fontSize: 14 }}>Hotline: 1900 1234</p>
          <p style={{ fontSize: 14 }}>Email: hotro@foodtrend.vn</p>
        </div>
        <div>
          <h4 style={{ color: '#fff', fontSize: 15, marginBottom: 12 }}>Khu vực giao hàng</h4>
          <p style={{ fontSize: 14 }}>Đà Nẵng và các quận lân cận</p>
        </div>
      </div>
      <div style={{ borderTop: '1px solid #3A2A22', textAlign: 'center', padding: 16, fontSize: 13, color: '#B79E8C' }}>
        © 2026 FoodTrend. Đồ án minh hoạ — không phải cửa hàng thật.
      </div>
    </footer>
  );
}
