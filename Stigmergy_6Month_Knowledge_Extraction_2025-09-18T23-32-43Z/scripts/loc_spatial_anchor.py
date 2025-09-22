from pathlib import Path
import os
from collections import defaultdict
from datetime import datetime

root = Path(r"c:\Users\tommy\OneDrive\Desktop\Tectangle Archive v25.8.5\Spatial Anchor MPE v25.7.10")
INCLUDE = {'.js','.ts','.tsx','.html','.md','.json','.css','.mjs'}
SKIP = {'.git','node_modules','dist','build','.history','VSCO-2-CE-master','sound-files','Samples','sample-libraries','archive','storage'}
MAX_BYTES = 1_000_000

by_subroot = defaultdict(int)
by_subroot_files = defaultdict(int)
per_month = defaultdict(int)

for dirpath, dirnames, filenames in os.walk(root):
    path = Path(dirpath)
    if any(part in SKIP for part in path.parts):
        dirnames[:] = []
        continue
    dirnames[:] = [d for d in dirnames if d not in {'.git','node_modules','dist','build','.history'}]
    for filename in filenames:
        fpath = path / filename
        if any(part in SKIP for part in fpath.parts):
            continue
        ext = fpath.suffix.lower()
        if ext not in INCLUDE:
            continue
        try:
            stat = fpath.stat()
        except OSError:
            continue
        if stat.st_size > MAX_BYTES:
            continue
        try:
            with fpath.open('r', encoding='utf-8', errors='ignore') as f:
                lines = sum(1 for _ in f)
        except OSError:
            continue
        if lines == 0:
            continue
        rel = fpath.relative_to(root)
        subroot = rel.parts[0] if rel.parts else str(fpath.name)
        by_subroot[subroot] += lines
        by_subroot_files[subroot] += 1
        month = datetime.utcfromtimestamp(stat.st_mtime).strftime('%Y-%m')
        per_month[month] += lines

print('Spatial Anchor MPE v25.7.10 line totals:')
print('-----------------------------------------')
for subroot, lines in sorted(by_subroot.items(), key=lambda x: x[1], reverse=True):
    print(f"{subroot:35} {lines:>10,} lines across {by_subroot_files[subroot]} files")
print('\nMonthly activity (UTC mtime):')
for month, lines in sorted(per_month.items()):
    print(f"{month}: {lines:,}")
print('\nGrand total lines:', sum(by_subroot.values()))
