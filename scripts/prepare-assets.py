"""Compress used images, build OG image, archive unused assets."""
from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
ARCHIVE = ROOT / "_archive"
RAW = ARCHIVE / "assets-raw"

USED = {
    "or-atmosphere.jpg",
    "viviane-cutout.png",
    "viviane-cutout.webp",
    "viviane-consultorio.jpg",
    "viviane-14.jpg",
    "viviane-retrato.jpg",
    "viviane-jaleco.jpg",
    "viviane-15.jpg",
    "viviane-16.jpg",
    "viviane-doppler.jpg",
    "viviane-procedimento.jpg",
    "viviane-21.jpg",
    "viviane-19.jpg",
    "logo.svg",
    "favicon.svg",
    "apple-touch-icon.svg",
    "og-image.jpg",
    "favicon-32.png",
    "favicon-180.png",
}


def archive_unused() -> None:
    RAW.mkdir(parents=True, exist_ok=True)
    for path in ASSETS.iterdir():
        if not path.is_file():
            continue
        if path.name in USED:
            continue
        dest = RAW / path.name
        if dest.exists():
            dest.unlink()
        path.rename(dest)
        print(f"archived {path.name}")


def compress_jpeg(path: Path, max_side: int = 1600, quality: int = 78) -> None:
    im = Image.open(path).convert("RGB")
    w, h = im.size
    scale = min(1.0, max_side / max(w, h))
    if scale < 1:
        im = im.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
    before = path.stat().st_size
    im.save(path, "JPEG", quality=quality, optimize=True, progressive=True)
    after = path.stat().st_size
    print(f"jpeg {path.name}: {before // 1024}KB -> {after // 1024}KB")


def compress_png(path: Path, max_side: int = 1400) -> None:
    im = Image.open(path)
    w, h = im.size
    scale = min(1.0, max_side / max(w, h))
    if scale < 1:
        im = im.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
    before = path.stat().st_size
    # Keep alpha; optimize PNG
    if im.mode not in ("RGBA", "LA"):
        im = im.convert("RGBA")
    im.save(path, "PNG", optimize=True, compress_level=9)
    after = path.stat().st_size
    print(f"png {path.name}: {before // 1024}KB -> {after // 1024}KB")


def build_og() -> None:
    w, h = 1200, 630
    canvas = Image.new("RGB", (w, h), "#0b3d32")
    draw = ImageDraw.Draw(canvas)

    # Gold accent bar
    draw.rectangle([0, 0, w, 12], fill="#f0db79")
    draw.rectangle([0, h - 12, w, h], fill="#f0db79")

    portrait_path = ASSETS / "viviane-retrato.jpg"
    if not portrait_path.exists():
        portrait_path = ASSETS / "viviane-19.jpg"
    if portrait_path.exists():
        photo = Image.open(portrait_path).convert("RGB")
        side = 480
        pw, ph = photo.size
        scale = max(side / pw, side / ph)
        photo = photo.resize((int(pw * scale), int(ph * scale)), Image.Resampling.LANCZOS)
        left = (photo.width - side) // 2
        top = (photo.height - side) // 2
        photo = photo.crop((left, top, left + side, top + side))
        mask = Image.new("L", (side, side), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, side - 1, side - 1], radius=28, fill=255)
        canvas.paste(photo, (80, (h - side) // 2), mask)

    try:
        font_title = ImageFont.truetype("C:/Windows/Fonts/georgia.ttf", 54)
        font_sub = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 28)
        font_small = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 22)
    except OSError:
        font_title = font_sub = font_small = ImageFont.load_default()

    x = 620
    draw.text((x, 170), "Dra. Viviane Verônica", fill="#f8f4dc", font=font_title)
    draw.text((x, 250), "Angiologia e Cirurgia Vascular", fill="#f0db79", font=font_sub)
    draw.text((x, 310), "Uberlândia · CRM/MG 48087 · RQE 28650", fill="#c8e0d6", font=font_small)
    draw.text((x, 380), "Pernas leves, bonitas e saudáveis.", fill="#ffffff", font=font_sub)

    out = ASSETS / "og-image.jpg"
    canvas.save(out, "JPEG", quality=85, optimize=True, progressive=True)
    print(f"og-image.jpg {out.stat().st_size // 1024}KB")


def build_favicons() -> None:
    # Raster fallbacks from SVG-like solid mark
    for size, name in ((32, "favicon-32.png"), (180, "favicon-180.png")):
        im = Image.new("RGBA", (size, size), (11, 61, 50, 255))
        draw = ImageDraw.Draw(im)
        try:
            font = ImageFont.truetype("C:/Windows/Fonts/georgia.ttf", int(size * 0.42))
        except OSError:
            font = ImageFont.load_default()
        text = "VV"
        bbox = draw.textbbox((0, 0), text, font=font)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        draw.text(((size - tw) / 2, (size - th) / 2 - size * 0.04), text, fill="#f0db79", font=font)
        im.save(ASSETS / name, "PNG", optimize=True)
        print(f"wrote {name}")


def main() -> None:
    ARCHIVE.mkdir(exist_ok=True)
    archive_unused()

    for name in list(USED):
        path = ASSETS / name
        if not path.exists():
            continue
        if path.suffix.lower() in {".jpg", ".jpeg"}:
            compress_jpeg(path, max_side=1400 if "retrato" in name else 1200)
        elif path.suffix.lower() == ".png" and name.startswith("viviane"):
            compress_png(path, max_side=1200 if "cutout" in name else 1000)

    build_og()
    build_favicons()


if __name__ == "__main__":
    main()
