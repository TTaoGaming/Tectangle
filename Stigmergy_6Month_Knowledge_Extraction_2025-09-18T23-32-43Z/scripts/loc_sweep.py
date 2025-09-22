from __future__ import annotations

import os
from collections import defaultdict
from datetime import datetime
from pathlib import Path

ROOT = Path(r"c:\Users\tommy\OneDrive\Desktop\Tectangle Archive v25.8.5")
INCLUDE_EXTS = {
    ".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx", ".html", ".htm",
    ".css", ".scss", ".sass", ".md", ".markdown", ".rst",
    ".py", ".json", ".yml", ".yaml", ".c", ".cpp", ".h", ".hpp", ".cs"
}
SKIP_PARTS = {
    "node_modules", ".git", "dist", "build", ".next", ".history",
    "__pycache__", "vendor", "cache", "VSCO-2-CE-master", "sound-files",
    "Samples", "sample-libraries", "assets", "archive", "storage"
}
MAX_BYTES = 1_000_000

per_ext_lines = defaultdict(int)
per_ext_files = defaultdict(int)
per_month_lines = defaultdict(int)

def should_skip(path: Path) -> bool:
    for part in path.parts:
        if part in SKIP_PARTS:
            return True
    return False

for dirpath, dirnames, filenames in os.walk(ROOT):
    current = Path(dirpath)
    if should_skip(current):
        dirnames[:] = []
        continue
    dirnames[:] = [d for d in dirnames if d not in {".git", "node_modules", "dist", "build", ".history"}]
    for filename in filenames:
        path = current / filename
        if should_skip(path):
            continue
        ext = path.suffix.lower()
        if ext not in INCLUDE_EXTS:
            continue
        try:
            size = path.stat().st_size
        except OSError:
            continue
        if size > MAX_BYTES:
            continue
        try:
            with path.open("r", encoding="utf-8", errors="ignore") as f:
                lines = sum(1 for _ in f)
        except OSError:
            continue
        if lines == 0:
            continue
        per_ext_lines[ext] += lines
        per_ext_files[ext] += 1
        month = datetime.utcfromtimestamp(path.stat().st_mtime).strftime("%Y-%m")
        per_month_lines[month] += lines

print("Total files counted:", sum(per_ext_files.values()))
print("\nLines by extension:")
for ext, lines in sorted(per_ext_lines.items(), key=lambda x: x[1], reverse=True):
    print(f"{ext:>6}: {lines:,} lines across {per_ext_files[ext]} files")

print("\nLines by month (UTC mtime):")
for month, lines in sorted(per_month_lines.items()):
    print(f"{month}: {lines:,} lines")

print("\nGrand total lines:", sum(per_ext_lines.values()))
