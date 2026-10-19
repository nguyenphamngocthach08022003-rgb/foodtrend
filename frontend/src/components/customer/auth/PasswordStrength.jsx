import { passwordStrength } from '../../../utils/validators';

// Thanh 4 đoạn + nhãn độ mạnh mật khẩu
export default function PasswordStrength({ value }) {
  const { score, label, color } = passwordStrength(value);
  if (!value) return null;
  return (
    <div className="au-strength" aria-live="polite">
      <div className="au-strength-bars">
        {[1, 2, 3, 4].map((n) => (
          <span key={n} style={{ background: n <= score ? color : undefined }} className={n <= score ? 'is-on' : ''} />
        ))}
      </div>
      <span className="au-strength-label" style={{ color }}>{label}</span>
    </div>
  );
}
