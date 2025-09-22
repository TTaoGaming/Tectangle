import subprocess
from pathlib import Path
from collections import defaultdict

ROOT = Path(r"c:\Users\tommy\OneDrive\Desktop\Tectangle Archive v25.8.5")
REPOS = {
    "handsfree": ROOT / "handsfree" / "handsfree",
    "Tectangle-Drumpad-ReplitV04292025": ROOT / "Tectangle Project folder" / "Tectangle-Drumpad-ReplitV04292025",
    "TAGS-MVP-Modular-Monolith-backup": ROOT / "Spatial Anchor MPE v25.7.10" / "TAGS-MVP-Modular-Monolith-backup"
}
SINCE = "2025-01-01"
INCLUDE_EXTS = {'.js', '.ts', '.tsx', '.jsx', '.html', '.md', '.json', '.css', '.py'}
SKIP_PATH_PARTS = {'node_modules', 'dist', 'build', '.history', 'Sound Files', 'sound-files', 'Samples', 'sample-libraries', 'VCSL-1.2.2-RC'}

summary = {}

for name, path in REPOS.items():
    if not (path / ".git").exists():
        continue
    repo = {"path": str(path.relative_to(ROOT))}
    try:
        repo["commits_total"] = int(subprocess.check_output(["git", "-C", str(path), "rev-list", "--count", "HEAD"], text=True).strip())
        repo["commits_since"] = int(subprocess.check_output(["git", "-C", str(path), "rev-list", "--count", f"--since={SINCE}", "HEAD"], text=True).strip())
        repo["first_commit"] = subprocess.check_output(["git", "-C", str(path), "log", "--reverse", "--format=%ad", "--date=short", "HEAD"], text=True).splitlines()[0]
        repo["last_commit"] = subprocess.check_output(["git", "-C", str(path), "log", "-1", "--format=%ad", "--date=short", "HEAD"], text=True).strip()

        def parse_numstat(args):
            output = subprocess.check_output(["git", "-C", str(path), "log", "--pretty=%H", "--numstat", *args], text=True)
            lines = output.splitlines()
            total_added = total_removed = 0
            commit = None
            for line in lines:
                if len(line) == 40 and all(c in '0123456789abcdef' for c in line):
                    commit = line
                    continue
                parts = line.split('\t')
                if len(parts) != 3:
                    continue
                a, b, filepath = parts
                if filepath == '' or filepath.startswith('..'):
                    continue
                if any(part in SKIP_PATH_PARTS for part in Path(filepath).parts):
                    continue
                ext = Path(filepath).suffix.lower()
                if ext not in INCLUDE_EXTS:
                    continue
                try:
                    added = int(a)
                    removed = int(b)
                except ValueError:
                    continue
                total_added += added
                total_removed += removed
            return total_added, total_removed

        repo["lines_added_total"], repo["lines_removed_total"] = parse_numstat([])
        repo["lines_added_since"], repo["lines_removed_since"] = parse_numstat([f"--since={SINCE}"])

        summary[name] = repo
    except subprocess.CalledProcessError:
        continue

print(summary)
