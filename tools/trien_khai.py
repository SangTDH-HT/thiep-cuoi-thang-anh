# Đẩy thiệp lên Cloudflare Pages (thanganh.pages.dev): chép file trang vào dist/ rồi gọi wrangler.
# Cần đăng nhập một lần: npx wrangler@4 login. Chạy: python tools/trien_khai.py
import pathlib
import shutil
import subprocess
import sys

DU_AN = "thanganh"
FILE_TRANG = ["index.html", "style.css", "config.js", "app.js", "flora.js", "hat.js", "nhac.js",
              "monogram.js", "favicon.svg", "og.jpg", "tao-link.html", "album.js"]

goc = pathlib.Path(__file__).resolve().parent.parent
dist = goc / "dist"
shutil.rmtree(dist, ignore_errors=True)
dist.mkdir()
for ten in FILE_TRANG:
    shutil.copy2(goc / ten, dist / ten)
# Ảnh cưới chỉ đưa lên Cloudflare, không đưa lên GitHub (xem .gitignore)
shutil.copytree(goc / "anh", dist / "anh")
# Nhạc có bản quyền: chỉ đẩy lên Cloudflare, không đưa lên GitHub
if (goc / "nhac").is_dir():
    shutil.copytree(goc / "nhac", dist / "nhac")
# Chỉ trang chủ đi qua Function (đổi tên khách trong khung xem trước); file tĩnh phục vụ thẳng, không tính lượt Function
(dist / "_routes.json").write_text('{"version": 1, "include": ["/", "/index.html"], "exclude": []}\n', encoding="utf-8")
(dist / "_headers").write_text(
    "/*\n  X-Robots-Tag: noindex\n  Referrer-Policy: strict-origin-when-cross-origin\n", encoding="utf-8")

if len(sys.argv) > 1 and sys.argv[1] == "dung":
    print("Da dung", dist)  # chỉ dựng dist/ để chạy thử: npx wrangler@4 pages dev dist
    sys.exit(0)

# functions/ phải nằm ở thư mục đang đứng khi gọi wrangler
subprocess.run(f"npx -y wrangler@4 pages deploy dist --project-name {DU_AN} --branch main --commit-dirty=true",
               cwd=goc, shell=True, check=True)
