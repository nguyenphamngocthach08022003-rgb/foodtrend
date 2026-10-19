import os, struct, zlib, requests

def make_test_png(path):
    """Tạo 1 ảnh PNG nhỏ hợp lệ (không cần cài thêm thư viện)."""
    w = h = 8
    raw = b"".join(b"\x00" + b"\xd6\x28\x39" * w for _ in range(h))
    def chunk(t, d):
        c = struct.pack(">I", len(d)) + t + d
        return c + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(raw)) + chunk(b"IEND", b"")
    open(path, "wb").write(png)

TEST_IMG = "/tmp/test_product.png"
if not os.path.exists(TEST_IMG):
    make_test_png(TEST_IMG)

BASE = "http://localhost:4000/api"

r = requests.post(f"{BASE}/auth/login", json={"phone": "0900000001", "password": "Admin@123"})
token = r.json()["data"]["accessToken"]
AH = {"Authorization": f"Bearer {token}"}

# get an existing product to attach image to
r = requests.get(f"{BASE}/admin/products?limit=1", headers=AH)
product_id = r.json()["data"][0]["id"]
print("Using product:", product_id)

with open(TEST_IMG, "rb") as f:
    files = {"images": ("test_product.png", f, "image/png")}
    r = requests.post(f"{BASE}/admin/products/{product_id}/images", headers=AH, files=files)
print("Upload status:", r.status_code)
print(r.json())

image_url = r.json()["data"][0]["image_url"]
image_id = r.json()["data"][0]["id"]

# fetch the actual static file
full_url = f"http://localhost:4000{image_url}"
r2 = requests.get(full_url)
print("Static file fetch status:", r2.status_code, "size:", len(r2.content))
assert r2.status_code == 200 and len(r2.content) > 0
print(">>> OK: uploaded image is served correctly as a static file")

# cleanup
r3 = requests.delete(f"{BASE}/admin/products/images/{image_id}", headers=AH)
print("Delete image status:", r3.status_code)

r4 = requests.get(full_url)
print("After delete, fetch status (expect 404):", r4.status_code)
