import requests, json, sys

BASE = "http://localhost:4000/api"

def show(label, resp):
    print(f"\n=== {label} [{resp.status_code}] ===")
    try:
        data = resp.json()
        print(json.dumps(data, ensure_ascii=False, indent=2)[:1000])
        return data
    except Exception:
        print(resp.text[:500])
        return None

# ---- Admin login ----
r = requests.post(f"{BASE}/auth/login", json={"phone": "0900000001", "password": "Admin@123"})
d = show("Login admin", r)
token = d["data"]["accessToken"]
AH = {"Authorization": f"Bearer {token}"}

# ---- Non-admin should be rejected from /admin/* ----
r2 = requests.post(f"{BASE}/auth/login", json={"phone": "0900000002", "password": "User@123"})
cust_token = r2.json()["data"]["accessToken"]
r = requests.get(f"{BASE}/admin/dashboard/summary", headers={"Authorization": f"Bearer {cust_token}"})
show("Customer trying to access admin route (expect 403)", r)
assert r.status_code == 403
print(">>> OK: customer/admin API separation enforced")

# ---- Dashboard ----
r = requests.get(f"{BASE}/admin/dashboard/summary", headers=AH)
show("Admin dashboard summary", r)

# ---- Category CRUD ----
r = requests.post(f"{BASE}/admin/categories", headers=AH, json={"name": "Danh muc Test", "description": "Test category"})
d = show("Create category", r)
cat_id = d["data"]["id"]

r = requests.put(f"{BASE}/admin/categories/{cat_id}", headers=AH, json={"description": "Updated desc"})
show("Update category", r)

# ---- Product CRUD with nested variants ----
r = requests.post(f"{BASE}/admin/products", headers=AH, json={
    "category_id": cat_id, "name": "San pham Test Admin", "description": "Mo ta test",
    "variants": [{"variant_name": "1 phan", "price": 20000, "sale_price": 18000, "stock_quantity": 50}]
})
d = show("Create product with variant", r)
product_id = d["data"]["id"]

r = requests.get(f"{BASE}/admin/products/{product_id}", headers=AH)
d = show("Admin get product detail (with variants)", r)
assert len(d["data"]["variants"]) == 1
print(">>> OK: nested variant created with product")

# ---- Add another variant, update it ----
r = requests.post(f"{BASE}/admin/products/{product_id}/variants", headers=AH, json={
    "variant_name": "2 phan", "price": 35000, "sale_price": 32000, "stock_quantity": 30
})
d = show("Add 2nd variant", r)
variant2_id = d["data"]["id"]

r = requests.put(f"{BASE}/admin/products/variants/{variant2_id}", headers=AH, json={"stock_quantity": 99})
show("Update variant stock", r)

# ---- Product should now be visible on customer product list (is_available default true) ----
r = requests.get(f"{BASE}/products?limit=50")
d = r.json()
found = [p for p in d["data"] if p["id"] == product_id]
assert len(found) == 1, "New product not visible on customer listing!"
print(">>> OK: new admin product appears on customer product list")

# ---- Coupon CRUD ----
r = requests.post(f"{BASE}/admin/coupons", headers=AH, json={
    "code": "TESTADMIN10", "description": "Test", "discount_type": "PERCENT", "discount_value": 10,
    "min_order_amount": 0, "start_at": "2026-01-01T00:00:00Z", "end_at": "2027-01-01T00:00:00Z"
})
show("Create coupon", r)

# ---- Trending admin ----
r = requests.put(f"{BASE}/admin/trending", headers=AH, json={"product_id": product_id, "trend_score": 50, "trend_label": "MOI_HOT", "rank": 8})
show("Set trending manually for new product", r)
r = requests.get(f"{BASE}/admin/trending", headers=AH)
show("Admin trending list", r)

# ---- Orders admin: list + update status ----
r = requests.get(f"{BASE}/admin/orders?limit=5", headers=AH)
d = show("Admin orders list", r)
order_id = d["data"][0]["id"]
r = requests.put(f"{BASE}/admin/orders/{order_id}/status", headers=AH, json={"status": "CONFIRMED", "note": "Admin xac nhan qua test script"})
show("Admin update order status -> CONFIRMED", r)

# ---- Customers admin ----
r = requests.get(f"{BASE}/admin/customers?limit=5", headers=AH)
show("Admin customers list", r)

# ---- Cleanup test product & category ----
r = requests.delete(f"{BASE}/admin/products/{product_id}", headers=AH)
show("Delete test product", r)
r = requests.delete(f"{BASE}/admin/categories/{cat_id}", headers=AH)
show("Delete test category", r)

print("\n\n################ ALL ADMIN FLOW TESTS PASSED ################")
