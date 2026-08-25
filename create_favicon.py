import os
from PIL import Image, ImageDraw, ImageFont

SIZE = 256
CORNER_RADIUS = 50

# Create base image
img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Colors for gradient
color1 = (37, 99, 235)  # #2563eb
color2 = (29, 78, 216)  # #1d4ed8

# Draw 135deg gradient
for y in range(SIZE):
    for x in range(SIZE):
        t = (x + y) / (2 * SIZE)
        r = int(color1[0] + (color2[0] - color1[0]) * t)
        g = int(color1[1] + (color2[1] - color1[1]) * t)
        b = int(color1[2] + (color2[2] - color1[2]) * t)
        draw.point((x, y), fill=(r, g, b, 255))

# Create a mask for rounded corners
mask = Image.new('L', (SIZE, SIZE), 0)
mask_draw = ImageDraw.Draw(mask)

# Fallback rounded rectangle drawing if PIL is too old for rounded_rectangle
try:
    mask_draw.rounded_rectangle((0, 0, SIZE, SIZE), radius=CORNER_RADIUS, fill=255)
except AttributeError:
    # Manual rounded rectangle
    mask_draw.rectangle((CORNER_RADIUS, 0, SIZE-CORNER_RADIUS, SIZE), fill=255)
    mask_draw.rectangle((0, CORNER_RADIUS, SIZE, SIZE-CORNER_RADIUS), fill=255)
    mask_draw.pieslice((0, 0, CORNER_RADIUS*2, CORNER_RADIUS*2), 180, 270, fill=255)
    mask_draw.pieslice((SIZE-CORNER_RADIUS*2, 0, SIZE, CORNER_RADIUS*2), 270, 360, fill=255)
    mask_draw.pieslice((0, SIZE-CORNER_RADIUS*2, CORNER_RADIUS*2, SIZE), 90, 180, fill=255)
    mask_draw.pieslice((SIZE-CORNER_RADIUS*2, SIZE-CORNER_RADIUS*2, SIZE, SIZE), 0, 90, fill=255)

# Apply mask
img.putalpha(mask)

# Try to load a nice bold font
try:
    font = ImageFont.truetype("segoeuib.ttf", int(SIZE * 0.55))
except:
    try:
        font = ImageFont.truetype("arialbd.ttf", int(SIZE * 0.55))
    except:
        font = ImageFont.load_default()

text = "IB"
# Center text
try:
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    text_x = (SIZE - text_w) / 2 - bbox[0]
    text_y = (SIZE - text_h) / 2 - bbox[1]
except AttributeError:
    # Older PIL fallback
    text_w, text_h = draw.textsize(text, font=font)
    text_x = (SIZE - text_w) / 2
    text_y = (SIZE - text_h) / 2 - int(SIZE * 0.05) # slight vertical tweak

draw.text((text_x, text_y), text, font=font, fill=(255, 255, 255, 255))

img.save('favicon.png')
img.save('favicon.ico', sizes=[(256, 256), (128, 128), (64, 64), (32, 32), (16, 16)])
print("Beautiful IB favicon generated!")
