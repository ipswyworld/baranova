"""Generate assets/og-image.png (1200x630) — the social share card for Ouronova."""
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1200, 630
BURGUNDY = (92, 14, 20)
BURGUNDY_DEEP = (42, 6, 9)
GOLD = (201, 162, 39)
GOLD_LIGHT = (240, 225, 147)
CREAM = (246, 239, 221)
MUTED = (201, 183, 168)

img = Image.new("RGB", (W, H), BURGUNDY)

# Radial-ish vignette: paint a soft lighter ellipse behind center via a separate
# layer blurred, so the background doesn't look flat.
glow = Image.new("L", (W, H), 0)
gd = ImageDraw.Draw(glow)
gd.ellipse([W*0.15, H*0.05, W*0.95, H*0.85], fill=70)
glow = glow.filter(ImageFilter.GaussianBlur(140))
overlay = Image.new("RGB", (W, H), BURGUNDY_DEEP)
img = Image.composite(overlay, img, Image.eval(glow, lambda p: 255 - p))

draw = ImageDraw.Draw(img)

def font(path_candidates, size):
    for p in path_candidates:
        try:
            return ImageFont.truetype(p, size)
        except Exception:
            continue
    return ImageFont.load_default()

poppins_bold = font([
    "C:/Windows/Fonts/segoeuib.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
], 82)
inter_reg = font([
    "C:/Windows/Fonts/segoeui.ttf",
    "C:/Windows/Fonts/arial.ttf",
], 30)

# --- Sun-mark icon ---
cx, cy, r = 190, H // 2, 78
draw.ellipse([cx-r, cy-r, cx+r, cy+r], outline=GOLD_LIGHT, width=5)
for i in range(12):
    a = math.radians(i * 30 - 90)
    x1, y1 = cx + math.cos(a)*(r-19), cy + math.sin(a)*(r-19)
    x2, y2 = cx + math.cos(a)*(r-31), cy + math.sin(a)*(r-31)
    draw.line([x1, y1, x2, y2], fill=GOLD_LIGHT, width=8, joint="curve")
draw.ellipse([cx-24, cy-24, cx+24, cy+24], fill=GOLD_LIGHT)

# --- Wordmark ---
word_x = 330
w1 = "Ouro"
w2 = "nova"
bbox1 = draw.textbbox((0, 0), w1, font=poppins_bold)
w1_width = bbox1[2] - bbox1[0]
text_y = cy - 130
draw.text((word_x, text_y), w1, font=poppins_bold, fill=(255, 255, 255))
draw.text((word_x + w1_width, text_y), w2, font=poppins_bold, fill=GOLD_LIGHT)

# --- Tagline ---
tagline = "Software built to outlast its launch day."
draw.text((word_x, text_y + 110), tagline, font=inter_reg, fill=MUTED)

# --- Footer strip ---
foot_font = font([
    "C:/Windows/Fonts/segoeui.ttf",
    "C:/Windows/Fonts/arial.ttf",
], 24)
draw.line([(80, H - 90), (W - 80, H - 90)], fill=(201, 162, 39, 60), width=1)
draw.text((80, H - 66), "NAIROBI · SOFTWARE · DATA · STRATEGY", font=foot_font, fill=GOLD)

img.save("C:/Users/LENOVO/Desktop/ouronova/assets/og-image.png", "PNG")
print("saved", img.size)
