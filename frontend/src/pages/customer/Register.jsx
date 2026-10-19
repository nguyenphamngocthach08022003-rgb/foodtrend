import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  requestRegisterCode,
  resendRegisterCode,
  verifyRegister,
} from "../../api/auth.api";
import AuthLayout from "../../components/customer/auth/AuthLayout";
import AuthField from "../../components/customer/auth/AuthField";
import OtpInput from "../../components/customer/auth/OtpInput";
import PasswordStrength from "../../components/customer/auth/PasswordStrength";
import useCountdown, { formatMMSS } from "../../hooks/useCountdown";
import {
  normalizePhone,
  isValidPhone,
  isValidEmail,
} from "../../utils/validators";
import { formatMoney } from "../../components/common/Money";
import {
  UserIcon,
  MailIcon,
  PhoneIcon,
  LockIcon,
  ArrowLeftIcon,
} from "../../components/common/Icons";

const EMPTY = {
  full_name: "",
  email: "",
  phone: "",
  password: "",
  confirm: "",
};
const networkMsg =
  "Không kết nối được tới máy chủ. Hãy kiểm tra backend đang chạy rồi thử lại.";

function couponStub(c) {
  return c.discount_type === "PERCENT"
    ? `-${Number(c.discount_value)}%`
    : `-${Math.round(Number(c.discount_value) / 1000)}K`;
}

export default function Register() {
  const { acceptSession } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState("form"); // form -> verify -> done
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const [pending, setPending] = useState(null); // { email, masked, expiresAt, resendAt, devCode }
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [info, setInfo] = useState("");
  const [otpKey, setOtpKey] = useState(0); // đổi key => ô nhập mã được làm mới + focus lại ô đầu
  const [done, setDone] = useState(null);

  const expiresLeft = useCountdown(pending?.expiresAt);
  const resendLeft = useCountdown(pending?.resendAt);

  const setField = (name) => (e) => {
    setForm((f) => ({ ...f, [name]: e.target.value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const validate = () => {
    const er = {};
    if (form.full_name.trim().length < 2)
      er.full_name = "Vui lòng nhập họ và tên.";
    if (!isValidEmail(form.email))
      er.email = "Email không hợp lệ (vd: ban@gmail.com).";
    if (!isValidPhone(form.phone))
      er.phone = "Số điện thoại không hợp lệ (10-11 số, bắt đầu bằng 0).";
    if (form.password.length < 6)
      er.password = "Mật khẩu phải có ít nhất 6 ký tự.";
    if (form.confirm !== form.password)
      er.confirm = "Mật khẩu nhập lại chưa khớp.";
    return er;
  };

  const startPending = (d) => {
    const now = Date.now();
    setPending({
      email: d.email,
      masked: d.masked_email,
      expiresAt: now + d.expires_in * 1000,
      resendAt: now + d.resend_after * 1000,
      devCode: d.dev_code || null,
    });
  };

  // ---- Bước 1: gửi thông tin, nhận mã qua email ----
  const submitForm = async (e) => {
    e.preventDefault();
    setServerError("");
    const er = validate();
    setErrors(er);
    if (Object.keys(er).length) return;

    setLoading(true);
    try {
      const { data } = await requestRegisterCode({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: normalizePhone(form.phone),
        password: form.password,
      });
      startPending(data.data);
      setCode("");
      setCodeError("");
      setInfo("");
      setOtpKey((k) => k + 1);
      setStep("verify");
    } catch (err) {
      const msg = err.response?.data?.message || networkMsg;
      if (err.response?.status === 409 && /Email/i.test(msg))
        setErrors({ email: msg });
      else if (err.response?.status === 409 && /điện thoại/i.test(msg))
        setErrors({ phone: msg });
      else setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ---- Bước 2: nhập mã ----
  const verify = async (value = code) => {
    if (loading || value.length !== 6) return;
    setCodeError("");
    setInfo("");
    setLoading(true);
    try {
      const { data } = await verifyRegister({
        email: pending.email,
        code: value,
      });
      const user = acceptSession(data.data);
      setDone({ user, coupon: data.data.welcome_coupon });
      setStep("done");
    } catch (err) {
      setCodeError(err.response?.data?.message || networkMsg);
      setCode("");
      setOtpKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (resendLeft > 0 || loading) return;
    setCodeError("");
    setLoading(true);
    try {
      const { data } = await resendRegisterCode({ email: pending.email });
      startPending(data.data);
      setCode("");
      setOtpKey((k) => k + 1);
      setInfo("Đã gửi lại mã mới. Hãy kiểm tra hộp thư (cả mục Spam).");
    } catch (err) {
      const msg = err.response?.data?.message || networkMsg;
      if (err.response?.status === 400) {
        // phiên đăng ký đã hết hạn -> quay lại điền thông tin
        setServerError(msg);
        setStep("form");
      } else {
        setCodeError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================ Giao diện ============================
  if (step === "done") {
    const firstName = done.user.full_name.trim().split(" ").slice(-1)[0];
    return (
      <AuthLayout mode="register">
        <div className="au-success">
          <div className="au-confetti" aria-hidden="true">
            {["🎉", "✨", "🍢", "🎊", "🥭", "✨", "🍗"].map((c, i) => (
              <span
                key={i}
                style={{
                  left: `${10 + i * 13}%`,
                  "--dx": `${(i % 2 ? 1 : -1) * (14 + i * 6)}px`,
                  "--rot": `${(i % 2 ? 1 : -1) * 40}deg`,
                  animationDelay: `${i * 0.07}s`,
                }}
              >
                {c}
              </span>
            ))}
          </div>
          <div className="au-success-emoji">🎉</div>
          <h2 className="au-title" style={{ marginTop: 10 }}>
            Chào mừng {firstName}!
          </h2>
          <p className="au-sub" style={{ marginBottom: 4 }}>
            Email đã được xác nhận và tài khoản của bạn đã sẵn sàng.
          </p>

          {done.coupon && (
            <div className="au-ticket">
              <div className="au-ticket-stub">
                <b>{couponStub(done.coupon)}</b>
                <small>QUÀ TẶNG</small>
              </div>
              <div className="au-ticket-body">
                <strong>{done.coupon.code}</strong>
                <div>{done.coupon.description}</div>
                <span>
                  Đơn từ {formatMoney(done.coupon.min_order_amount)} • đã lưu
                  vào tài khoản
                </span>
              </div>
            </div>
          )}

          <div className="au-actions">
            <button
              className="btn btn-primary btn-block au-submit"
              onClick={() => navigate("/san-pham?sort=trending")}
            >
              🔥 Khám phá món đang hot
            </button>
            {done.coupon && (
              <button
                className="btn btn-outline btn-block"
                onClick={() => navigate("/tai-khoan/ma-giam-gia")}
              >
                Xem mã giảm giá của tôi
              </button>
            )}
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (step === "verify" && pending) {
    const expired = expiresLeft <= 0;
    return (
      <AuthLayout mode="register">
        <button
          type="button"
          className="au-back"
          onClick={() => {
            setStep("form");
            setCodeError("");
          }}
        >
          <ArrowLeftIcon size={16} /> Sửa thông tin
        </button>

        <div className="au-center">
          <div className="au-verify-icon">📬</div>
          <h2 className="au-title">Kiểm tra email của bạn</h2>
          <p className="au-sub" style={{ marginBottom: 6 }}>
            Chúng mình vừa gửi mã xác nhận gồm 6 chữ số tới
          </p>
          <div className="au-email-chip">{pending.masked}</div>
        </div>

        {pending.devCode && (
          <div className="au-alert is-info" style={{ marginTop: 12 }}>
            <span>🛠️</span>
            <span>
              Máy chủ <b>chưa cấu hình Gmail</b> nên không gửi được email thật
              (chế độ thử nghiệm). Mã của bạn:{" "}
              <b style={{ letterSpacing: 2 }}>{pending.devCode}</b>{" "}
              <button
                type="button"
                className="au-link"
                onClick={() => {
                  setCode(pending.devCode);
                  setCodeError("");
                }}
              >
                Điền sẵn
              </button>
            </span>
          </div>
        )}

        <OtpInput
          key={otpKey}
          value={code}
          onChange={(v) => {
            setCode(v);
            setCodeError("");
          }}
          onComplete={verify}
          disabled={loading}
          invalid={Boolean(codeError)}
        />

        {codeError && (
          <p
            className="au-error au-center"
            role="alert"
            style={{ margin: "4px 0 6px" }}
          >
            {codeError}
          </p>
        )}
        {info && !codeError && (
          <p className="au-hint au-center" style={{ color: "#1f6f31" }}>
            ✓ {info}
          </p>
        )}

        <p className="au-timer">
          {expired ? (
            <span className="is-expired">
              Mã đã hết hạn — hãy gửi lại mã mới
            </span>
          ) : (
            <>
              Mã hết hạn sau <b>{formatMMSS(expiresLeft)}</b>
            </>
          )}
        </p>

        <div className="au-form" style={{ marginTop: 12 }}>
          <button
            className="btn btn-primary btn-block au-submit"
            onClick={() => verify()}
            disabled={loading || code.length !== 6 || expired}
          >
            {loading ? (
              <>
                <span className="au-spinner" /> Đang xác nhận...
              </>
            ) : (
              "Xác nhận & tạo tài khoản"
            )}
          </button>
        </div>

        <p className="au-foot" style={{ marginTop: 16 }}>
          Chưa nhận được mã?{" "}
          <button
            type="button"
            className="au-link"
            onClick={resend}
            disabled={resendLeft > 0 || loading}
          >
            {resendLeft > 0 ? `Gửi lại mã (${resendLeft}s)` : "Gửi lại mã"}
          </button>
        </p>
        <p className="au-hint au-center" style={{ marginTop: 6 }}>
          Không thấy email? Hãy xem cả mục Spam / Quảng cáo.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout mode="register">
      <h2 className="au-title">Tạo tài khoản</h2>
      <p className="au-sub">
        Chỉ mất 1 phút — chúng mình sẽ gửi mã xác nhận qua email 📧
      </p>

      <form className="au-form" onSubmit={submitForm} noValidate>
        <AuthField
          label="Họ và tên"
          icon={<UserIcon size={18} />}
          value={form.full_name}
          onChange={setField("full_name")}
          error={errors.full_name}
          placeholder="Nguyễn Văn A"
          autoComplete="name"
          autoFocus
        />
        <AuthField
          label="Email"
          icon={<MailIcon size={18} />}
          type="email"
          value={form.email}
          onChange={setField("email")}
          error={errors.email}
          placeholder="ban@gmail.com"
          autoComplete="email"
          hint="Mã xác nhận sẽ được gửi tới email này."
        />
        <AuthField
          label="Số điện thoại"
          icon={<PhoneIcon size={18} />}
          type="tel"
          value={form.phone}
          onChange={setField("phone")}
          error={errors.phone}
          placeholder="0912 345 678"
          autoComplete="tel"
        />

        <div className="au-grid-2">
          <div>
            <AuthField
              label="Mật khẩu"
              icon={<LockIcon size={18} />}
              password
              value={form.password}
              onChange={setField("password")}
              error={errors.password}
              placeholder="Tối thiểu 6 ký tự"
              autoComplete="new-password"
            />
            <PasswordStrength value={form.password} />
          </div>
          <AuthField
            label="Nhập lại mật khẩu"
            icon={<LockIcon size={18} />}
            password
            value={form.confirm}
            onChange={setField("confirm")}
            error={errors.confirm}
            placeholder="Nhập lại"
            autoComplete="new-password"
          />
        </div>

        {serverError && (
          <div className="au-alert is-error" role="alert">
            <span>⚠️</span>
            <span>{serverError}</span>
          </div>
        )}

        <button
          className="btn btn-primary btn-block au-submit"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="au-spinner" /> Đang gửi mã...
            </>
          ) : (
            "Gửi mã xác nhận"
          )}
        </button>
      </form>

      <p className="au-foot">
        Đã có tài khoản?{" "}
        <Link to="/dang-nhap" className="au-link">
          Đăng nhập
        </Link>
      </p>
    </AuthLayout>
  );
}
