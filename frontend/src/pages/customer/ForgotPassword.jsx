import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword, resetPassword } from '../../api/auth.api';
import AuthLayout from '../../components/customer/auth/AuthLayout';
import AuthField from '../../components/customer/auth/AuthField';
import OtpInput from '../../components/customer/auth/OtpInput';
import PasswordStrength from '../../components/customer/auth/PasswordStrength';
import useCountdown, { formatMMSS } from '../../hooks/useCountdown';
import { UserIcon, LockIcon, ArrowLeftIcon } from '../../components/common/Icons';

const networkMsg = 'Không kết nối được tới máy chủ. Hãy kiểm tra backend đang chạy rồi thử lại.';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState('request'); // request -> reset -> done
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const [pending, setPending] = useState(null); // { expiresAt, resendAt, devCode }
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [otpKey, setOtpKey] = useState(0);
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwErrors, setPwErrors] = useState({});

  const expiresLeft = useCountdown(pending?.expiresAt);
  const resendLeft = useCountdown(pending?.resendAt);

  const startPending = (d) => {
    const now = Date.now();
    setPending({ expiresAt: now + d.expires_in * 1000, resendAt: now + d.resend_after * 1000, devCode: d.dev_code || null });
  };

  // ---- Bước 1: gửi mã về email ----
  const requestCode = async (e) => {
    e?.preventDefault();
    setError('');
    if (!identifier.trim()) { setError('Vui lòng nhập email hoặc số điện thoại đã đăng ký.'); return; }
    setLoading(true);
    try {
      const { data } = await forgotPassword({ identifier: identifier.trim() });
      startPending(data.data);
      setCode(''); setCodeError(''); setInfo(''); setPw(''); setConfirm(''); setPwErrors({});
      setOtpKey((k) => k + 1);
      setStep('reset');
    } catch (err) {
      setError(err.response?.data?.message || networkMsg);
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (resendLeft > 0 || loading) return;
    setLoading(true);
    setCodeError('');
    try {
      const { data } = await forgotPassword({ identifier: identifier.trim() });
      startPending(data.data);
      setCode('');
      setOtpKey((k) => k + 1);
      setInfo('Nếu tài khoản tồn tại, mã mới đã được gửi. Hãy kiểm tra hộp thư (cả mục Spam).');
    } catch (err) {
      setCodeError(err.response?.data?.message || networkMsg);
    } finally {
      setLoading(false);
    }
  };

  // ---- Bước 2: nhập mã + mật khẩu mới ----
  const submitReset = async (e) => {
    e.preventDefault();
    setCodeError('');
    const er = {};
    if (code.length !== 6) setCodeError('Vui lòng nhập đủ mã xác nhận 6 chữ số.');
    if (pw.length < 6) er.pw = 'Mật khẩu mới phải có ít nhất 6 ký tự.';
    if (confirm !== pw) er.confirm = 'Mật khẩu nhập lại chưa khớp.';
    setPwErrors(er);
    if (code.length !== 6 || Object.keys(er).length) return;

    setLoading(true);
    try {
      await resetPassword({ identifier: identifier.trim(), code, new_password: pw });
      setStep('done');
    } catch (err) {
      setCodeError(err.response?.data?.message || networkMsg);
      setCode('');
      setOtpKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  };

  // ============================ Giao diện ============================
  if (step === 'done') {
    return (
      <AuthLayout mode="forgot">
        <div className="au-success">
          <div className="au-success-emoji">✅</div>
          <h2 className="au-title" style={{ marginTop: 10 }}>Đã đặt lại mật khẩu!</h2>
          <p className="au-sub">Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ. Chúng mình cũng đã gửi email báo cho bạn.</p>
          <div className="au-actions">
            <button className="btn btn-primary btn-block au-submit" onClick={() => navigate('/dang-nhap')}>Đăng nhập ngay</button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (step === 'reset' && pending) {
    const expired = expiresLeft <= 0;
    return (
      <AuthLayout mode="forgot">
        <button type="button" className="au-back" onClick={() => { setStep('request'); setCodeError(''); }}>
          <ArrowLeftIcon size={16} /> Nhập lại email / số điện thoại
        </button>

        <div className="au-center">
          <div className="au-verify-icon">🔐</div>
          <h2 className="au-title">Nhập mã & mật khẩu mới</h2>
          <p className="au-sub" style={{ marginBottom: 0 }}>
            Nếu tài khoản <b>{identifier.trim()}</b> tồn tại, mã gồm 6 chữ số đã được gửi tới email đã đăng ký của tài khoản đó.
          </p>
        </div>

        {pending.devCode && (
          <div className="au-alert is-info" style={{ marginTop: 12 }}>
            <span>🛠️</span>
            <span>
              Máy chủ <b>chưa cấu hình Gmail</b> (chế độ thử nghiệm). Mã của bạn: <b style={{ letterSpacing: 2 }}>{pending.devCode}</b>
              {' '}<button type="button" className="au-link" onClick={() => { setCode(pending.devCode); setCodeError(''); }}>Điền sẵn</button>
            </span>
          </div>
        )}

        <form className="au-form" onSubmit={submitReset} noValidate>
          <OtpInput key={otpKey} value={code} onChange={(v) => { setCode(v); setCodeError(''); }} disabled={loading} invalid={Boolean(codeError)} />
          {codeError && <p className="au-error au-center" role="alert" style={{ margin: '-6px 0 0' }}>{codeError}</p>}
          {info && !codeError && <p className="au-hint au-center" style={{ color: '#1f6f31', margin: '-6px 0 0' }}>✓ {info}</p>}
          <p className="au-timer" style={{ margin: '-4px 0 0' }}>
            {expired ? <span className="is-expired">Mã đã hết hạn — hãy gửi lại mã mới</span> : <>Mã hết hạn sau <b>{formatMMSS(expiresLeft)}</b></>}
          </p>

          <div>
            <AuthField label="Mật khẩu mới" icon={<LockIcon size={18} />} password value={pw} onChange={(e) => { setPw(e.target.value); setPwErrors((p) => ({ ...p, pw: undefined })); }} error={pwErrors.pw} placeholder="Tối thiểu 6 ký tự" autoComplete="new-password" />
            <PasswordStrength value={pw} />
          </div>
          <AuthField label="Nhập lại mật khẩu mới" icon={<LockIcon size={18} />} password value={confirm} onChange={(e) => { setConfirm(e.target.value); setPwErrors((p) => ({ ...p, confirm: undefined })); }} error={pwErrors.confirm} placeholder="Nhập lại" autoComplete="new-password" />

          <button className="btn btn-primary btn-block au-submit" disabled={loading || expired}>
            {loading ? <><span className="au-spinner" /> Đang xử lý...</> : 'Đặt lại mật khẩu'}
          </button>
        </form>

        <p className="au-foot" style={{ marginTop: 14 }}>
          Chưa nhận được mã?{' '}
          <button type="button" className="au-link" onClick={resend} disabled={resendLeft > 0 || loading}>
            {resendLeft > 0 ? `Gửi lại mã (${resendLeft}s)` : 'Gửi lại mã'}
          </button>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout mode="forgot">
      <h2 className="au-title">Quên mật khẩu?</h2>
      <p className="au-sub">Nhập email hoặc số điện thoại đã đăng ký, chúng mình sẽ gửi mã xác nhận về email của bạn.</p>

      <form className="au-form" onSubmit={requestCode} noValidate>
        <AuthField
          label="Email hoặc số điện thoại"
          icon={<UserIcon size={18} />}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="vd: ban@gmail.com hoặc 0912345678"
          autoComplete="username"
          autoFocus
        />
        {error && <div className="au-alert is-error" role="alert"><span>⚠️</span><span>{error}</span></div>}
        <button className="btn btn-primary btn-block au-submit" disabled={loading}>
          {loading ? <><span className="au-spinner" /> Đang gửi mã...</> : 'Gửi mã xác nhận'}
        </button>
      </form>

      <p className="au-foot"><Link to="/dang-nhap" className="au-link">← Quay lại đăng nhập</Link></p>
    </AuthLayout>
  );
}
