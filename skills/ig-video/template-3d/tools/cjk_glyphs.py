#!/usr/bin/env python3
"""
cjk_glyphs.py - draw Chinese characters as 12x12 block grids for the 3D signs.

The pixel font only knows Latin letters. Run this with every Chinese character
your signs and labels use, and it rewrites src/cjkglyphs.json.

Usage
  python3 tools/cjk_glyphs.py 汕头运动新鲜
  python3 tools/cjk_glyphs.py --from reel-zh.json

Needs Pillow and a Chinese font. WenQuanYi Zen Hei Sharp is ideal, because it
has a hand-drawn 12px bitmap: pass another with --font.
"""

import argparse
import json
import os

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "src", "cjkglyphs.json")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("chars", nargs="?", default="")
    ap.add_argument("--from", dest="src", help="a reel json: read every sign and label in it")
    ap.add_argument("--font", default="/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc")
    ap.add_argument("--index", type=int, default=1, help="face inside a .ttc; 1 is the Sharp bitmap face")
    args = ap.parse_args()

    text = args.chars
    if args.src:
        for b in json.load(open(args.src, encoding="utf-8"))["beats"]:
            text += b.get("sign", "") + "".join(b.get("labels", []))
    chars = sorted({c for c in text if "一" <= c <= "鿿"})
    if not chars:
        raise SystemExit("No Chinese characters given.")

    font = ImageFont.truetype(args.font, 12, index=args.index)
    glyphs = json.load(open(OUT, encoding="utf-8")) if os.path.exists(OUT) else {}
    for ch in chars:
        im = Image.new("1", (12, 12), 0)
        d = ImageDraw.Draw(im)
        d.fontmode = "1"
        d.text((0, -1), ch, font=font, fill=1)
        glyphs[ch] = ["".join("#" if im.getpixel((x, y)) else "." for x in range(12)) for y in range(12)]
    json.dump(glyphs, open(OUT, "w", encoding="utf-8"), ensure_ascii=False)
    print(f"{len(chars)} characters drawn into {OUT}: {''.join(chars)}")


if __name__ == "__main__":
    main()
