# Xử lý ảnh cưới (bản chỉnh sửa cuối của studio) cho thiệp, sinh anh/ + album.js
#  - chỉ lấy ảnh trong C:\HCM_UTE\Ánh\Ảnh cưới\Album và \Ảnh để trên thiệp (không đưa lên GitHub)
#  - đổi hệ màu Adobe RGB của studio sang sRGB: để nguyên thì trình duyệt hiểu sai, ảnh lên web bị nhạt, xỉn
#  - mỗi ảnh xuất vài cỡ cho srcset: máy nào cũng tải cỡ vừa đủ nét cho màn hình của nó
#  - ảnh in nhỏ (xấp ảnh album, ảnh lời cảm ơn) cắt khung 4:5 sát người cho mặt to, rõ
#  - làm nét nhẹ sau khi thu nhỏ, JPEG progressive, xoá EXIF, gắn hồ sơ màu sRGB
# Chạy bằng Python có Pillow: python tools/xu_ly_anh.py   ·   bảng ảnh để chọn: python tools/xu_ly_anh.py xem [ra.jpg]
import base64
import io
import json
import pathlib
import sys

from PIL import Image, ImageCms, ImageDraw, ImageFilter, ImageFont, ImageOps

NGUON = pathlib.Path(r"C:\HCM_UTE\Ánh\Ảnh cưới")
THU_MUC = ["Album", "Ảnh để trên thiệp"]
goc = pathlib.Path(__file__).resolve().parent.parent
RA = goc / "anh"
SRGB = ImageCms.ImageCmsProfile(ImageCms.createProfile("sRGB"))
ICC_SRGB = SRGB.tobytes()

# Chiều rộng xuất (px). Ảnh dọc 2:3, ảnh in 4:5. Cỡ giữa là ảnh mặc định khi trình duyệt không hiểu srcset.
CO_ALBUM = [800, 1200, 1800]          # xem album, xem như phim
CO_IN = [480, 720]                    # ảnh in nhỏ; nền mờ khi chiếu phim
CO_RIENG = {"bia": [900, 1400, 2000], "vom": [700, 1100, 1600], "camon": CO_IN,
            "og": [800]}                # og: chỉ để tools/og.html chụp ra og.jpg
KHUNG_IN_MAC_DINH = [0, 4, 100]       # [trái %, trên %, rộng %] của ảnh gốc


def tim(ten, uu_tien):
    for d in uu_tien:
        for duoi in (".jpg", ".jpeg", ".png"):
            f = NGUON / d / (ten + duoi)
            if f.exists():
                return f
    raise SystemExit(f"Không thấy ảnh {ten} trong {' / '.join(uu_tien)} ({NGUON})")


def mo(f):
    """Giải nén ở nửa cỡ gốc (đủ cho cỡ xuất lớn nhất), xoay theo EXIF, đổi sang sRGB."""
    im = Image.open(f)
    icc = im.info.get("icc_profile")
    im.draft("RGB", (im.size[0] // 2, im.size[1] // 2))
    im = ImageOps.exif_transpose(im).convert("RGB")
    if icc:
        nguon = ImageCms.ImageCmsProfile(io.BytesIO(icc))
        if "srgb" not in ImageCms.getProfileDescription(nguon).lower():
            im = ImageCms.profileToProfile(
                im, nguon, SRGB, renderingIntent=ImageCms.Intent.RELATIVE_COLORIMETRIC,
                flags=ImageCms.Flags.BLACKPOINTCOMPENSATION, outputMode="RGB")
    return im


def cat_in(im, khung):
    """Khung 4:5 [trái %, trên %, rộng %] trên ảnh; cao tự tính, khung trượt vào trong nếu lố mép."""
    W, H = im.size
    x, y, r = khung
    w = W * r / 100
    h = w * 5 / 4
    if h > H:
        h, w = H, H * 4 / 5
    x0 = min(max(0.0, W * x / 100), W - w)
    y0 = min(max(0.0, H * y / 100), H - h)
    return im.crop((round(x0), round(y0), round(x0 + w), round(y0 + h)))


def luu(im, duong, rong):
    cao = round(rong * im.size[1] / im.size[0])
    x = im.resize((rong, cao), Image.LANCZOS, reducing_gap=3.0)
    # Làm nét sau khi thu nhỏ: ngưỡng 2 để da đã chỉnh mịn không bị sạn
    x = x.filter(ImageFilter.UnsharpMask(0.6, 60, 2) if rong <= 800 else ImageFilter.UnsharpMask(0.75, 75, 2))
    x.save(duong, "JPEG", quality=88 if rong >= 1000 else 86, optimize=True, progressive=True, icc_profile=ICC_SRGB)
    return x.size


def mo_nho(im):
    t = im.copy()
    t.thumbnail((24, 24))
    t = t.filter(ImageFilter.GaussianBlur(0.6))
    b = io.BytesIO()
    t.save(b, "JPEG", quality=55)
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()


def xuat(im, ten, co):
    """Ghi các cỡ, trả về src mặc định + srcset + kích thước ảnh mặc định."""
    kt = {r: luu(im, RA / f"{ten}-{r}.jpg", r) for r in co}
    mac = co[len(co) // 2]
    return {"l": f"anh/{ten}-{mac}.jpg", "ls": ", ".join(f"anh/{ten}-{r}.jpg {r}w" for r in co),
            "w": kt[mac][0], "h": kt[mac][1]}


if len(sys.argv) > 1 and sys.argv[1] == "xem":
    # Bảng ảnh kèm tên tệp để chọn thứ tự album / ảnh dùng riêng
    tep = [f for d in THU_MUC if (NGUON / d).is_dir() for f in sorted((NGUON / d).iterdir())
           if f.suffix.lower() in (".jpg", ".jpeg", ".png")]
    try:
        font = ImageFont.truetype("arial.ttf", 18)
    except OSError:
        font = ImageFont.load_default()
    w, cot = 260, 7
    nho = []
    for f in tep:
        t = Image.open(f)
        t.draft("RGB", (w * 2, w * 3))
        t = ImageOps.exif_transpose(t).convert("RGB")
        t.thumbnail((w, int(w * 1.5)))
        nho.append((f, t))
    hmax = max(t.size[1] for _, t in nho) + 30
    S = Image.new("RGB", (cot * (w + 8) + 8, ((len(nho) + cot - 1) // cot) * (hmax + 8) + 8), "white")
    d = ImageDraw.Draw(S)
    for i, (f, t) in enumerate(nho):
        x, y = 8 + (i % cot) * (w + 8), 8 + (i // cot) * (hmax + 8)
        S.paste(t, (x, y))
        d.text((x, y + hmax - 26), f"{f.parent.name[:10]}/{f.stem}", fill="black", font=font)
    S.save(sys.argv[2] if len(sys.argv) > 2 else "bang_anh.jpg", quality=85)
    sys.exit(0)

CFG = json.loads((goc / "tools" / "thu_tu_anh.json").read_text(encoding="utf-8"))
RA.mkdir(exist_ok=True)
for cu in RA.glob("*.jpg"):
    cu.unlink()

album = []
for stt, ten in enumerate(CFG["album"], 1):
    f = tim(ten, THU_MUC)
    im = mo(f)
    so = f"{stt:02d}"
    a = xuat(im, so, CO_ALBUM)
    anh_in = cat_in(im, CFG.get("in", {}).get(ten, KHUNG_IN_MAC_DINH))
    b = xuat(anh_in, f"{so}-in", CO_IN)
    a.update(s=b["l"], ss=b["ls"], m=mo_nho(im), mi=mo_nho(anh_in))
    album.append(a)
    print(f"album {so} <- {f.parent.name}/{f.name}")

vi_tri = {t: i + 1 for i, t in enumerate(CFG["album"])}
noi_bat = [vi_tri[t] for t in CFG["noi_bat"]]

rieng = {}
for ten_o, o in CFG["rieng"].items():
    f = tim(o["tep"], THU_MUC[::-1])  # ưu tiên thư mục "Ảnh để trên thiệp"
    im = mo(f)
    if "in" in o:
        im = cat_in(im, o["in"])
    r = xuat(im, ten_o, CO_RIENG[ten_o])
    r["m"] = mo_nho(im)
    if o.get("tam"):
        r["p"] = o["tam"]
    rieng[ten_o] = r
    print(f"{ten_o} <- {f.parent.name}/{f.name}")

(goc / "album.js").write_text(
    "// Sinh bởi tools/xu_ly_anh.py — không sửa tay\nwindow.ALBUM = " + json.dumps(
        {"anh": album, "rieng": rieng, "noiBat": noi_bat}, ensure_ascii=False) + ";\n",
    encoding="utf-8")
tong = sum(p.stat().st_size for p in RA.glob("*.jpg"))
print(f"Xong: {len(album)} ảnh album + {len(rieng)} ảnh riêng, {len(list(RA.glob('*.jpg')))} tệp, {tong / 1e6:.1f} MB")
