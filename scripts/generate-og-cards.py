#!/usr/bin/env python3
"""Compose branded 1200×630 Open Graph cards for Teleforce Signal posts.

Matches public/og-default.png: ink field, amber LED, Archivo headlines,
IBM Plex Mono kicker, sage/amber equalizer on the right.
"""

from __future__ import annotations

import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "public" / "og" / "blog"
FONT_DIR = Path("/tmp/og-fonts")
FONTS = {
    "Archivo-Black.ttf": "https://cdn.jsdelivr.net/fontsource/fonts/archivo@5.2.5/latin-900-normal.ttf",
    "IBMPlexMono-Medium.ttf": "https://cdn.jsdelivr.net/fontsource/fonts/ibm-plex-mono@5.2.5/latin-500-normal.ttf",
}

INK = (14, 38, 41)  # --ink
AMBER = (242, 168, 43)  # --amber
SAGE = (138, 168, 155)  # --sage
SAGE_DEEP = (94, 125, 114)  # --sage-deep
CREAM = (236, 230, 214)  # --on-dark
MUTED = (157, 176, 171)  # --on-dark-mut

W, H = 1200, 630

# Unique 3-line angles — same cadence as the site-default OG card.
CARDS = [
    {
        "slug": "virtual-executive-assistant",
        "lines": ["Ownership.", "Not a ticket", "queue."],
        "colors": [CREAM, AMBER, SAGE],
        "kicker": "VIRTUAL EXECUTIVE ASSISTANT  ·  SIGNAL",
        "bars": [0.42, 0.78, 0.55, 0.92, 0.38, 0.70, 0.50, 0.62],
        "amber_bars": {1, 3, 5},
    },
    {
        "slug": "how-virtual-ea-frees-up-time",
        "lines": ["Time back.", "Not more", "chores."],
        "colors": [AMBER, CREAM, SAGE],
        "kicker": "HOW A VIRTUAL EA FREES UP TIME  ·  SIGNAL",
        "bars": [0.58, 0.36, 0.84, 0.48, 0.72, 0.40, 0.90, 0.52],
        "amber_bars": {0, 2, 6},
    },
    {
        "slug": "virtual-ea-vs-in-house",
        "lines": ["Build or buy.", "The room", "decides."],
        "colors": [CREAM, SAGE, AMBER],
        "kicker": "VIRTUAL EA VS IN-HOUSE  ·  SIGNAL",
        "bars": [0.70, 0.48, 0.38, 0.82, 0.56, 0.88, 0.44, 0.64],
        "amber_bars": {3, 5, 7},
    },
    {
        "slug": "nearshore-virtual-assistant",
        "lines": ["Same day.", "Same hours.", "Same language."],
        "colors": [CREAM, AMBER, SAGE],
        "kicker": "NEARSHORE VIRTUAL ASSISTANT  ·  SIGNAL",
        "bars": [0.50, 0.66, 0.40, 0.74, 0.92, 0.46, 0.60, 0.80],
        "amber_bars": {1, 4, 7},
    },
    {
        "slug": "first-30-days-virtual-ea",
        "lines": ["Week two.", "Not month", "six."],
        "colors": [AMBER, CREAM, SAGE],
        "kicker": "FIRST 30 DAYS WITH A VIRTUAL EA  ·  SIGNAL",
        "bars": [0.34, 0.58, 0.76, 0.44, 0.86, 0.52, 0.68, 0.40],
        "amber_bars": {2, 4},
    },
    {
        "slug": "virtual-ea-calendar-inbox",
        "lines": ["Inbox and", "calendar.", "One owner."],
        "colors": [CREAM, AMBER, SAGE],
        "kicker": "VIRTUAL EA CALENDAR AND INBOX  ·  SIGNAL",
        "bars": [0.62, 0.88, 0.46, 0.70, 0.36, 0.80, 0.54, 0.42],
        "amber_bars": {1, 3, 5},
    },
    {
        "slug": "virtual-ea-for-founders",
        "lines": ["Founder seat.", "Not the", "enterprise brief."],
        "colors": [CREAM, SAGE, AMBER],
        "kicker": "VIRTUAL EA FOR FOUNDERS  ·  SIGNAL",
        "bars": [0.80, 0.42, 0.64, 0.50, 0.90, 0.38, 0.72, 0.56],
        "amber_bars": {0, 4, 6},
    },
    {
        "slug": "bilingual-virtual-executive-assistant",
        "lines": ["Both languages.", "One owner.", "No plugin."],
        "colors": [AMBER, CREAM, SAGE],
        "kicker": "BILINGUAL VIRTUAL EXECUTIVE ASSISTANT  ·  SIGNAL",
        "bars": [0.46, 0.72, 0.90, 0.40, 0.64, 0.82, 0.50, 0.68],
        "amber_bars": {2, 5, 7},
    },
]


def ensure_fonts() -> None:
    FONT_DIR.mkdir(parents=True, exist_ok=True)
    for name, url in FONTS.items():
        dest = FONT_DIR / name
        if dest.exists() and dest.stat().st_size > 1000:
            continue
        urllib.request.urlretrieve(url, dest)


def load_font(name: str, size: int) -> ImageFont.FreeTypeFont:
    path = FONT_DIR / name
    return ImageFont.truetype(str(path), size)


def draw_tracked(draw: ImageDraw.ImageDraw, text: str, xy: tuple[int, int], font, fill, tracking: int) -> None:
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += font.getlength(ch) + tracking


def fit_headline(lines: list[str], max_width: int) -> tuple[ImageFont.FreeTypeFont, int]:
    for size in range(86, 55, -2):
        font = load_font("Archivo-Black.ttf", size)
        if all(font.getlength(line) <= max_width for line in lines):
            return font, int(size * 1.08)
    font = load_font("Archivo-Black.ttf", 56)
    return font, 62


def draw_bars(draw: ImageDraw.ImageDraw, heights: list[float], amber_idx: set[int]) -> None:
    n = len(heights)
    bar_w = 20
    gap = 13
    total = n * bar_w + (n - 1) * gap
    x0 = W - 56 - total
    y_mid = H // 2 + 8
    max_h = 340
    for i, frac in enumerate(heights):
        h = int(max_h * frac)
        x = x0 + i * (bar_w + gap)
        y = y_mid - h // 2
        color = AMBER if i in amber_idx else SAGE
        # Slightly deeper sage on even non-amber bars so the set reads as an EQ.
        if i not in amber_idx and i % 2 == 0:
            color = SAGE_DEEP
        draw.rounded_rectangle([x, y, x + bar_w, y + h], radius=6, fill=color)


def render(card: dict) -> Path:
    img = Image.new("RGB", (W, H), INK)
    draw = ImageDraw.Draw(img)

    draw_bars(draw, card["bars"], card["amber_bars"])

    # Brand lockup — amber LED + tracked TELEFORCE
    led_r = 7
    led_x, led_y = 80, 74
    draw.ellipse([led_x - led_r, led_y - led_r, led_x + led_r, led_y + led_r], fill=AMBER)
    brand_font = load_font("IBMPlexMono-Medium.ttf", 18)
    draw_tracked(draw, "TELEFORCE", (led_x + 22, led_y - 11), brand_font, CREAM, tracking=4)

    max_text_w = 640
    headline, line_h = fit_headline(card["lines"], max_text_w)
    y = 188
    for line, color in zip(card["lines"], card["colors"]):
        draw.text((80, y), line, font=headline, fill=color)
        y += line_h

    kicker_font = load_font("IBMPlexMono-Medium.ttf", 15)
    draw_tracked(draw, card["kicker"], (80, 548), kicker_font, MUTED, tracking=2)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    dest = OUT_DIR / f"{card['slug']}.jpg"
    img.save(dest, "JPEG", quality=86, optimize=True, progressive=True)
    return dest


def main() -> None:
    ensure_fonts()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for card in CARDS:
        dest = render(card)
        print(f"{card['slug']}: {dest.relative_to(ROOT)} ({dest.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
