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
    "Samples", "sample-libraries", "assets", "archive", "storage",
    "sample", "media", "Audio", "audio"
}
MAX_BYTES = 1_000_000

by_root_lines: defaultdict[str, int] = defaultdict(int)
by_root_files: defaultdict[str, int] = defaultdict(int)
per_month_lines: defaultdict[str, int] = defaultdict(int)
per_ext_lines: defaultdict[str, int] = defaultdict(int)

for dirpath, dirnames, filenames in os.walk(ROOT):
    current = Path(dirpath)
    if any(part in SKIP_PARTS for part in current.parts):
        dirnames[:] = []
        continue
    dirnames[:] = [d for d in dirnames if d not in {".git", "node_modules", "dist", "build", ".history"}]
    for filename in filenames:
        path = current / filename
        if any(part in SKIP_PARTS for part in path.parts):
            continue
        ext = path.suffix.lower()
        if ext not in INCLUDE_EXTS:
            continue
        try:
            stat = path.stat()
        except OSError:
            continue
        if stat.st_size > MAX_BYTES:
            continue
        try:
            with path.open("r", encoding="utf-8", errors="ignore") as f:
                lines = sum(1 for _ in f)
        except OSError:
            continue
        if lines == 0:
            continue
        rel = path.relative_to(ROOT)
        root = rel.parts[0] if rel.parts else str(ROOT.name)
        by_root_lines[root] += lines
        by_root_files[root] += 1
        per_ext_lines[ext] += lines
        month = datetime.utcfromtimestamp(stat.st_mtime).strftime("%Y-%m")
        per_month_lines[month] += lines

print("Lines by top-level root (text/code files under 1MB):")
for root, lines in sorted(by_root_lines.items(), key=lambda x: x[1], reverse=True):
    print(f"{root:35} {lines:>12,} lines across {by_root_files[root]} files")

print("\nLines by month (UTC mtime):")
for month, lines in sorted(per_month_lines.items()):
    print(f"{month}: {lines:,}")

print("\nLines by extension:")
for ext, lines in sorted(per_ext_lines.items(), key=lambda x: x[1], reverse=True):
    print(f"{ext:>6}: {lines:,}")

print("\nGrand total lines:", sum(per_ext_lines.values()))
