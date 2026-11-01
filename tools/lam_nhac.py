# Làm nhạc nền lặp liền mạch từ video TikTok anh tải về (không đưa lên GitHub).
# Cắt trước màn logo TikTok, hoà 1,2 s cuối vào 1,2 s đầu, nối sẵn nhiều vòng trong một file.
# Chạy: python tools/lam_nhac.py  ->  nhac/nhac-nen.mp3
import pathlib
import subprocess
import wave

import numpy as np

NGUON = pathlib.Path(r"C:\HCM_UTE\Ánh\1793545216155_213406040512264101_8267720912175943151.mp4")
KET_THUC = 28.30  # giây; từ 28,4 s là màn logo TikTok có tiếng "bụp"
HOA = 1.2         # giây hoà cuối vào đầu
SO_VONG = 5
SR = 44100

goc = pathlib.Path(__file__).resolve().parent.parent
ra = goc / "nhac"
ra.mkdir(exist_ok=True)

# Giải mã + chuẩn hoá độ to (-16 LUFS), lấy PCM float32 stereo
tho = subprocess.run(
    ["ffmpeg", "-hide_banner", "-loglevel", "error", "-t", str(KET_THUC), "-i", str(NGUON), "-vn",
     "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", str(SR), "-ac", "2", "-f", "f32le", "-"],
    capture_output=True, check=True).stdout
a = np.frombuffer(tho, dtype=np.float32).reshape(-1, 2).copy()
n, x = len(a), int(HOA * SR)

# Vòng S = a[x:n], trong đó x mẫu cuối hoà (công suất đều) với x mẫu đầu
t = np.linspace(0, np.pi / 2, x, dtype=np.float32)[:, None]
s = a[x:].copy()
s[-x:] = a[n - x:] * np.cos(t) + a[:x] * np.sin(t)

dau = a[:x].copy()
dau[: int(0.5 * SR)] *= np.linspace(0, 1, int(0.5 * SR), dtype=np.float32)[:, None]  # vào bài êm (iPhone không tăng âm lượng dần được)
bai = np.concatenate([dau] + [s] * SO_VONG)
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
print(f"Vòng {len(s) / SR:.2f} s x {SO_VONG} + đầu {HOA} s = {len(bai) / SR:.1f} s -> {ra / 'nhac-nen.mp3'}")
