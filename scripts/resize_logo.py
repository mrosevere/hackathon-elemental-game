#!/usr/bin/env python3
"""
Resize an image to a maximum width while preserving aspect ratio.
Usage: python resize_logo.py /absolute/path/to/logo.png --max-width 800 --quality 85
Creates a backup of the original at <name>.orig (if not present) before overwriting.
"""
import sys
import os
import argparse
from PIL import Image

def main():
    p = argparse.ArgumentParser()
    p.add_argument('input', help='Path to input image')
    p.add_argument('--max-width', type=int, default=800, help='Maximum width in pixels')
    p.add_argument('--quality', type=int, default=85, help='JPEG quality (ignored for PNG)')
    args = p.parse_args()

    inp = os.path.abspath(args.input)
    if not os.path.exists(inp):
        print('Input not found:', inp)
        sys.exit(2)

    dirname, fname = os.path.split(inp)
    name, ext = os.path.splitext(fname)
    backup = os.path.join(dirname, name + '.orig' + ext)

    # Make a backup if one doesn't already exist
    if not os.path.exists(backup):
        try:
            with open(inp, 'rb') as r, open(backup, 'wb') as w:
                w.write(r.read())
            print('Backup created:', backup)
        except Exception as e:
            print('Failed to create backup:', e)
            sys.exit(3)
    else:
        print('Backup already exists:', backup)

    try:
        img = Image.open(inp)
    except Exception as e:
        print('Failed to open image:', e)
        sys.exit(4)

    width, height = img.size
    max_w = args.max_width
    if width <= max_w:
        print('Image width <= max width; no resize needed ({}px).'.format(width))
        sys.exit(0)

    # Compute new size
    new_w = max_w
    new_h = int(round((new_w / width) * height))
    # Use Pillow's Resampling enum when available (Pillow >= 9.1 / 10), fallback for older versions
    resample_filter = getattr(Image, "Resampling", Image).LANCZOS
    img = img.resize((new_w, new_h), resample=resample_filter)

    out_path = inp
    ext_low = ext.lower()
    try:
        if ext_low in ('.jpg', '.jpeg'):
            img.save(out_path, quality=args.quality, optimize=True)
        elif ext_low == '.png':
            # Preserve transparency
            img.save(out_path, optimize=True)
        else:
            # For other formats, attempt a safe save
            img.save(out_path)
        print('Resized and saved:', out_path, '(', new_w, 'x', new_h, ')')
    except Exception as e:
        print('Failed to save resized image:', e)
        # attempt to restore backup
        try:
            with open(backup, 'rb') as r, open(inp, 'wb') as w:
                w.write(r.read())
            print('Restored original from backup')
        except Exception as e2:
            print('Failed to restore backup:', e2)
        sys.exit(5)

if __name__ == '__main__':
    main()
