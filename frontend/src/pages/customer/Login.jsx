import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AuthLayout from "../../components/customer/auth/AuthLayout";
import AuthField from "../../components/customer/auth/AuthField";
import { UserIcon, LockIcon } from "../../components/common/Icons";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!identifier.trim() || !password) {
      setError("Vui lòng nhập email / số điện thoại và mật khẩu.");
      return;
    }
    setLoading(true);
    try {
      const user = await login(identifier.trim(), password);
      if (user.role === "ADMIN") navigate("/admin");
      else navigate(location.state?.from?.pathname || "/");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Không kết nối được tới máy chủ. Hãy kiểm tra backend đang chạy rồi thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout mode="login">
      <h2 className="au-title">Đăng nhập</h2>
      <p className="au-sub">Đặt món ăn vặt hot trend chỉ với vài cú chạm 🍢</p>

      <form className="au-form" onSubmit={handleSubmit} noValidate>
        <AuthField
          label="Email hoặc số điện thoại"
          icon={<UserIcon size={18} />}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="vd: ban@gmail.com hoặc 0912345678"
          autoComplete="username"
          autoFocus
        />
        <AuthField
          label="Mật khẩu"
          icon={<LockIcon size={18} />}
          password
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Nhập mật khẩu"
          autoComplete="current-password"
        />

        <div className="au-row">
          <span />
          <Link to="/quen-mat-khau" className="au-link">
            Quên mật khẩu?
          </Link>
        </div>

        {error && (
          <div className="au-alert is-error" role="alert">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <button
          className="btn btn-primary btn-block au-submit"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="au-spinner" /> Đang đăng nhập...
            </>
          ) : (
            "Đăng nhập"
          )}
        </button>
      </form>

      <p className="au-foot">
        Chưa có tài khoản?{" "}
        <Link to="/dang-ky" className="au-link">
          Đăng ký ngay
        </Link>
      </p>
      <p className="au-demo">
        Thử nhanh:{" "}
        <button
          type="button"
          className="au-link"
          onClick={() => {
            setIdentifier("0900000002");
            setPassword("User@123");
          }}
        >
          dùng tài khoản khách demo
        </button>
      </p>
    </AuthLayout>
  );
}
