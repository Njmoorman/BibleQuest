#!/usr/bin/env python3
"""Decode base64-encoded AppIcon PNGs into the asset catalog.

This script keeps the repository text-only so Codemagic/Base44 can apply
changes while still producing the PNGs App Store Connect requires. Run it
before building locally or in CI. It overwrites any existing PNG outputs.
"""
from __future__ import annotations

import base64
import sys
from pathlib import Path

ICONSET_DIR = Path(__file__).resolve().parent


def decode_base64_file(encoded_path: Path) -> None:
    target = encoded_path.with_suffix(".png")
    raw_text = encoded_path.read_text()
    # Strip whitespace that the `base64` CLI inserts every 76 characters so
    # developers can store the assets in source control as text files.
    compact = "".join(raw_text.split())
    try:
        png_bytes = base64.b64decode(compact, validate=True)
    except (base64.binascii.Error, ValueError) as exc:  # pragma: no cover - safety guard
        raise SystemExit(f"{encoded_path.name} is not valid base64: {exc}") from exc
    target.write_bytes(png_bytes)
    print(f"Wrote {target.name} ({len(png_bytes)} bytes)")


def main() -> int:
    encoded_files = sorted(ICONSET_DIR.glob("*.base64"))
    if not encoded_files:
        print("No .base64 icon sources found; nothing to do.")
        return 0

    for encoded in encoded_files:
        decode_base64_file(encoded)

    return 0


if __name__ == "__main__":
    sys.exit(main())
