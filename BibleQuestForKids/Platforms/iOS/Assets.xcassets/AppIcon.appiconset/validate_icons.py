#!/usr/bin/env python3
"""Validate the AppIcon asset catalog and related Info.plist settings."""
from __future__ import annotations

import json
import plistlib
import struct
import sys
from pathlib import Path

ICONSET_DIR = Path(__file__).resolve().parent
INFO_PLIST_PATH = ICONSET_DIR.parent.parent / "Info.plist"
REQUIRED_FILES = {"Icon-40@3x.png", "Icon-60@2x.png", "Icon-1024.png"}
EXPECTED_DIMENSIONS = {
    "Icon-40@3x.png": (120, 120),
    "Icon-60@2x.png": (120, 120),
    "Icon-1024.png": (1024, 1024),
}
FORBIDDEN_COLOR_TYPES = {4, 6}  # These represent PNG formats that include alpha channels.
EXPECTED_ICONSET_NAME = "AppIcon"
EXPECTED_XS_ASSET_PATH = "Assets.xcassets/AppIcon.appiconset"


def load_contents(iconset: Path) -> dict:
    contents_path = iconset / "Contents.json"
    if not contents_path.exists():
        raise SystemExit(f"Missing {contents_path}")
    return json.loads(contents_path.read_text())


def ensure_required_pngs(filenames: set[str]) -> None:
    missing = sorted(REQUIRED_FILES - filenames)
    if missing:
        raise SystemExit("Missing required icon files: " + ", ".join(missing))


def ensure_base64_sources(iconset: Path, filenames: set[str]) -> None:
    expected_sources = {f"{name.rsplit('.', 1)[0]}.base64" for name in filenames}
    missing_sources = sorted(src for src in expected_sources if not (iconset / src).exists())
    if missing_sources:
        raise SystemExit("Missing base64 icon sources: " + ", ".join(missing_sources))


def png_header(path: Path) -> tuple[int, int, int]:
    with path.open("rb") as png:
        if png.read(8) != b"\x89PNG\r\n\x1a\n":
            raise SystemExit(f"{path.name} is not a valid PNG signature")
        length = struct.unpack(">I", png.read(4))[0]
        chunk_type = png.read(4)
        if chunk_type != b"IHDR":
            raise SystemExit(f"{path.name} missing IHDR header")
        if length != 13:
            raise SystemExit(f"{path.name} IHDR chunk has unexpected length {length}")
        width, height, bit_depth, color_type, compression, filter_method, interlace = struct.unpack(
            ">IIBBBBB", png.read(13)
        )
        return width, height, color_type


def ensure_dimensions_and_color(iconset: Path) -> None:
    for filename, (expected_w, expected_h) in EXPECTED_DIMENSIONS.items():
        image_path = iconset / filename
        if not image_path.exists():
            raise SystemExit(
                f"{filename} missing from disk even though Contents.json references it"
            )
        width, height, color_type = png_header(image_path)
        if (width, height) != (expected_w, expected_h):
            raise SystemExit(
                f"{filename} should be {expected_w}x{expected_h}, found {width}x{height}"
            )
        if color_type in FORBIDDEN_COLOR_TYPES:
            raise SystemExit(
                f"{filename} includes an alpha channel (PNG color type {color_type}). "
                "Marketing icons must be fully opaque."
            )


def ensure_info_plist_settings(info_plist: Path) -> None:
    with info_plist.open("rb") as plist_file:
        plist = plistlib.load(plist_file)

    icon_name = plist.get("CFBundleIconName")
    if icon_name != EXPECTED_ICONSET_NAME:
        raise SystemExit(
            f"CFBundleIconName should be '{EXPECTED_ICONSET_NAME}', found {icon_name!r}"
        )

    def extract_icon_name(root_key: str) -> str | None:
        value = plist.get(root_key)
        if isinstance(value, dict):
            primary = value.get("CFBundlePrimaryIcon")
            if isinstance(primary, dict):
                candidate = primary.get("CFBundleIconName")
                if isinstance(candidate, str):
                    return candidate
        return None

    for scope in ("CFBundleIcons", "CFBundleIcons~ipad"):
        scoped_name = extract_icon_name(scope)
        if scoped_name != EXPECTED_ICONSET_NAME:
            raise SystemExit(
                f"{scope}/CFBundlePrimaryIcon/CFBundleIconName should be "
                f"'{EXPECTED_ICONSET_NAME}', found {scoped_name!r}"
            )

    xs_assets = plist.get("XSAppIconAssets")
    if xs_assets != EXPECTED_XS_ASSET_PATH:
        raise SystemExit(
            f"XSAppIconAssets should be '{EXPECTED_XS_ASSET_PATH}', found {xs_assets!r}"
        )


def validate_iconset(iconset: Path) -> None:
    if not iconset.is_dir():
        raise SystemExit(f"Missing {iconset}")

    contents = load_contents(iconset)
    filenames = {
        image.get("filename")
        for image in contents.get("images", [])
        if image.get("filename")
    }

    ensure_required_pngs(filenames)
    ensure_base64_sources(iconset, filenames)
    ensure_dimensions_and_color(iconset)
    ensure_info_plist_settings(INFO_PLIST_PATH)


def main(argv: list[str]) -> int:
    iconset = Path(argv[1]).resolve() if len(argv) > 1 else ICONSET_DIR
    validate_iconset(iconset)
    print("iOS icon catalog validated.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
