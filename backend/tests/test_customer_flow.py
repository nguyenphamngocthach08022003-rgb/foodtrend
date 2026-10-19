import requests, json, sys

BASE = "http://localhost:4000/api"

def show(label, resp):
    print(f"\n=== {label} [{resp.status_code}] ===")
    try:
        data = resp.json()
        print(json.dumps(data, ensure_ascii=False, indent=2)[:1200])
        return data
    except Exception:
        print(resp.text[:500])
        return None

# ---- Customer login ----
r = requests.post(f"{BASE}/auth/login", json={"phone": "0900000002", "password": "User@123"})
d = show("Login customer", r)
cust_token = d["data"]["accessToken"]
CH = {"Authorization": f"Bearer {cust_token}"}

# ---- Cart (seed already has items) ----
r = requests.get(f"{BASE}/cart", headers=CH)
d = show("Get cart (seeded)", r)

# ---- Add same variant again -> should merge quantity, not duplicate row ----
variant_id = d["data"]["items"][0]["variant_id"]
before_qty = d["data"]["items"][0]["quantity"]
r = requests.post(f"{BASE}/cart/items", headers=CH, json={"variant_id": variant_id, "quantity": 1})
d2 = show("Add duplicate variant (should merge qty)", r)
after_item = [i for i in d2["data"]["items"] if i["variant_id"] == variant_id][0]
assert after_item["quantity"] == before_qty + 1, "Duplicate variant did not merge quantity!"
print(f">>> OK duplicate-variant merge: {before_qty} -> {after_item['quantity']}")

# ---- Coupon validate (below min order) ----
r = requests.post(f"{BASE}/coupons/validate", json={"code": "FOOD30K", "subtotal": 50000})
show("Validate coupon below min order (expect 400)", r)

# ---- Coupon validate (meets min order) ----
subtotal_now = d2["data"]["subtotal"]
r = requests.post(f"{BASE}/coupons/validate", json={"code": "WELCOME20", "subtotal": subtotal_now})
d3 = show("Validate coupon WELCOME20", r)

# ---- Address CRUD ----
r = requests.get(f"{BASE}/addresses", headers=CH)
show("List addresses (seeded default)", r)

new_addr = {
    "label": "Công ty", "receiver_name": "Nguyễn Minh Anh", "receiver_phone": "0900000002",
    "province_code": "48", "province_name": "Thành phố Đà Nẵng",
    "district_code": "494", "district_name": "Quận Thanh Khê",
    "ward_code": "19024", "ward_name": "Phường Thanh Khê Tây",
    "street_address": "99 Điện Biên Phủ",
}
r = requests.post(f"{BASE}/addresses", headers=CH, json=new_addr)
d4 = show("Create new address", r)
addr_id = d4["data"]["id"]

# ---- Checkout using the new address + coupon ----
r = requests.post(f"{BASE}/orders/checkout", headers=CH, json={
    "address_id": addr_id, "payment_method": "COD", "coupon_code": "WELCOME20", "customer_note": "Test order tu script",
})
d5 = show("Checkout (COD + coupon)", r)
if r.status_code >= 400:
    print("CHECKOUT FAILED - stopping here"); sys.exit(1)
order_id = d5["data"]["id"]
order_code = d5["data"]["order_code"]
product_id_bought = d5["data"]["items"][0]["product_id"]

# ---- Cart should now be empty ----
r = requests.get(f"{BASE}/cart", headers=CH)
d6 = show("Cart after checkout (should be empty)", r)
assert len(d6["data"]["items"]) == 0, "Cart was not cleared after checkout!"
print(">>> OK cart cleared after checkout")

# ---- My orders list ----
r = requests.get(f"{BASE}/orders", headers=CH)
show("My orders list", r)

# ---- Favorites ----
r = requests.post(f"{BASE}/favorites", headers=CH, json={"product_id": product_id_bought})
show("Add favorite", r)
r = requests.get(f"{BASE}/favorites", headers=CH)
show("List favorites", r)

# ---- Review gating: try to review a product NOT purchased ----
r = requests.get(f"{BASE}/products?limit=30")
all_products = r.json()["data"]
not_bought = [p for p in all_products if p["id"] != product_id_bought][0]
r = requests.get(f"{BASE}/reviews/product/{not_bought['id']}/reviewable-orders", headers=CH)
d7 = show(f"Reviewable orders for NOT purchased product ({not_bought['name']})", r)
assert d7["data"] == [], "Product not purchased should have no reviewable orders!"
print(">>> OK: cannot review a product not purchased (empty reviewable list)")

r = requests.post(f"{BASE}/reviews", headers=CH, json={"product_id": not_bought["id"], "order_id": order_id, "rating": 5, "comment": "Gian lan review"})
show("Try submit review for product not in this order (expect 403)", r)
assert r.status_code == 403, "Should reject review for product not purchased in that order!"
print(">>> OK: backend rejects review/comment without purchase")

# ---- Review gating: purchased product should work ----
r = requests.get(f"{BASE}/reviews/product/{product_id_bought}/reviewable-orders", headers=CH)
d8 = show("Reviewable orders for PURCHASED product", r)
assert len(d8["data"]) > 0
r = requests.post(f"{BASE}/reviews", headers=CH, json={"product_id": product_id_bought, "order_id": order_id, "rating": 5, "comment": "San pham ngon, giao nhanh!"})
show("Submit review for purchased product (expect 201)", r)
assert r.status_code == 201
print(">>> OK: review/comment succeeds after purchase")

# ---- Forgot / reset password (mã 6 số qua email) ----
r = requests.post(f"{BASE}/auth/forgot-password", json={"identifier": "0900000003"})
d9 = show("Forgot password", r)
assert r.status_code == 200
dev_code = d9["data"].get("dev_code")
if dev_code:
    # Chưa cấu hình Gmail (chế độ dev): backend trả mã trong response nên test được trọn luồng
    r = requests.post(f"{BASE}/auth/reset-password", json={"identifier": "0900000003", "code": dev_code, "new_password": "NewPass@123"})
    show("Reset password", r)
    assert r.status_code == 200
    r = requests.post(f"{BASE}/auth/login", json={"identifier": "0900000003", "password": "NewPass@123"})
    show("Login with NEW password after reset", r)
    assert r.status_code == 200
    print(">>> OK: forgot/reset password flow works end-to-end (dev mode)")
else:
    print(">>> Đã bật gửi Gmail thật: mã chỉ nằm trong email -> luồng quên mật khẩu được test bởi `node tests/test_email_auth.js`")

print("\n\n################ ALL CUSTOMER FLOW TESTS PASSED ################")
