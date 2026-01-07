#!/usr/bin/env python3
"""
Whitespace-only cleanup script
- Trims trailing spaces
- Replaces sequences of 2+ blank lines with a single blank line
- Ensures file ends with a single newline
Targets: .html, .css, .js, .md files under the repo root
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXTS = {'.html', '.css', '.js', '.md'}

changed = []
for p in sorted(ROOT.rglob('*')):
    if p.suffix.lower() in EXTS and p.is_file():
        try:
            text = p.read_text(encoding='utf-8')
        except Exception:
            try:
                # Try BOM‑aware UTF-8
                text = p.read_text(encoding='utf-8-sig')
            except Exception:
                # Skip files that aren't valid UTF-8 to avoid accidental corruption
                print('Skipping (non-utf8):', str(p.relative_to(ROOT)))
                continue
        original = text
        # Normalize line endings to \n
        text = text.replace('\r\n', '\n').replace('\r', '\n')
        # Trim trailing spaces on each line
        lines = [ln.rstrip() for ln in text.split('\n')]
        # Collapse multiple blank lines to a single blank line
        out_lines = []
        blank_run = 0
        for ln in lines:
            if ln.strip() == '':
                blank_run += 1
            else:
                blank_run = 0
            if blank_run <= 1:
                out_lines.append(ln)
        # Ensure single newline at EOF
        new_text = '\n'.join(out_lines).rstrip() + '\n'
        if new_text != original:
            p.write_text(new_text, encoding='utf-8')
            changed.append(str(p.relative_to(ROOT)))

print('Cleaned files:')
for c in changed:
    print('-', c)
if not changed:
    print('(no changes)')
