import { useEffect, useState } from 'react';
import { getAddresses, deleteAddress, setDefaultAddress } from '../../../api/addresses.api';

export default function ProfileAddresses() {
  const [addresses, setAddresses] = useState([]);

  const load = () => getAddresses().then(({ data }) => setAddresses(data.data));
  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Xoá địa chỉ này?')) return;
    await deleteAddress(id);
    load();
  };

  return (
    <div>
      <h3 style={{ marginBottom: 16 }}>Sổ địa chỉ</h3>
      <p style={{ fontSize: 13, marginBottom: 16 }}>Bạn có thể thêm địa chỉ mới ngay trong bước thanh toán.</p>
      <div className="flex-col gap-12">
        {addresses.map((a) => (
          <div key={a.id} className="card flex items-center justify-between" style={{ padding: 16 }}>
            <div>
              <strong>{a.label} {a.is_default && <span className="badge badge-outline" style={{ marginLeft: 8 }}>Mặc định</span>}</strong>
              <div style={{ fontSize: 14, marginTop: 4 }}>{a.receiver_name} — {a.receiver_phone}</div>
              <div style={{ fontSize: 13, color: 'var(--color-ink-soft)' }}>{a.street_address}, {a.ward_name}, {a.district_name}, {a.province_name}</div>
            </div>
            <div className="flex gap-8">
              {!a.is_default && <button className="btn btn-outline btn-sm" onClick={() => setDefaultAddress(a.id).then(load)}>Đặt mặc định</button>}
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-primary)' }} onClick={() => handleDelete(a.id)}>Xoá</button>
            </div>
          </div>
        ))}
        {addresses.length === 0 && <p style={{ color: 'var(--color-ink-soft)' }}>Chưa có địa chỉ nào được lưu.</p>}
      </div>
    </div>
  );
}
