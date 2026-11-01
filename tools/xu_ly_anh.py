# Xử lý ảnh cưới cho thiệp: bỏ ảnh trùng, thu nhỏ, xoá EXIF, sinh anh/ + album.js
# Ảnh gốc: C:\HCM_UTE\Ánh (không đưa lên GitHub). Chạy: python tools/xu_ly_anh.py [xem]
import base64
import io
import json
import pathlib
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

NGUON = pathlib.Path(r"C:\HCM_UTE\Ánh")
goc = pathlib.Path(__file__).resolve().parent.parent
RA = goc / "anh"


def mo(f, canh):
    im = Image.open(f)
    im.draft("RGB", (canh, canh))
    return ImageOps.exif_transpose(im).convert("RGB")


def dhash(im, n=16):
    g = im.convert("L").resize((n + 1, n), Image.LANCZOS)
    px = list(g.getdata())
    return sum(1 << i for i in range(n * n) if px[(i // n) * (n + 1) + i % n] > px[(i // n) * (n + 1) + i % n + 1])


# 1. Gom ảnh, bỏ trùng (giữ bản có độ phân giải lớn nhất)
tep = sorted((NGUON / "Làm album").glob("*.jpg")) + sorted(NGUON.glob("*.jpg"))
nhom = []  # [{'tep': [...], 'bam': int, 'dien_tich': int, 'chinh': path}]
for f in tep:
    im = mo(f, 256)
    w, h = Image.open(f).size
    bam = dhash(im)
    for g in nhom:
        if bin(g["bam"] ^ bam).count("1") <= 12:
            g["tep"].append(f)
            if w * h > g["dien_tich"]:
                g.update(dien_tich=w * h, chinh=f)
            break
    else:
        nhom.append({"tep": [f], "bam": bam, "dien_tich": w * h, "chinh": f})

print(f"{len(tep)} tệp -> {len(nhom)} ảnh khác nhau")
for i, g in enumerate(nhom, 1):
    print(i, g["chinh"].name[:48], "| trùng:", [x.name[:26] for x in g["tep"] if x != g["chinh"]])

if len(sys.argv) > 1 and sys.argv[1] == "xem":
    # Bảng ảnh có số thứ tự để chọn thứ tự album
    try:
        font = ImageFont.truetype("arial.ttf", 22)
    except OSError:
        font = ImageFont.load_default()
    w = 240
    nho = [mo(g["chinh"], 600) for g in nhom]
    for t in nho:
        t.thumbnail((w, int(w * 1.6)))
    cot, hmax = 7, max(t.size[1] for t in nho)
    S = Image.new("RGB", (cot * (w + 8) + 8, ((len(nho) + cot - 1) // cot) * (hmax + 8) + 8), "white")
    d = ImageDraw.Draw(S)
    for i, t in enumerate(nho):
        x, y = 8 + (i % cot) * (w + 8), 8 + (i // cot) * (hmax + 8)
        S.paste(t, (x, y))
        d.rectangle([x, y, x + 36, y + 28], fill="black")
        d.text((x + 5, y + 2), str(i + 1), fill="yellow", font=font)
    S.save(sys.argv[2] if len(sys.argv) > 2 else "bang_anh.jpg", quality=85)
    sys.exit(0)

# 2. Thứ tự album (số theo bảng ảnh "xem") và ảnh dùng riêng trên thiệp
THU_TU = json.loads((goc / "tools" / "thu_tu_anh.json").read_text(encoding="utf-8"))
RA.mkdir(exist_ok=True)
for cu in RA.glob("*.jpg"):
    cu.unlink()


def luu(im, duong, canh, chat):
    im = im.copy()
    im.thumbnail((canh, canh), Image.LANCZOS)
    im.save(duong, "JPEG", quality=chat, optimize=True, progressive=True)  # không kèm EXIF
    return im.size


def mo_nho(im):
    t = im.copy()
    t.thumbnail((24, 24))
    t = t.filter(ImageFilter.GaussianBlur(0.6))
    b = io.BytesIO()
    t.save(b, "JPEG", quality=55)
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()


album = []
for stt, so in enumerate(THU_TU["album"], 1):
    im = mo(nhom[so - 1]["chinh"], 2400)
    w, h = luu(im, RA / f"{stt:02d}.jpg", 1800, 80)
    luu(im, RA / f"{stt:02d}n.jpg", 820, 76)
    album.append({"l": f"anh/{stt:02d}.jpg", "s": f"anh/{stt:02d}n.jpg", "w": w, "h": h, "m": mo_nho(im)})
    print(f"album {stt:02d} <- ảnh {so}  {w}x{h}")

rieng = {}
for ten, so in THU_TU["rieng"].items():
    im = mo(nhom[so - 1]["chinh"], 3000)
    w, h = luu(im, RA / f"{ten}.jpg", 2200, 80)
    rieng[ten] = {"l": f"anh/{ten}.jpg", "w": w, "h": h, "m": mo_nho(im)}
    print(f"{ten} <- ảnh {so}  {w}x{h}")

(goc / "album.js").write_text(
    "// Sinh bởi tools/xu_ly_anh.py — không sửa tay\nwindow.ALBUM = " + json.dumps(
        {"anh": album, "rieng": rieng, "noiBat": THU_TU["noi_bat"]}, ensure_ascii=False) + ";\n",
    encoding="utf-8")
tong = sum(p.stat().st_size for p in RA.glob("*.jpg"))
print(f"Xong: {len(album)} ảnh album + {len(rieng)} ảnh riêng, {tong / 1e6:.1f} MB")
