from pathlib import Path
import os
from collections import defaultdict
from datetime import datetime

root = Path(r"c:\Users\tommy\OneDrive\Desktop\Tectangle Archive v25.8.5\Tectangle code backups")
include={'.js','.ts','.tsx','.html','.md','.json','.css'}
skip={'.git','node_modules','dist','build','.history','VSCO-2-CE-master','sound-files','Samples','sample-libraries','archive','storage'}
max_bytes=500_000
by_sub=defaultdict(int)
by_sub_files=defaultdict(int)
per_month=defaultdict(int)
for dirpath, dirnames, filenames in os.walk(root):
    path=Path(dirpath)
    if any(part in skip for part in path.parts):
        dirnames[:] = []
        continue
    for filename in filenames:
        fpath=path/filename
        if any(part in skip for part in fpath.parts):
            continue
        ext=fpath.suffix.lower()
        if ext not in include:
            continue
        try:
            stat=fpath.stat()
        except OSError:
            continue
        if stat.st_size>max_bytes:
            continue
        try:
            with fpath.open('r',encoding='utf-8',errors='ignore') as f:
                lines=sum(1 for _ in f)
        except OSError:
            continue
        if lines==0:
            continue
        rel=fpath.relative_to(root)
        sub=rel.parts[0]
        by_sub[sub]+=lines
        by_sub_files[sub]+=1
        month=datetime.utcfromtimestamp(stat.st_mtime).strftime('%Y-%m')
        per_month[month]+=lines
print('Tectangle code backups LOC summary:')
for sub,lines in sorted(by_sub.items(), key=lambda x: x[1], reverse=True):
    print(f"{sub:20} {lines:>10,} lines across {by_sub_files[sub]} files")
print('\nMonthly activity:')
for month,lines in sorted(per_month.items()):
    print(f"{month}: {lines:,}")
print('\nGrand total lines:', sum(by_sub.values()))
