from __future__ import annotations

from pathlib import Path
from typing import Callable

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "store-assets" / "app-store" / "ios-6.7-iphone17-bg"
CONTACT_SHEET = OUT_DIR / "contact-sheet.png"
W, H = 1290, 2796

BLACK = (9, 7, 11, 255)
SURFACE = (18, 16, 21, 255)
CARD = (24, 20, 28, 255)
EDITORIAL = (244, 231, 211, 255)
CHAMPAGNE = (242, 222, 193, 255)
ROSE_GOLD = (207, 144, 121, 255)
BRONZE = (140, 91, 70, 255)
PINK = CHAMPAGNE
PINK_2 = ROSE_GOLD
WHITE = (255, 248, 240, 255)
MUTED = (201, 189, 173, 255)

ICON = ROOT / "assets" / "icon.png"
APP_BACKGROUND = ROOT / "assets" / "photo-generated" / "app-background-v4.png"
IPHONE_MOCKUP = ROOT / "store-assets" / "app-store" / "mockups" / "iphone-17-pro-max-silver-portrait.png"
IPHONE_SCREEN_BBOX = (75, 66, 1395, 2934)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        "/System/Library/Fonts/SFNS.ttf",
        "/System/Library/Fonts/HelveticaNeue.ttc",
        "/System/Library/Fonts/Avenir Next.ttc",
    ]
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size=size, index=1 if bold else 0)
        except Exception:
            continue
    return ImageFont.load_default()


F_HEAD = font(66, True)
F_HEAD_SMALL = font(58, True)
F_START_LOGO = font(102, True)
F_START_TAG = font(54, True)
F_START_COUNT = font(62, True)
F_LOGO = font(44, True)
F_UI = font(34, True)
F_UI_SMALL = font(25, True)
F_BUTTON = font(32, True)
F_BODY = font(28)
F_TINY = font(21, True)


def asset(path: str) -> Path:
    return ROOT / path


def cover(path: Path, size: tuple[int, int], focus: tuple[float, float] = (0.5, 0.5)) -> Image.Image:
    image = Image.open(path).convert("RGB")
    iw, ih = image.size
    tw, th = size
    scale = max(tw / iw, th / ih)
    nw, nh = round(iw * scale), round(ih * scale)
    image = image.resize((nw, nh), Image.Resampling.LANCZOS)
    fx, fy = focus
    left = int((nw - tw) * fx)
    top = int((nh - th) * fy)
    left = max(0, min(left, nw - tw))
    top = max(0, min(top, nh - th))
    return image.crop((left, top, left + tw, top + th))


def contain(path: Path, size: tuple[int, int], bg: tuple[int, int, int] = (0, 0, 0)) -> Image.Image:
    image = Image.open(path).convert("RGB")
    image.thumbnail(size, Image.Resampling.LANCZOS)
    out = Image.new("RGB", size, bg)
    out.paste(image, ((size[0] - image.width) // 2, (size[1] - image.height) // 2))
    return out


def mask(size: tuple[int, int], radius: int) -> Image.Image:
    out = Image.new("L", size, 0)
    d = ImageDraw.Draw(out)
    d.rounded_rectangle((0, 0, size[0], size[1]), radius=radius, fill=255)
    return out


def paste_round(
    base: Image.Image,
    image: Image.Image,
    xy: tuple[int, int],
    radius: int,
    outline: tuple[int, int, int, int] | None = None,
    shadow: bool = False,
) -> None:
    image = image.convert("RGBA")
    if shadow:
        layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
        d = ImageDraw.Draw(layer)
        x, y = xy
        d.rounded_rectangle(
            (x + 12, y + 20, x + image.width + 12, y + image.height + 20),
            radius=radius,
            fill=(0, 0, 0, 170),
        )
        base.alpha_composite(layer.filter(ImageFilter.GaussianBlur(24)))
    base.paste(image, xy, mask(image.size, radius))
    if outline:
        x, y = xy
        d = ImageDraw.Draw(base)
        d.rounded_rectangle(
            (x, y, x + image.width, y + image.height),
            radius=radius,
            outline=outline,
            width=4,
        )


def draw_center(draw: ImageDraw.ImageDraw, text: str, y: int, fnt: ImageFont.FreeTypeFont, fill=PINK, max_w=1120, gap=8) -> int:
    lines: list[str] = []
    for raw in text.split("\n"):
        words = raw.split()
        line = ""
        for word in words:
            candidate = word if not line else f"{line} {word}"
            if draw.textbbox((0, 0), candidate, font=fnt)[2] <= max_w:
                line = candidate
            else:
                if line:
                    lines.append(line)
                line = word
        if line:
            lines.append(line)
    for line in lines:
        box = draw.textbbox((0, 0), line, font=fnt)
        draw.text(((W - (box[2] - box[0])) // 2, y), line, font=fnt, fill=fill)
        y += box[3] - box[1] + gap
    return y


def draw_bottom_headline(draw: ImageDraw.ImageDraw, text: str) -> None:
    lines = text.split("\n")
    total_h = len(lines) * 72
    y = H - 120 - total_h
    for line in lines:
        box = draw.textbbox((0, 0), line, font=F_HEAD)
        draw.text(((W - (box[2] - box[0])) // 2, y), line, font=F_HEAD, fill=PINK)
        y += 76


def gradient_button(size: tuple[int, int]) -> Image.Image:
    w, h = size
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for x in range(w):
        t = x / max(1, w - 1)
        if t < 0.5:
            u = t / 0.5
            start = (242, 218, 184)
            end = (216, 159, 134)
        else:
            u = (t - 0.5) / 0.5
            start = (216, 159, 134)
            end = (184, 107, 108)
        r = int(start[0] * (1 - u) + end[0] * u)
        g = int(start[1] * (1 - u) + end[1] * u)
        b = int(start[2] * (1 - u) + end[2] * u)
        d.line((x, 0, x, h), fill=(r, g, b, 255))
    rounded = Image.new("RGBA", size, (0, 0, 0, 0))
    rounded.paste(img, (0, 0), mask(size, h // 2))
    return rounded


def phone_canvas(size: tuple[int, int]) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    phone = Image.new("RGBA", size, BLACK)
    d = ImageDraw.Draw(phone)
    return phone, d


def paste_iphone_mockup(base: Image.Image, screen: Image.Image, screen_xy: tuple[int, int], shadow: bool = True) -> None:
    mockup = Image.open(IPHONE_MOCKUP).convert("RGBA")
    sx0, sy0, sx1, sy1 = IPHONE_SCREEN_BBOX
    screen_w = sx1 - sx0
    screen_h = sy1 - sy0
    scale = screen.width / screen_w
    mockup_size = (round(mockup.width * scale), round(mockup.height * scale))
    screen_box = (
        round(sx0 * scale),
        round(sy0 * scale),
        round(sx1 * scale),
        round(sy1 * scale),
    )
    mockup = mockup.resize(mockup_size, Image.Resampling.LANCZOS)
    target_screen_size = (screen_box[2] - screen_box[0], screen_box[3] - screen_box[1])
    screen = screen.resize(target_screen_size, Image.Resampling.LANCZOS).convert("RGBA")

    device = Image.new("RGBA", mockup_size, (0, 0, 0, 0))
    screen_mask = Image.new("L", mockup_size, 0)
    md = ImageDraw.Draw(screen_mask)
    md.rounded_rectangle(screen_box, radius=round(96 * scale), fill=255)
    device.paste(screen, screen_box[:2], screen_mask.crop(screen_box))

    outer_xy = (screen_xy[0] - screen_box[0], screen_xy[1] - screen_box[1])
    if shadow:
        shadow_layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
        shadow_alpha = mockup.getchannel("A").filter(ImageFilter.GaussianBlur(round(32 * scale)))
        shadow_img = Image.new("RGBA", mockup_size, (0, 0, 0, 145))
        shadow_layer.paste(shadow_img, (outer_xy[0] + round(14 * scale), outer_xy[1] + round(22 * scale)), shadow_alpha)
        base.alpha_composite(shadow_layer)
    base.alpha_composite(device, outer_xy)
    base.alpha_composite(mockup, outer_xy)


def nav_bar(phone: Image.Image, draw: ImageDraw.ImageDraw, credits: str = "1000") -> None:
    draw.rounded_rectangle((58, 54, 190, 108), radius=27, fill=(18, 16, 21, 230), outline=(255, 230, 204, 46), width=2)
    draw.text((86, 69), credits, font=F_TINY, fill=MUTED)
    draw.text((phone.width // 2 - 68, 50), "Studio", font=F_LOGO, fill=PINK)
    for i, cx in enumerate([phone.width - 160, phone.width - 92]):
        draw.ellipse((cx - 25, 54, cx + 25, 104), fill=(24, 20, 28, 235), outline=(255, 230, 204, 46), width=2)
        if i == 0:
            draw.ellipse((cx - 6, 69, cx + 6, 81), fill=CHAMPAGNE)
            draw.line((cx, 83, cx, 95), fill=CHAMPAGNE, width=3)
        else:
            draw.ellipse((cx - 7, 68, cx + 7, 82), fill=CHAMPAGNE)
            draw.arc((cx - 15, 80, cx + 15, 102), 200, 340, fill=CHAMPAGNE, width=3)


def add_cta(phone: Image.Image, y: int, text: str = "Generate") -> None:
    btn = gradient_button((phone.width - 110, 78))
    phone.alpha_composite(btn, (55, y))
    d = ImageDraw.Draw(phone)
    box = d.textbbox((0, 0), text, font=F_BUTTON)
    d.text(((phone.width - (box[2] - box[0])) // 2, y + 20), text, font=F_BUTTON, fill=(24, 18, 24, 255))


def add_photo_bubble(phone: Image.Image, xy: tuple[int, int], label: str = "ADD YOUR\nPHOTO") -> None:
    d = ImageDraw.Draw(phone)
    x, y = xy
    d.ellipse((x, y, x + 150, y + 150), fill=(24, 20, 28, 210), outline=(255, 230, 204, 38), width=2)
    for idx, line in enumerate(label.split("\n")):
        box = d.textbbox((0, 0), line, font=F_TINY)
        d.text((x + (150 - (box[2] - box[0])) // 2, y + 45 + idx * 25), line, font=F_TINY, fill=EDITORIAL)


def app_background() -> Image.Image:
    bg = cover(APP_BACKGROUND, (W, H), (0.52, 0.48)).convert("RGBA")
    tint = Image.new("RGBA", (W, H), (9, 7, 11, 96))
    bg.alpha_composite(tint)
    return bg


def new_canvas() -> Image.Image:
    return app_background()


def photo_session_card(path: Path, size: tuple[int, int]) -> Image.Image:
    card = Image.new("RGBA", size, (0, 0, 0, 0))
    image = Image.open(path).convert("RGBA")
    image.thumbnail(size, Image.Resampling.LANCZOS)
    card.alpha_composite(image, ((size[0] - image.width) // 2, (size[1] - image.height) // 2))
    return card


def shadowed_center(
    draw: ImageDraw.ImageDraw,
    text: str,
    y: int,
    fnt: ImageFont.FreeTypeFont,
    fill: tuple[int, int, int, int] = WHITE,
    shadow: tuple[int, int, int, int] = (0, 0, 0, 155),
    max_w: int = 1120,
    gap: int = 8,
) -> int:
    lines: list[str] = []
    for raw in text.split("\n"):
        words = raw.split()
        line = ""
        for word in words:
            candidate = word if not line else f"{line} {word}"
            if draw.textbbox((0, 0), candidate, font=fnt)[2] <= max_w:
                line = candidate
            else:
                if line:
                    lines.append(line)
                line = word
        if line:
            lines.append(line)
    for line in lines:
        box = draw.textbbox((0, 0), line, font=fnt)
        x = (W - (box[2] - box[0])) // 2
        draw.text((x + 3, y + 5), line, font=fnt, fill=shadow)
        draw.text((x, y), line, font=fnt, fill=fill)
        y += box[3] - box[1] + gap
    return y


def transparent_logo(size: int) -> Image.Image:
    logo = Image.open(ICON).convert("RGBA").resize((size, size), Image.Resampling.LANCZOS)
    pixels = logo.load()
    for y in range(logo.height):
        for x in range(logo.width):
            r, g, b, a = pixels[x, y]
            if r < 24 and g < 24 and b < 24:
                pixels[x, y] = (r, g, b, 0)
            else:
                pixels[x, y] = (r, g, b, a)
    return logo


def shot_start() -> Image.Image:
    c = cover(asset("assets/photo-generated/headshot-cover.png"), (W, H), (0.52, 0.44)).convert("RGBA")

    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    for y in range(H):
        top = max(0, 520 - y) / 520
        bottom = max(0, y - (H - 520)) / 520
        alpha = int(100 * top + 185 * bottom)
        if alpha:
            od.line((0, y, W, y), fill=(0, 0, 0, min(alpha, 205)))
    c.alpha_composite(overlay)

    d = ImageDraw.Draw(c)
    logo = transparent_logo(126)
    title = "StudioBloom"
    title_box = d.textbbox((0, 0), title, font=F_START_LOGO)
    title_w = title_box[2] - title_box[0]
    lockup_gap = 28
    lockup_w = logo.width + lockup_gap + title_w
    lockup_x = (W - lockup_w) // 2
    lockup_y = 158
    logo_shadow = Image.new("RGBA", logo.size, (0, 0, 0, 0))
    logo_shadow.putalpha(logo.getchannel("A"))
    logo_shadow = logo_shadow.filter(ImageFilter.GaussianBlur(7))
    c.alpha_composite(logo_shadow, (lockup_x + 3, lockup_y + 5))
    c.alpha_composite(logo, (lockup_x, lockup_y))
    text_x = lockup_x + logo.width + lockup_gap
    text_y = lockup_y + 12
    d.text((text_x + 3, text_y + 5), title, font=F_START_LOGO, fill=(0, 0, 0, 155))
    d.text((text_x, text_y), title, font=F_START_LOGO, fill=EDITORIAL)
    shadowed_center(d, "AI PORTRAITS & VIDEOS", H - 326, F_START_COUNT, EDITORIAL, max_w=1100)
    return c


def shot_classic() -> Image.Image:
    c = new_canvas()
    d = ImageDraw.Draw(c)
    draw_center(d, "PROFESSIONAL HEADSHOTS", 176, F_HEAD_SMALL)
    phone, pd = phone_canvas((980, 2090))
    nav_bar(phone, pd, "100")
    pd.text((70, 214), "Headshot Studio", font=F_UI, fill=EDITORIAL)
    pd.text((70, 272), "6 photos", font=F_BODY, fill=MUTED)
    paths = [
        "assets/photo-generated/headshot-cover.png",
        "assets/photo-generated/single-founder-headshot-cover.png",
        "assets/photo-generated/single-linkedin-polish-cover.png",
        "assets/photo-generated/single-warm-author-portrait-cover.png",
        "assets/photo-generated/single-ceo-glow-cover.png",
        "assets/photo-generated/single-creative-director-cover.png",
    ]
    cell_w, cell_h = 322, 430
    for idx, p in enumerate(paths):
        x = 114 + (idx % 2) * 430
        y = 348 + (idx // 2) * 470
        paste_round(phone, photo_session_card(asset(p), (cell_w, cell_h)), (x, y), 28)
    add_cta(phone, 1776, "Generate 6 Photos")
    paste_iphone_mockup(c, phone, (155, 520), shadow=True)
    return c


def shot_trendy() -> Image.Image:
    c = new_canvas()
    d = ImageDraw.Draw(c)
    phone, pd = phone_canvas((900, 1840))
    nav_bar(phone, pd)
    hero = cover(asset("assets/photo-generated/single-warm-author-portrait-cover.png"), (780, 1300), (0.5, 0.42))
    paste_round(phone, hero, (60, 170), 28)
    add_photo_bubble(phone, (phone.width // 2 - 75, 1290))
    add_cta(phone, 1608)
    paste_iphone_mockup(c, phone, (195, 145), shadow=True)
    draw_bottom_headline(d, "EDITORIAL PHOTO PACKS")
    return c


def shot_pet() -> Image.Image:
    c = new_canvas()
    d = ImageDraw.Draw(c)
    phone, pd = phone_canvas((940, 1900))
    nav_bar(phone, pd)
    img = cover(asset("assets/video-previews/animal-poodle-fashion-walk.jpg"), (820, 1330), (0.5, 0.45)).convert("RGBA")
    paste_round(phone, img, (60, 180), 28)
    add_photo_bubble(phone, (phone.width // 2 - 75, 1320), "ADD YOUR\nPET")
    add_cta(phone, 1648)
    paste_iphone_mockup(c, phone, (175, 320), shadow=True)
    draw_bottom_headline(d, "PET PORTRAITS")
    return c


def shot_dance() -> Image.Image:
    c = new_canvas()
    d = ImageDraw.Draw(c)
    draw_center(d, "PRODUCT VISUALS", 176, F_HEAD_SMALL)
    phone, pd = phone_canvas((980, 2090))
    nav_bar(phone, pd)
    hero = cover(asset("assets/photo-packs/pack-product-adshot/01.jpg"), (850, 1240), (0.5, 0.45)).convert("RGBA")
    paste_round(phone, hero, (65, 210), 24)
    pd.ellipse((phone.width // 2 - 82, 750, phone.width // 2 + 82, 914), fill=(242, 222, 193, 224))
    pd.polygon([(phone.width // 2 - 22, 792), (phone.width // 2 - 22, 872), (phone.width // 2 + 50, 832)], fill=ROSE_GOLD)
    pd.rounded_rectangle((105, 1388, 235, 1456), radius=18, fill=(242, 222, 193, 238))
    pd.text((124, 1406), "00:02", font=F_UI_SMALL, fill=(36, 25, 19, 255))
    strip_y = 1520
    pd.rounded_rectangle((40, strip_y - 22, phone.width - 40, strip_y + 212), radius=26, fill=(244, 231, 211, 245))
    for idx, name in enumerate(["product-hologram-scan.jpg", "product-water-pulse.jpg", "product-neon-sign-logo.jpg", "product-blue-splash.jpg"]):
        thumb = cover(asset(f"assets/video-previews/{name}"), (165, 190))
        paste_round(phone, thumb, (105 + idx * 182, strip_y), 12)
    paste_iphone_mockup(c, phone, (155, 520), shadow=True)
    return c


def shot_product() -> Image.Image:
    c = new_canvas()
    d = ImageDraw.Draw(c)
    draw_center(d, "CINEMATIC MOTION", 130, F_HEAD_SMALL)
    phone, pd = phone_canvas((940, 1900))
    nav_bar(phone, pd)
    hero = cover(asset("assets/video-previews/travel-old-town-walk.jpg"), (820, 1320), (0.5, 0.42)).convert("RGBA")
    paste_round(phone, hero, (60, 215), 24)
    pd.ellipse((phone.width // 2 - 82, 760, phone.width // 2 + 82, 924), fill=(242, 222, 193, 224))
    pd.polygon([(phone.width // 2 - 22, 802), (phone.width // 2 - 22, 882), (phone.width // 2 + 50, 842)], fill=ROSE_GOLD)
    add_photo_bubble(phone, (phone.width // 2 - 75, 1324), "ADD YOUR\nPHOTO")
    add_cta(phone, 1648)
    paste_iphone_mockup(c, phone, (175, 620), shadow=True)
    return c


def shot_realistic() -> Image.Image:
    c = new_canvas()
    d = ImageDraw.Draw(c)
    draw_center(d, "CREATIVE CONTROLS", 124, F_HEAD_SMALL)
    phone, pd = phone_canvas((940, 1900))
    img = cover(asset("assets/photo-generated/single-linkedin-polish-cover.png"), (860, 1510), (0.5, 0.4)).convert("RGBA")
    paste_round(phone, img, (40, 100), 56)
    add_photo_bubble(phone, (phone.width - 250, 1422))
    add_cta(phone, 1670)
    paste_iphone_mockup(c, phone, (175, 620), shadow=True)
    return c


def build_contact_sheet(paths: list[Path]) -> None:
    thumbs = []
    for path in paths:
        im = Image.open(path).convert("RGB")
        im.thumbnail((215, 466), Image.Resampling.LANCZOS)
        thumbs.append((path.name, im.copy()))
    sheet = Image.new("RGB", (215 * len(thumbs), 530), (17, 15, 18))
    d = ImageDraw.Draw(sheet)
    for idx, (name, im) in enumerate(thumbs):
        x = idx * 215
        sheet.paste(im, (x, 0))
        d.text((x + 6, 486), name, font=font(14), fill=(245, 235, 240))
    CONTACT_SHEET.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(CONTACT_SHEET, quality=95)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for old in OUT_DIR.glob("*.png"):
        old.unlink()
    shots: list[tuple[str, Callable[[], Image.Image]]] = [
        ("01-start-screen.png", shot_start),
        ("02-glamour-style-with-ai.png", shot_classic),
        ("03-trendy-effects.png", shot_trendy),
        ("04-cute-pet-photos.png", shot_pet),
        ("05-viral-ai-dance-video.png", shot_dance),
        ("06-place-logo-product.png", shot_product),
        ("07-realistic-photo-shoots.png", shot_realistic),
    ]
    paths = []
    for name, draw_shot in shots:
        out = OUT_DIR / name
        draw_shot().convert("RGB").save(out, quality=96)
        paths.append(out)
    build_contact_sheet(paths)
    print(f"Wrote {len(paths)} screenshots to {OUT_DIR}")


if __name__ == "__main__":
    main()
