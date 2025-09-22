from pathlib import Path
import os

root = Path(r"c:\Users\tommy\OneDrive\Desktop\Tectangle Archive v25.8.5\Tectangle code backups")
skip = {'.git','node_modules','dist','build','.history','VSCO-2-CE-master','sound-files','Samples','sample-libraries','archive','storage'}
include={'.js','.ts','.tsx','.html','.md','.json','.css'}
results=[]
for path in root.rglob('*'):
    if path.is_file() and path.suffix.lower() in include:
        if any(part in skip for part in path.parts):
            continue
        try:
            stat = path.stat()
        except OSError:
            continue
        if stat.st_size > 500_000:
            continue
        try:
            with path.open('r', encoding='utf-8', errors='ignore') as f:
                lines = sum(1 for _ in f)
        except OSError:
            continue
        if lines > 1000:
            results.append((lines, str(path.relative_to(root))))
results.sort(reverse=True)
for lines, rel in results[:20]:
    print(f"{lines:6d} {rel}")
