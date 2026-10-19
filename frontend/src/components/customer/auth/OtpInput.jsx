import { useRef } from 'react';

/**
 * 6 ô nhập mã xác nhận: tự nhảy ô, Backspace lùi ô, dán cả mã 6 số, hỗ trợ gợi ý mã từ SMS/email trên điện thoại.
 */
export default function OtpInput({ length = 6, value, onChange, onComplete, disabled = false, invalid = false }) {
  const refs = useRef([]);
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  const focusAt = (i) => {
    const el = refs.current[Math.max(0, Math.min(length - 1, i))];
    if (el) { el.focus(); el.select(); }
  };

  const commit = (next) => {
    onChange(next);
    if (next.length === length && onComplete) onComplete(next);
  };

  const handleChange = (i, e) => {
    const typed = e.target.value.replace(/\D/g, '');
    if (!typed) return;
    if (typed.length > 1) { // trình duyệt tự điền cả mã vào 1 ô
      const next = typed.slice(0, length);
      commit(next);
      focusAt(next.length >= length ? length - 1 : next.length);
      return;
    }
    const arr = [...digits];
    arr[i] = typed;
    const next = arr.join('').slice(0, length);
    commit(next);
    if (i < length - 1) focusAt(i + 1);
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const arr = [...digits];
      if (arr[i]) { arr[i] = ''; onChange(arr.join('')); }
      else if (i > 0) { arr[i - 1] = ''; onChange(arr.join('')); focusAt(i - 1); }
    } else if (e.key === 'ArrowLeft') { e.preventDefault(); focusAt(i - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); focusAt(i + 1); }
  };

  const handlePaste = (e) => {
    const pasted = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    e.preventDefault();
    commit(pasted);
    focusAt(pasted.length >= length ? length - 1 : pasted.length);
  };

  return (
    <div className={`au-otp${invalid ? ' is-invalid' : ''}`} role="group" aria-label="Mã xác nhận 6 chữ số">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          className={`au-otp-box${d ? ' is-filled' : ''}`}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={i === 0 ? length : 1}
          value={d}
          disabled={disabled}
          autoFocus={i === 0}
          aria-label={`Chữ số thứ ${i + 1}`}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}
