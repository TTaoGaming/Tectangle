from pathlib import Path

ROOT = Path(r"c:\Users\tommy\OneDrive\Desktop\Tectangle Archive v25.8.5")
SKIP = {'.git','node_modules','dist','build','.history','VSCO-2-CE-master','sound-files','Samples','sample-libraries','archive','storage'}
parents = set()
for path in ROOT.rglob('package.json'):
    if any(part in SKIP for part in path.parts):
        continue
    parents.add(str(path.parent.relative_to(ROOT)))

print('package.json parent directories:', len(parents))
for p in sorted(parents)[:40]:
    print(p)
