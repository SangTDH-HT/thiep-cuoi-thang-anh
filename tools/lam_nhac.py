# Làm nhạc nền từ video TikTok anh tải về (nhạc có bản quyền, không đưa lên GitHub).
# Cắt bỏ khoảng lặng đầu và màn logo TikTok cuối video, chuẩn hoá độ to, rồi:
#   HOA > 0: hoà HOA giây cuối vào đầu, nối sẵn SO_VONG vòng (đoạn nhạc ngắn, lặp liền mạch)
#   HOA = 0: để bài kết tự nhiên, nghỉ NGHI giây rồi phát lại (bản nhạc trọn bài)
# Chạy bằng Python có numpy: python tools/lam_nhac.py  ->  nhac/nhac-nen.mp3
import pathlib
import subprocess
import wave

import numpy as np

# Bản piano "Canon in D + Beautiful In White" (@jgabiemusic), video 90,7 s; logo TikTok bắt đầu ở 86,7 s
NGUON = pathlib.Path(r"C:\HCM_UTE\Ánh\1793545788461_213406040512264101_6975746669534031261.mp4")
BAT_DAU = 1.40     # giây; nốt đầu ở 1,6 s
KET_THUC = 86.55   # giây; hợp âm kết ngân tới đây, 86,7 s là tiếng TikTok
NHO_DAN = 1.6      # giây làm nhỏ dần đoạn ngân cuối
HOA = 0.0
SO_VONG = 1
NGHI = 1.2
SR = 44100

goc = pathlib.Path(__file__).resolve().parent.parent
ra = goc / "nhac"
ra.mkdir(exist_ok=True)

tho = subprocess.run(
    ["ffmpeg", "-hide_banner", "-loglevel", "error", "-ss", str(BAT_DAU), "-t", str(KET_THUC - BAT_DAU),
     "-i", str(NGUON), "-vn", "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", str(SR), "-ac", "2", "-f", "f32le", "-"],
    capture_output=True, check=True).stdout
a = np.frombuffer(tho, dtype=np.float32).reshape(-1, 2).copy()
n = len(a)

if HOA > 0:
    x = int(HOA * SR)
    t = np.linspace(0, np.pi / 2, x, dtype=np.float32)[:, None]
    s = a[x:].copy()
    s[-x:] = a[n - x:] * np.cos(t) + a[:x] * np.sin(t)
    dau = a[:x].copy()
    dau[: int(0.5 * SR)] *= np.linspace(0, 1, int(0.5 * SR), dtype=np.float32)[:, None]
    bai = np.concatenate([dau] + [s] * SO_VONG)
else:
    m = int(NHO_DAN * SR)
    a[-m:] *= np.linspace(1, 0, m, dtype=np.float32)[:, None]
    bai = np.concatenate([a, np.zeros((int(NGHI * SR), 2), dtype=np.float32)] * SO_VONG)
bai = np.clip(bai, -1, 1)

wav = ra / "nhac-nen.wav"
with wave.open(str(wav), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((bai * 32767).astype("<i2").tobytes())
subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(wav),
                "-c:a", "libmp3lame", "-b:a", "112k", "-map_metadata", "-1", str(ra / "nhac-nen.mp3")], check=True)
wav.unlink()
print(f"{len(bai) / SR:.1f} s -> {ra / 'nhac-nen.mp3'}")
