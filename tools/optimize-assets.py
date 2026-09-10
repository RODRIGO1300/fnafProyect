#!/usr/bin/env python3
"""
Convierte a WebP todos los PNG bajo assets/ y borra el PNG original.
Los fondos opacos van a calidad 84; los sprites con transparencia a 88.

Uso:
    python tools/optimize-assets.py            # convierte y borra los .png
    python tools/optimize-assets.py --keep     # conserva los .png
    python tools/optimize-assets.py --dry-run  # sólo informa

Requiere Pillow:  pip install pillow
"""
import argparse
import glob
import os
import sys

try:
    from PIL import Image
except ImportError:
    sys.exit("Falta Pillow:  pip install pillow")

Q_OPAQUE = 84
Q_ALPHA = 88


def has_real_alpha(im):
    if im.mode not in ("RGBA", "LA", "P"):
        return False
    return im.convert("RGBA").getchannel("A").getextrema()[0] < 255


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--keep", action="store_true", help="no borra los .png")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--root", default="assets")
    args = ap.parse_args()

    before = after = 0
    for png in glob.glob(os.path.join(args.root, "**", "*.png"), recursive=True):
        im = Image.open(png)
        out = os.path.splitext(png)[0] + ".webp"
        b = os.path.getsize(png)
        before += b
        if args.dry_run:
            print(f"  {png}  ({b/1024:.0f} KB)")
            continue
        if has_real_alpha(im):
            im.convert("RGBA").save(out, "WEBP", quality=Q_ALPHA, method=6)
        else:
            im.convert("RGB").save(out, "WEBP", quality=Q_OPAQUE, method=6)
        a = os.path.getsize(out)
        after += a
        if not args.keep:
            os.remove(png)
        print(f"  {a/1024:6.0f} KB ({a/b*100:3.0f}%)  {out}")

    if not args.dry_run and before:
        print(f"\nTOTAL: {before/1048576:.1f} MB -> {after/1048576:.1f} MB "
              f"({after/before*100:.0f}%)")


if __name__ == "__main__":
    main()
