"""
Create lightweight WebP versions of all PNG/JPG files in hw/assets/hq.

Original files are left untouched. Existing WebP files are skipped by default.
WebP files are written to hw/assets, not hw/assets/hq.
The output is intended for worksheet cards, not full-resolution downloads.

Usage:
    python3 hw/create_hq_webp.py
    python3 hw/create_hq_webp.py --force
    python3 hw/create_hq_webp.py --max-width 1376 --quality 95
"""

from pathlib import Path
import argparse
import sys

try:
    from PIL import Image
except ImportError:
    print("Pillow is required. Install it with: pip install Pillow")
    sys.exit(1)


ASSETS_DIR = Path(__file__).resolve().parent / "assets"
HQ_DIR = ASSETS_DIR / "hq"
SOURCE_EXTENSIONS = {".png", ".jpg", ".jpeg"}
CUSTOM_CROPS = {
    "VL-MB2.jpg": (189, 107, 1221, 683),  # Zoom in on center motherboard
}


def convert_hq_images(force: bool = False, max_width: int = 1376, quality: int = 95) -> int:
    if not HQ_DIR.is_dir():
        print(f"Missing folder: {HQ_DIR}")
        return 1

    sources = sorted(
        path for path in HQ_DIR.iterdir()
        if path.is_file() and path.suffix.lower() in SOURCE_EXTENSIONS
    )

    if not sources:
        print(f"No PNG/JPG files found in {HQ_DIR}")
        return 0

    converted = 0
    skipped = 0
    failed = 0

    for source in sources:
        target = ASSETS_DIR / source.with_suffix(".webp").name
        if target.exists() and not force:
            print(f"SKIP {source.name} -> {target.name}")
            skipped += 1
            continue

        try:
            with Image.open(source) as image:
                if source.name in CUSTOM_CROPS:
                    image = image.crop(CUSTOM_CROPS[source.name])
                image = image.convert("RGBA")
                if image.width > max_width:
                    max_height = round(image.height * (max_width / image.width))
                    image.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)

                image.save(
                    target,
                    "WEBP",
                    lossless=False,
                    quality=quality,
                    alpha_quality=85,
                    method=4,
                )
            size_kb = target.stat().st_size / 1024
            print(f"OK   {source.name} -> {target.name} ({size_kb:.0f} KB)")
            converted += 1
        except Exception as exc:
            print(f"FAIL {source.name}: {exc}")
            failed += 1

    print(f"Done: {converted} converted, {skipped} skipped, {failed} failed.")
    return 1 if failed else 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true", help="Overwrite existing WebP files")
    parser.add_argument("--max-width", type=int, default=1376, help="Maximum output width in pixels")
    parser.add_argument("--quality", type=int, default=95, help="WebP quality, 1-100")
    args = parser.parse_args()
    return convert_hq_images(force=args.force, max_width=args.max_width, quality=args.quality)


if __name__ == "__main__":
    raise SystemExit(main())
