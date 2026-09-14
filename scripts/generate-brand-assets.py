#!/usr/bin/env python3
"""Generate Viorp brand assets (icons, favicons, splash screens) from public/logo.svg.

Usage: python3 scripts/generate-brand-assets.py
Requires: cairosvg, pillow
"""
from __future__ import annotations

import io
from pathlib import Path

import cairosvg
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
LOGO = ROOT / "public" / "logo.svg"
ICONS = ROOT / "public" / "icons"
ASSETS = ROOT / "assets"
DEEP_AURORA = (10, 15, 30, 255)
OFF_WHITE = (240, 255, 251, 255)


def render(size: int) -> Image.Image:
    png = cairosvg.svg2png(url=str(LOGO), output_width=size, output_height=size)
    return Image.open(io.BytesIO(png)).convert("RGBA")


def on_background(mark: Image.Image, size: int, bg: tuple[int, int, int, int], scale: float) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), bg)
    inner = int(size * scale)
    resized = mark.resize((inner, inner), Image.LANCZOS)
    offset = (size - inner) // 2
    canvas.alpha_composite(resized, (offset, offset))
    return canvas


def main() -> None:
    ICONS.mkdir(parents=True, exist_ok=True)
    ASSETS.mkdir(parents=True, exist_ok=True)

    master = render(1024)

    # Source art for @capacitor/assets
    master.save(ASSETS / "icon-only.png")
    on_background(master, 1024, (0, 0, 0, 0), 0.62).save(ASSETS / "icon-foreground.png")
    Image.new("RGBA", (1024, 1024), DEEP_AURORA).save(ASSETS / "icon-background.png")

    # PWA / web icons on the brand background
    for size in (72, 96, 128, 144, 152, 180, 192, 384, 512):
        on_background(master, size, DEEP_AURORA, 0.72).save(ICONS / f"icon-{size}x{size}.png")
    on_background(master, 180, DEEP_AURORA, 0.72).save(ROOT / "public" / "apple-touch-icon.png")

    # Favicons
    favicon = on_background(master, 256, DEEP_AURORA, 0.78)
    favicon.save(
        ROOT / "public" / "favicon.ico",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )
    favicon.resize((32, 32), Image.LANCZOS).save(ROOT / "public" / "favicon-32x32.png")
    favicon.resize((16, 16), Image.LANCZOS).save(ROOT / "public" / "favicon-16x16.png")

    # Splash screens (2732x2732 keeps every device crop inside the safe area)
    on_background(master, 2732, DEEP_AURORA, 0.22).save(ASSETS / "splash-dark.png")
    on_background(master, 2732, OFF_WHITE, 0.22).save(ASSETS / "splash.png")

    print(f"generated icons in {ICONS} and source art in {ASSETS}")


if __name__ == "__main__":
    main()
