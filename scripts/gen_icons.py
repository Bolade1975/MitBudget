from PIL import Image, ImageDraw, ImageFont

BG = (31, 111, 92, 255)  # matches --color-accent light theme
WHITE = (255, 255, 255, 255)


def draw_badge(size, corner_radius, padding_ratio=0.0):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    pad = int(size * padding_ratio)
    draw.rounded_rectangle(
        [pad, pad, size - 1 - pad, size - 1 - pad], radius=corner_radius, fill=BG
    )

    # "kr" wordmark, hand-drawn with the default font, no icon library.
    label = "kr"
    font_size = int(size * 0.42)
    try:
        font = ImageFont.truetype("arialbd.ttf", font_size)
    except OSError:
        font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), label, font=font)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(
        (size / 2 - w / 2 - bbox[0], size / 2 - h / 2 - bbox[1]),
        label,
        fill=WHITE,
        font=font,
    )
    return img


# Standard icons (rounded square, small padding so the glyph doesn't touch edges)
draw_badge(192, 40).save("public/icons/icon-192.png")
draw_badge(512, 108).save("public/icons/icon-512.png")

# Maskable icon needs extra safe-zone padding (Android may crop to a circle)
draw_badge(512, 0, padding_ratio=0.1).save("public/icons/icon-512-maskable.png")

# Apple touch icon: iOS applies its own corner rounding, so keep this square/no radius
draw_badge(180, 0).save("public/apple-touch-icon.png")
