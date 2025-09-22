from pathlib import Path

ROOT = Path(r"c:\Users\tommy\OneDrive\Desktop\Tectangle Archive v25.8.5")
SKIP = {'.git','node_modules','dist','build','.next','.history','VSCO-2-CE-master','sound-files','Samples','sample-libraries','assets','archive','storage'}
MAX_BYTES = 1_500_000
results = []
for path in ROOT.rglob('index*'):
    if path.suffix.lower() not in {'.html','.htm','.js','.ts','.tsx'}:
        continue
    if any(part in SKIP for part in path.parts):
        continue
    try:
        stat = path.stat()
    except OSError:
        continue
    if stat.st_size > MAX_BYTES:
        continue
    try:
        with path.open('r', encoding='utf-8', errors='ignore') as f:
            lines = sum(1 for _ in f)
    except OSError:
        continue
    if lines < 1000:
        continue
    results.append((lines, str(path.relative_to(ROOT))))

results.sort(reverse=True)
for lines, rel in results[:30]:
    print(f"{lines:7d} {rel}")
