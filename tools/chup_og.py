# Chụp tools/og.html thành og.jpg (ảnh xem trước 1200x630 khi gửi link qua Messenger/Facebook)
# Cần: pip install playwright pillow, máy có Microsoft Edge. Chạy: python tools/chup_og.py
import io
import pathlib
from PIL import Image
from playwright.sync_api import sync_playwright

goc = pathlib.Path(__file__).resolve().parent.parent
with sync_playwright() as p:
    b = p.chromium.launch(channel="msedge", headless=True)
    pg = b.new_page(viewport={"width": 1200, "height": 630}, device_scale_factor=1)
    pg.goto((goc / "tools" / "og.html").as_uri(), wait_until="networkidle")
    pg.evaluate("document.fonts.ready")
    pg.wait_for_timeout(600)
    png = pg.screenshot()
    b.close()
Image.open(io.BytesIO(png)).convert("RGB").save(goc / "og.jpg", quality=88, optimize=True, progressive=True)
print("Da ghi", goc / "og.jpg")
