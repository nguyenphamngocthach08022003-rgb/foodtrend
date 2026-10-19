// Icon + màu riêng cho từng danh mục (dùng chung giữa Home và ProductList).
// Khớp theo slug trong seed data — danh mục không có trong map vẫn hiển thị
// bình thường với icon mặc định (không bao giờ vỡ layout khi thêm danh mục mới).
export const CATEGORY_STYLE = {
  'an-vat-hot-trend': { icon: '🍢', bg: '#FCE3E1', fg: '#D62839' },
  'chan-ga-mon-sot': { icon: '🍗', bg: '#FDE8D2', fg: '#C97F00' },
  'do-chien-ca-vien': { icon: '🧆', bg: '#FFF1C2', fg: '#B4560B' },
  'trai-cay-chua-cay': { icon: '🥭', bg: '#E5F6E8', fg: '#2F9E44' },
  'tra-do-uong': { icon: '🥤', bg: '#E1EEFF', fg: '#1971C2' },
  'matcha-do-ngot': { icon: '🍵', bg: '#E6F4E1', fg: '#5C940D' },
  'combo-hot-trend': { icon: '🧺', bg: '#F3E1FF', fg: '#9C36B5' },
};

export const DEFAULT_CATEGORY_STYLE = { icon: '🍽️', bg: 'var(--color-primary-tint)', fg: 'var(--color-primary)' };

export function getCategoryStyle(slug) {
  return CATEGORY_STYLE[slug] || DEFAULT_CATEGORY_STYLE;
}
