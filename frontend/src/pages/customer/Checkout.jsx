import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { getAddresses, createAddress } from "../../api/addresses.api";
import { getProvinces, getWardsByProvince } from "../../api/location.api";
import { validateCoupon } from "../../api/coupons.api";
import { checkout as checkoutApi } from "../../api/orders.api";
import { formatMoney } from "../../components/common/Money";

const DELIVERY_FEE = 15000; // Giữ đồng bộ với backend .env DEFAULT_DELIVERY_FEE

export default function Checkout() {
  const { cart, refreshCart } = useCart();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState("");
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  const [newAddr, setNewAddr] = useState({
    receiver_name: "",
    receiver_phone: "",
    province_code: "",
    province_name: "",
    ward_code: "",
    ward_name: "",
    street_address: "",
  });

  const [couponCode, setCouponCode] = useState("");
  const [couponResult, setCouponResult] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getAddresses()
      .then(({ data }) => {
        const list = data.data || [];
        setAddresses(list);
        const defaultAddress = list.find((a) => a.is_default) || list[0];
        if (defaultAddress) setAddressId(defaultAddress.id);
        else setShowNewAddressForm(true);
      })
      .catch(() => setError("Không thể tải danh sách địa chỉ đã lưu."));

    setLoadingProvinces(true);
    getProvinces()
      .then(({ data }) => {
        // API có thể trả danh sách trực tiếp hoặc bọc trong data.
        const list = Array.isArray(data)
          ? data
          : data.data || data.results || [];
        setProvinces(list);
      })
      .catch(() => setError("Không thể tải danh sách tỉnh/thành phố."))
      .finally(() => setLoadingProvinces(false));
  }, []);

  const onProvinceChange = async (code) => {
    const province = provinces.find(
      (item) => String(item.code) === String(code),
    );

    setNewAddr((current) => ({
      ...current,
      province_code: code,
      province_name: province?.name || "",
      ward_code: "",
      ward_name: "",
    }));
    setWards([]);

    if (!code) return;

    setLoadingWards(true);
    setError("");
    try {
      const { data } = await getWardsByProvince(code);
      const list = Array.isArray(data)
        ? data
        : data.wards || data.data || data.results || [];
      setWards(list);
    } catch {
      setError("Không thể tải danh sách phường/xã của tỉnh/thành đã chọn.");
    } finally {
      setLoadingWards(false);
    }
  };

  const onWardChange = (code) => {
    const ward = wards.find((item) => String(item.code) === String(code));
    setNewAddr((current) => ({
      ...current,
      ward_code: code,
      ward_name: ward?.name || "",
    }));
  };

  const saveNewAddress = async () => {
    setError("");

    if (
      !newAddr.receiver_name.trim() ||
      !newAddr.receiver_phone.trim() ||
      !newAddr.province_code ||
      !newAddr.ward_code ||
      !newAddr.street_address.trim()
    ) {
      setError(
        "Vui lòng nhập đầy đủ thông tin và chọn tỉnh/thành phố, phường/xã.",
      );
      return;
    }

    setSavingAddress(true);
    try {
      const { data } = await createAddress(newAddr);
      const savedAddress = data.data;
      setAddresses((list) => [savedAddress, ...list]);
      setAddressId(savedAddress.id);
      setShowNewAddressForm(false);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Không thể lưu địa chỉ. Backend có thể vẫn đang yêu cầu thông tin quận/huyện.",
      );
    } finally {
      setSavingAddress(false);
    }
  };

  const applyCoupon = async () => {
    setCouponError("");
    setCouponResult(null);
    if (!couponCode.trim()) return;

    try {
      const { data } = await validateCoupon({
        code: couponCode.trim(),
        subtotal: cart.subtotal,
      });
      setCouponResult(data.data);
    } catch (err) {
      setCouponError(
        err.response?.data?.message || "Mã giảm giá không hợp lệ.",
      );
    }
  };

  const discount = couponResult?.discount_amount || 0;
  const total = Math.max(0, cart.subtotal + DELIVERY_FEE - discount);

  const handleSubmit = async () => {
    setError("");
    if (!addressId) {
      setError("Vui lòng chọn hoặc thêm địa chỉ giao hàng.");
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await checkoutApi({
        address_id: addressId,
        payment_method: paymentMethod,
        coupon_code: couponResult ? couponCode.trim() : undefined,
        customer_note: note || undefined,
      });

      await refreshCart();
      if (paymentMethod === "PAYPAL") {
        navigate(`/thanh-toan/paypal-mock/${data.data.id}`);
      } else {
        navigate(`/dat-hang-thanh-cong/${data.data.id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Đặt hàng thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="container empty-state">
        <p>Giỏ hàng trống, không thể thanh toán.</p>
      </div>
    );
  }

  return (
    <div
      className="container"
      style={{
        padding: "32px 20px 60px",
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 340px",
        gap: 32,
      }}
    >
      <div className="flex-col gap-24">
        <section className="card" style={{ padding: 20 }}>
          <h3 style={{ marginBottom: 14 }}>1. Địa chỉ giao hàng</h3>

          <div className="flex-col gap-10">
            {addresses.map((address) => (
              <label
                key={address.id}
                className="flex items-center gap-8"
                style={{
                  border: "1.5px solid var(--color-line)",
                  borderRadius: 10,
                  padding: 12,
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="address"
                  checked={String(addressId) === String(address.id)}
                  onChange={() => setAddressId(address.id)}
                  style={{ width: "auto" }}
                />
                <div>
                  <strong>
                    {address.label} — {address.receiver_name} (
                    {address.receiver_phone})
                  </strong>
                  <div style={{ fontSize: 13, color: "var(--color-ink-soft)" }}>
                    {[
                      address.street_address,
                      address.ward_name,
                      address.district_name,
                      address.province_name,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                </div>
              </label>
            ))}
          </div>

          <button
            className="btn btn-ghost"
            style={{ marginTop: 10 }}
            onClick={() => {
              setShowNewAddressForm((show) => !show);
              setError("");
            }}
          >
            + Thêm địa chỉ mới
          </button>

          {showNewAddressForm && (
            <div
              style={{
                marginTop: 14,
                borderTop: "1px solid var(--color-line-soft)",
                paddingTop: 14,
              }}
            >
              <div className="flex gap-8" style={{ marginBottom: 8 }}>
                <input
                  placeholder="Họ tên người nhận"
                  value={newAddr.receiver_name}
                  onChange={(event) =>
                    setNewAddr((a) => ({
                      ...a,
                      receiver_name: event.target.value,
                    }))
                  }
                />
                <input
                  placeholder="Số điện thoại"
                  value={newAddr.receiver_phone}
                  onChange={(event) =>
                    setNewAddr((a) => ({
                      ...a,
                      receiver_phone: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="flex gap-8" style={{ marginBottom: 8 }}>
                <select
                  value={newAddr.province_code}
                  onChange={(event) => onProvinceChange(event.target.value)}
                  disabled={loadingProvinces}
                >
                  <option value="">
                    {loadingProvinces
                      ? "Đang tải tỉnh/thành..."
                      : "-- Tỉnh/Thành phố --"}
                  </option>
                  {provinces.map((province) => (
                    <option key={province.code} value={province.code}>
                      {province.name}
                    </option>
                  ))}
                </select>

                <select
                  value={newAddr.ward_code}
                  onChange={(event) => onWardChange(event.target.value)}
                  disabled={
                    !newAddr.province_code || loadingWards || wards.length === 0
                  }
                >
                  <option value="">
                    {loadingWards ? "Đang tải phường/xã..." : "-- Phường/Xã --"}
                  </option>
                  {wards.map((ward) => (
                    <option key={ward.code} value={ward.code}>
                      {ward.name}
                    </option>
                  ))}
                </select>
              </div>

              <input
                placeholder="Số nhà, tên đường..."
                value={newAddr.street_address}
                onChange={(event) =>
                  setNewAddr((a) => ({
                    ...a,
                    street_address: event.target.value,
                  }))
                }
                style={{ marginBottom: 10 }}
              />

              <button
                className="btn btn-primary btn-sm"
                onClick={saveNewAddress}
                disabled={savingAddress}
              >
                {savingAddress ? "Đang lưu..." : "Lưu địa chỉ"}
              </button>
            </div>
          )}
        </section>

        <section className="card" style={{ padding: 20 }}>
          <h3 style={{ marginBottom: 14 }}>2. Mã giảm giá</h3>
          <div className="flex gap-8">
            <input
              placeholder="Nhập mã giảm giá"
              value={couponCode}
              onChange={(event) =>
                setCouponCode(event.target.value.toUpperCase())
              }
            />
            <button className="btn btn-outline" onClick={applyCoupon}>
              Áp dụng
            </button>
          </div>
          {couponError && (
            <p
              style={{
                color: "var(--color-primary)",
                fontSize: 13,
                marginTop: 6,
              }}
            >
              {couponError}
            </p>
          )}
          {couponResult && (
            <p
              style={{
                color: "var(--color-green)",
                fontSize: 13,
                marginTop: 6,
              }}
            >
              Áp dụng thành công — giảm{" "}
              {formatMoney(couponResult.discount_amount)}
            </p>
          )}
        </section>

        <section className="card" style={{ padding: 20 }}>
          <h3 style={{ marginBottom: 14 }}>3. Phương thức thanh toán</h3>
          <div className="flex-col gap-10">
            {[
              { value: "COD", label: "Thanh toán khi nhận hàng (COD)" },
              {
                value: "BANK_TRANSFER",
                label: "Chuyển khoản ngân hàng qua mã QR",
              },
            ].map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-8"
                style={{
                  border: "1.5px solid var(--color-line)",
                  borderRadius: 10,
                  padding: 12,
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === option.value}
                  onChange={() => setPaymentMethod(option.value)}
                  style={{ width: "auto" }}
                />
                {option.label}
              </label>
            ))}
          </div>
          <textarea
            placeholder="Ghi chú cho đơn hàng (tuỳ chọn)"
            rows={2}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            style={{ marginTop: 14 }}
          />
        </section>
      </div>

      <aside className="card" style={{ padding: 20, alignSelf: "start" }}>
        <h3 style={{ marginBottom: 16 }}>Đơn hàng ({cart.item_count} món)</h3>
        <div
          className="flex-col gap-6"
          style={{ marginBottom: 14, maxHeight: 200, overflowY: "auto" }}
        >
          {cart.items.map((item) => (
            <div
              key={item.cart_item_id}
              className="flex justify-between"
              style={{ fontSize: 13.5 }}
            >
              <span>
                {item.product_name} ({item.variant_name}) x{item.quantity}
              </span>
              <span>{formatMoney(item.line_total)}</span>
            </div>
          ))}
        </div>

        <hr
          style={{
            border: "none",
            borderTop: "1px solid var(--color-line-soft)",
          }}
        />
        <div className="flex justify-between" style={{ margin: "10px 0" }}>
          <span>Tạm tính</span>
          <span>{formatMoney(cart.subtotal)}</span>
        </div>
        <div className="flex justify-between" style={{ marginBottom: 10 }}>
          <span>Phí giao hàng</span>
          <span>{formatMoney(DELIVERY_FEE)}</span>
        </div>
        {discount > 0 && (
          <div
            className="flex justify-between"
            style={{ marginBottom: 10, color: "var(--color-green)" }}
          >
            <span>Giảm giá</span>
            <span>-{formatMoney(discount)}</span>
          </div>
        )}
        <hr
          style={{
            border: "none",
            borderTop: "1px solid var(--color-line-soft)",
          }}
        />
        <div
          className="flex justify-between"
          style={{
            margin: "10px 0 18px",
            fontSize: "1.2rem",
            fontFamily: "var(--font-display)",
          }}
        >
          <span>Tổng cộng</span>
          <strong style={{ color: "var(--color-primary)" }}>
            {formatMoney(total)}
          </strong>
        </div>

        {error && (
          <p
            style={{
              color: "var(--color-primary)",
              fontSize: 13,
              marginBottom: 10,
            }}
          >
            {error}
          </p>
        )}
        <button
          className="btn btn-primary btn-block"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Đang xử lý..." : "Đặt hàng"}
        </button>
      </aside>
    </div>
  );
}
