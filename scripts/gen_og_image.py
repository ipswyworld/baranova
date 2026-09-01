"""Generate assets/og-image.png (1200x630) — the social share card for Baranova."""
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1200, 630
BURGUNDY = (92, 14, 20)
BURGUNDY_DEEP = (42, 6, 9)
BURGUNDY_DARK = (58, 9, 13)
ACCENT = (197, 123, 60)         # terracotta
ACCENT_LIGHT = (214, 164, 116)  # verified-contrast light tint
MUTED = (201, 183, 168)

img = Image.new("RGB", (W, H), BURGUNDY)

# Dawn glow rising from the lower-left, echoing the splash screen
glow = Image.new("L", (W, H), 0)
gd = ImageDraw.Draw(glow)
gd.ellipse([W*0.05, H*0.35, W*0.75, H*1.25], fill=90)
glow = glow.filter(ImageFilter.GaussianBlur(150))
overlay = Image.new("RGB", (W, H), (110, 55, 24))
img = Image.composite(overlay, img, Image.eval(glow, lambda p: 255 - p))

vignette = Image.new("L", (W, H), 0)
vd = ImageDraw.Draw(vignette)
vd.ellipse([W*0.15, H*0.05, W*0.95, H*0.85], fill=70)
vignette = vignette.filter(ImageFilter.GaussianBlur(140))
deep = Image.new("RGB", (W, H), BURGUNDY_DEEP)
img = Image.composite(deep, img, Image.eval(vignette, lambda p: 255 - p))

draw = ImageDraw.Draw(img)

def font(path_candidates, size):
    for p in path_candidates:
        try:
            return ImageFont.truetype(p, size)
        except Exception:
            continue
    return ImageFont.load_default()

wordmark_bold = font([
    "C:/Windows/Fonts/segoeuib.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
], 82)
body_reg = font([
    "C:/Windows/Fonts/segoeui.ttf",
    "C:/Windows/Fonts/arial.ttf",
], 30)
kicker_font = font([
    "C:/Windows/Fonts/segoeuib.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
], 20)

# --- Sun-mark icon ---
cx, cy, r = 190, H // 2 - 10, 78
draw.ellipse([cx-r, cy-r, cx+r, cy+r], outline=ACCENT_LIGHT, width=5)
for i in range(12):
    a = math.radians(i * 30 - 90)
    x1, y1 = cx + math.cos(a)*(r-19), cy + math.sin(a)*(r-19)
    x2, y2 = cx + math.cos(a)*(r-31), cy + math.sin(a)*(r-31)
    draw.line([x1, y1, x2, y2], fill=ACCENT_LIGHT, width=8, joint="curve")
draw.ellipse([cx-24, cy-24, cx+24, cy+24], fill=ACCENT_LIGHT)

# --- Wordmark: BARA | seam | nova ---
word_x = 330
w1, w2 = "Bara", "nova"
bbox1 = draw.textbbox((0, 0), w1, font=wordmark_bold)
w1_width = bbox1[2] - bbox1[0]
text_y = cy - 140

draw.text((word_x, text_y), w1, font=wordmark_bold, fill=(255, 255, 255))

seam_x = word_x + w1_width + 14
seam_top, seam_bottom = text_y + 8, text_y + 92
draw.rounded_rectangle([seam_x, seam_top, seam_x + 6, seam_bottom], radius=3, fill=ACCENT_LIGHT)
draw.ellipse([seam_x - 3, seam_top - 9, seam_x + 9, seam_top + 3], fill=ACCENT_LIGHT)
draw.ellipse([seam_x - 3, seam_bottom - 3, seam_x + 9, seam_bottom + 9], fill=BURGUNDY_DARK, outline=ACCENT_LIGHT, width=3)

draw.text((seam_x + 26, text_y), w2, font=wordmark_bold, fill=ACCENT_LIGHT)

# --- Kicker: A NEW DAWN ---
draw.text((word_x + 2, text_y - 42), "A  N E W  D A W N", font=kicker_font, fill=ACCENT)

# --- Tagline ---
tagline = "A Nairobi software, data, and strategy studio."
draw.text((word_x, text_y + 116), tagline, font=body_reg, fill=MUTED)

# --- Footer strip ---
foot_font = font([
    "C:/Windows/Fonts/segoeui.ttf",
    "C:/Windows/Fonts/arial.ttf",
], 24)
draw.line([(80, H - 90), (W - 80, H - 90)], fill=ACCENT, width=1)
draw.text((80, H - 66), "NAIROBI · SOFTWARE · DATA · STRATEGY", font=foot_font, fill=ACCENT)

img.save("C:/Users/LENOVO/Desktop/ouronova/assets/og-image.png", "PNG")
print("saved", img.size)
