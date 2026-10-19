import { useId, useState } from 'react';
import { EyeIcon, EyeOffIcon } from '../../common/Icons';

/**
 * Ô nhập có nhãn + icon dẫn đầu + thông báo lỗi.
 * `password` = true -> có nút hiện/ẩn mật khẩu.
 */
export default function AuthField({ label, icon, error, hint, password = false, ...inputProps }) {
  const id = useId();
  const [shown, setShown] = useState(false);

  return (
    <div className="au-field">
      <label htmlFor={id}>{label}</label>
      <div className={`au-input-wrap${error ? ' is-invalid' : ''}`}>
        {icon && <span className="au-input-icon">{icon}</span>}
        <input
          id={id}
          {...inputProps}
          type={password ? (shown ? 'text' : 'password') : inputProps.type || 'text'}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-err` : undefined}
        />
        {password && (
          <button
            type="button"
            className="au-eye"
            onClick={() => setShown((s) => !s)}
            aria-label={shown ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {shown ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
          </button>
        )}
      </div>
      {error ? <p id={`${id}-err`} className="au-error" role="alert">{error}</p> : hint ? <p className="au-hint">{hint}</p> : null}
    </div>
  );
}
