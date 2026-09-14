import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

def create_sample_leaf(kind: str, filepath: str):
    os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)
    width, height = 400, 400
    img = Image.new("RGB", (width, height), (245, 247, 245))
    draw = ImageDraw.Draw(img)

    # Base leaf shape (oval with tapered tip)
    center_x, center_y = 200, 210
    
    # Generate background botanical grid/leaf surface
    arr = np.ones((height, width, 3), dtype=np.uint8) * 245
    
    # Fill mask
    y_coords, x_coords = np.ogrid[:height, :width]
    # Elliptical leaf equation with taper
    normalized_y = (y_coords - center_y) / 140.0
    normalized_x = (x_coords - center_x) / (85.0 * (1.1 - 0.5 * normalized_y))
    leaf_mask = (normalized_x**2 + normalized_y**2) <= 1.0

    if kind == "healthy":
        base_color = np.array([46, 125, 50], dtype=np.float32) # deep rich forest green
        noise = np.random.normal(0, 8, (height, width, 3))
        leaf_pixels = np.clip(base_color + noise, 0, 255).astype(np.uint8)
        arr[leaf_mask] = leaf_pixels[leaf_mask]
        leaf_img = Image.fromarray(arr)
        draw = ImageDraw.Draw(leaf_img)
        # Main central vein
        draw.line([(200, 75), (200, 345)], fill=(120, 180, 100), width=4)
        # Side veins
        for vy in range(110, 320, 30):
            draw.line([(200, vy), (140, vy - 25)], fill=(110, 170, 95), width=2)
            draw.line([(200, vy), (260, vy - 25)], fill=(110, 170, 95), width=2)

    elif kind == "early_blight_mild":
        base_color = np.array([76, 145, 65], dtype=np.float32) # slightly paler green
        noise = np.random.normal(0, 10, (height, width, 3))
        leaf_pixels = np.clip(base_color + noise, 0, 255).astype(np.uint8)
        arr[leaf_mask] = leaf_pixels[leaf_mask]
        leaf_img = Image.fromarray(arr)
        draw = ImageDraw.Draw(leaf_img)
        # Central vein
        draw.line([(200, 75), (200, 345)], fill=(130, 185, 110), width=4)
        for vy in range(110, 320, 30):
            draw.line([(200, vy), (140, vy - 25)], fill=(120, 175, 100), width=2)
            draw.line([(200, vy), (260, vy - 25)], fill=(120, 175, 100), width=2)
        # Concentric ring target spots (early blight Alternaria) on lower right
        # Halo ring 1
        draw.ellipse([(215, 230), (265, 280)], fill=(185, 160, 50), outline=(130, 95, 30), width=2)
        draw.ellipse([(225, 240), (255, 270)], fill=(105, 68, 28), outline=(60, 38, 15), width=2)
        draw.ellipse([(235, 250), (245, 260)], fill=(45, 25, 10))
        # Small satellite spot
        draw.ellipse([(160, 180), (185, 205)], fill=(175, 150, 40), outline=(115, 75, 25), width=1)
        draw.ellipse([(168, 188), (177, 197)], fill=(85, 50, 20))

    elif kind == "late_blight_severe":
        base_color = np.array([60, 95, 55], dtype=np.float32)
        noise = np.random.normal(0, 12, (height, width, 3))
        leaf_pixels = np.clip(base_color + noise, 0, 255).astype(np.uint8)
        arr[leaf_mask] = leaf_pixels[leaf_mask]
        leaf_img = Image.fromarray(arr)
        draw = ImageDraw.Draw(leaf_img)
        draw.line([(200, 75), (200, 345)], fill=(90, 130, 80), width=4)
        # Massive necrotized dark water-soaked patch (late blight Phytophthora)
        draw.ellipse([(150, 140), (280, 270)], fill=(48, 42, 38), outline=(90, 85, 60), width=3)
        draw.ellipse([(130, 220), (220, 310)], fill=(38, 32, 28), outline=(75, 70, 50), width=2)
        # Spore border (pale greyish fuzz ring)
        draw.ellipse([(145, 135), (285, 275)], outline=(170, 175, 165), width=2)

    elif kind == "septoria":
        base_color = np.array([70, 135, 60], dtype=np.float32)
        noise = np.random.normal(0, 10, (height, width, 3))
        leaf_pixels = np.clip(base_color + noise, 0, 255).astype(np.uint8)
        arr[leaf_mask] = leaf_pixels[leaf_mask]
        leaf_img = Image.fromarray(arr)
        draw = ImageDraw.Draw(leaf_img)
        draw.line([(200, 75), (200, 345)], fill=(125, 180, 105), width=4)
        # Many small punctate spots with chlorotic halo
        spot_coords = [(170, 140), (230, 160), (160, 210), (240, 220), (190, 260), (220, 280), (150, 270)]
        for sx, sy in spot_coords:
            draw.ellipse([(sx-12, sy-12), (sx+12, sy+12)], fill=(195, 185, 70))
            draw.ellipse([(sx-7, sy-7), (sx+7, sy+7)], fill=(120, 95, 75), outline=(50, 30, 20), width=1)
            draw.ellipse([(sx-3, sy-3), (sx+3, sy+3)], fill=(210, 210, 210))

    # Gentle blur to make organic and natural
    leaf_img = leaf_img.filter(ImageFilter.SMOOTH_MORE)
    leaf_img.save(filepath, "JPEG", quality=95)
    print(f"Generated {filepath}")

create_sample_leaf("healthy", "data/sample/healthy_leaf.jpg")
create_sample_leaf("early_blight_mild", "data/sample/early_blight_mild.jpg")
create_sample_leaf("late_blight_severe", "data/sample/late_blight_severe.jpg")
create_sample_leaf("septoria", "data/sample/septoria_leaf_spot.jpg")
