// "+84 912 345 678", "0912.345.678", "84912345678" -> "0912345678" (giống backend)
export function normalizePhone(raw) {
  let p = String(raw || '').replace(/[\s.\-()]/g, '');
  if (p.startsWith('+84')) p = `0${p.slice(3)}`;
  else if (/^84\d{9,10}$/.test(p)) p = `0${p.slice(2)}`;
  return p;
}

export const isValidPhone = (raw) => /^0\d{9,10}$/.test(normalizePhone(raw));
export const isValidEmail = (raw) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(raw || '').trim());

// Độ mạnh mật khẩu: trả về { score: 0-4, label, color }
export function passwordStrength(pw) {
  const p = String(pw || '');
  if (!p) return { score: 0, label: '', color: 'transparent' };
  let score = 0;
  if (p.length >= 6) score += 1;
  if (p.length >= 10) score += 1;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) score += 1;
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) score += 1;
  const levels = [
    { label: 'Quá yếu', color: '#D62839' },
    { label: 'Yếu', color: '#E8590C' },
    { label: 'Trung bình', color: '#F7A600' },
    { label: 'Khá mạnh', color: '#5C940D' },
    { label: 'Rất mạnh', color: '#2F9E44' },
  ];
  return { score, ...levels[score] };
}

// Che email: an.test@gmail.com -> an***@gmail.com
export function maskEmail(email) {
  const [local, domain] = String(email || '').split('@');
  if (!domain) return email;
  const vis = local.slice(0, Math.min(2, local.length));
  return `${vis}${'*'.repeat(Math.max(3, local.length - vis.length))}@${domain}`;
}
