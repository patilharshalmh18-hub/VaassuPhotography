#!/usr/bin/env python3
"""Build script for Vassu's Photography.

1. Optimises every photo in src-images/ into responsive WebP sizes plus a JPEG
   fallback in assets/img/ (skips files that are already up to date).
2. Renders the portfolio gallery and the home-page strip from scripts/photos.json
   into the HTML pages, between <!-- name:start --> / <!-- name:end --> markers.

Usage:  python3 scripts/build.py          (needs Pillow: pip install Pillow)
"""
from __future__ import annotations

import html
import json
import re
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src-images"
OUT = ROOT / "assets" / "img"
PHOTOS = json.loads((ROOT / "scripts" / "photos.json").read_text())

WIDTHS = (480, 960, 1600)          # gallery + lightbox
HERO_WIDTHS = (800, 1400, 2400)    # hero images
JPEG_FALLBACK = 960
SITE_URL = "https://vassus-photography.vercel.app"  # change when the domain is live

CATEGORY_LABEL = {
    "maternity": "Maternity",
    "newborn": "Newborn",
    "family": "Family",
    "kids": "Kids & pets",
}

# Home-page "recent moments" strip
STRIP = ["p8", "p17", "p52", "p42", "p19", "p24", "p46", "p13", "p49", "p27", "p43", "p5", "p37", "p25"]


def save_variants(src: Path, widths: tuple[int, ...]) -> tuple[int, int]:
    im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
    w0, h0 = im.size
    stem = src.stem
    for w in widths:
        w = min(w, w0)
        target = OUT / f"{stem}-{w}.webp"
        if not target.exists() or target.stat().st_mtime < src.stat().st_mtime:
            im.resize((w, round(h0 * w / w0)), Image.LANCZOS).save(
                target, "WEBP", quality=80, method=6
            )
    fb = min(JPEG_FALLBACK, w0)
    jpg = OUT / f"{stem}-{fb}.jpg"
    if not jpg.exists() or jpg.stat().st_mtime < src.stat().st_mtime:
        im.resize((fb, round(h0 * fb / w0)), Image.LANCZOS).save(
            jpg, "JPEG", quality=80, optimize=True, progressive=True
        )
    return w0, h0


def srcset(stem: str, w0: int, widths: tuple[int, ...]) -> str:
    sizes = sorted({min(w, w0) for w in widths})
    return ", ".join(f"assets/img/{stem}-{w}.webp {w}w" for w in sizes)


def picture(stem: str, size: tuple[int, int], alt: str, sizes: str,
            widths=WIDTHS, cls: str = "", lazy: bool = True) -> str:
    w0, h0 = size
    fb = min(JPEG_FALLBACK, w0)
    loading = ' loading="lazy" decoding="async"' if lazy else ' fetchpriority="high"'
    cls_attr = f' class="{cls}"' if cls else ""
    return (
        f'<picture><source type="image/webp" srcset="{srcset(stem, w0, widths)}" sizes="{sizes}">'
        f'<img{cls_attr} src="assets/img/{stem}-{fb}.jpg" width="{w0}" height="{h0}" '
        f'alt="{html.escape(alt)}"{loading}></picture>'
    )


def inject(page: str, name: str, content: str) -> None:
    path = ROOT / page
    text = path.read_text()
    pattern = re.compile(rf"(<!-- {name}:start -->)(.*?)(<!-- {name}:end -->)", re.S)
    if not pattern.search(text):
        raise SystemExit(f"Marker '{name}' not found in {page}")
    text = pattern.sub(lambda m: f"{m.group(1)}\n{content}\n{m.group(3)}", text)
    path.write_text(text)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    sizes: dict[str, tuple[int, int]] = {}
    for p in PHOTOS:
        sizes[p["id"]] = save_variants(SRC / f"{p['id']}.jpg", WIDTHS)
    for hero in ("hero57", "hero20"):
        save_variants(SRC / f"{hero}.jpg", HERO_WIDTHS)

    # Open Graph image (1200x630)
    og = OUT / "og-image.jpg"
    if not og.exists():
        im = Image.open(SRC / "hero57.jpg").convert("RGB")
        ImageOps.fit(im, (1200, 630), Image.LANCZOS, centering=(0.4, 0.4)).save(
            og, "JPEG", quality=82, optimize=True
        )

    # Portfolio gallery
    items = []
    for i, p in enumerate(PHOTOS):
        full = f"assets/img/{p['id']}-{min(1600, sizes[p['id']][0])}.webp"
        items.append(
            f'<figure class="shot" data-cat="{p["cat"]}">'
            f'<a href="{full}" data-index="{i}" aria-label="View larger: {html.escape(p["alt"])}">'
            + picture(p["id"], sizes[p["id"]], p["alt"],
                      "(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 400px")
            + "</a></figure>"
        )
    inject("portfolio.html", "gallery", "\n".join(items))

    # Home strip
    by_id = {p["id"]: p for p in PHOTOS}
    strip = []
    for sid in STRIP:
        p = by_id[sid]
        strip.append(
            f'<a class="strip-item" href="portfolio.html#{p["cat"]}">'
            + picture(sid, sizes[sid], p["alt"], "(max-width: 760px) 55vw, 320px")
            + "</a>"
        )
    inject("index.html", "strip", "\n".join(strip))

    # Sitemap
    pages = ["", "portfolio.html", "about.html", "packages.html", "contact.html"]
    urls = "\n".join(f"  <url><loc>{SITE_URL}/{p}</loc></url>" for p in pages)
    (ROOT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"{urls}\n</urlset>\n"
    )
    print(f"Built {len(PHOTOS)} photos -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
