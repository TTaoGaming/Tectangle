from pathlib import Path
import os
from collections import defaultdict

root = Path(r"c:\Users\tommy\OneDrive\Desktop\Tectangle Archive v25.8.5\hope-ai")
include={'.js','.ts','.tsx','.md','.json','.yml','.yaml','.html','.mjs'}
skip={'.git','node_modules','dist','build','.history'}
per=defaultdict(int)
count=defaultdict(int)
for dirpath, dirnames, filenames in os.walk(root):
    path=Path(dirpath)
    if any(part in skip for part in path.parts):
        dirnames[:] = []
        continue
    for name in filenames:
        fpath=path/name
        if any(part in skip for part in fpath.parts):
            continue
        ext=fpath.suffix.lower()
        if ext not in include:
            continue
        try:
            with fpath.open('r',encoding='utf-8',errors='ignore') as f:
                lines=sum(1 for _ in f)
        except OSError:
            continue
        if lines==0:
            continue
        rel=fpath.relative_to(root)
        top=rel.parts[0] if rel.parts else str(fpath.name)
        per[top]+=lines
        count[top]+=1
print('hope-ai LOC by subdir:')
for key,val in sorted(per.items(), key=lambda x: x[1], reverse=True):
    print(f"{key:15} {val:6d} lines across {count[key]} files")
print('Total', sum(per.values()))
