export default function Money({ value }) {
  const n = Number(value || 0);
  return <>{n.toLocaleString('vi-VN')}đ</>;
}
export function formatMoney(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`;
}
