#!/usr/bin/env python3
"""Archive roll-up generator.

Scans a target root directory (default: three levels above this script) and
produces:
  * metrics/directory_inventory.csv   - top-level directory metadata
  * metrics/git_repos.csv             - health snapshot of embedded git repos
  * rollups/archive_overview.md       - human-friendly summary table

Outputs live alongside the script inside the Stigmergy hub so they can be
tracked and versioned with other extraction artefacts.
"""
from __future__ import annotations

import argparse
import csv
import os
import subprocess
import sys
from collections import Counter
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple

# File-type buckets for quick signal on knowledge density.
MARKDOWN_EXTS = {".md", ".markdown"}
TEXT_EXTS = {".txt", ".md", ".markdown", ".rst"}
CODE_JS_EXTS = {".js", ".jsx", ".mjs", ".cjs"}
CODE_TS_EXTS = {".ts", ".tsx"}
CODE_PY_EXTS = {".py"}
CODE_OTHER_EXTS = {".java", ".c", ".cpp", ".h", ".hpp", ".cs"}
HTML_EXTS = {".html", ".htm"}


@dataclass
class DirSummary:
    name: str
    type: str  # "directory" or "file"
    size_bytes: int
    file_count: int
    markdown_count: int
    text_count: int
    js_count: int
    ts_count: int
    py_count: int
    other_code_count: int
    html_count: int
    latest_mtime: Optional[float]

    @property
    def size_gb(self) -> float:
        return self.size_bytes / (1024 ** 3)

    @property
    def size_mb(self) -> float:
        return self.size_bytes / (1024 ** 2)

    @property
    def latest_iso(self) -> str:
        if self.latest_mtime is None:
            return ""
        return datetime.utcfromtimestamp(self.latest_mtime).isoformat() + "Z"


def iter_files(directory: Path) -> Iterable[Path]:
    for root, _, files in os.walk(directory):
        root_path = Path(root)
        for filename in files:
            yield root_path / filename


def summarise_directory(path: Path) -> DirSummary:
    size = 0
    file_count = 0
    counts = Counter()
    latest_mtime: Optional[float] = None

    for file_path in iter_files(path):
        try:
            stat = file_path.stat()
        except (FileNotFoundError, PermissionError, OSError):
            continue
        file_count += 1
        size += stat.st_size
        ext = file_path.suffix.lower()
        if ext in MARKDOWN_EXTS:
            counts["markdown"] += 1
        if ext in TEXT_EXTS:
            counts["text"] += 1
        if ext in CODE_JS_EXTS:
            counts["js"] += 1
        if ext in CODE_TS_EXTS:
            counts["ts"] += 1
        if ext in CODE_PY_EXTS:
            counts["py"] += 1
        if ext in CODE_OTHER_EXTS:
            counts["other_code"] += 1
        if ext in HTML_EXTS:
            counts["html"] += 1
        if latest_mtime is None or stat.st_mtime > latest_mtime:
            latest_mtime = stat.st_mtime

    return DirSummary(
        name=path.name,
        type="directory",
        size_bytes=size,
        file_count=file_count,
        markdown_count=counts["markdown"],
        text_count=counts["text"],
        js_count=counts["js"],
        ts_count=counts["ts"],
        py_count=counts["py"],
        other_code_count=counts["other_code"],
        html_count=counts["html"],
        latest_mtime=latest_mtime,
    )


def summarise_file(path: Path) -> DirSummary:
    try:
        stat = path.stat()
    except (FileNotFoundError, PermissionError, OSError):
        stat = None
    size = stat.st_size if stat else 0
    ext = path.suffix.lower()
    markdown = 1 if ext in MARKDOWN_EXTS else 0
    text = 1 if ext in TEXT_EXTS else 0
    js = 1 if ext in CODE_JS_EXTS else 0
    ts = 1 if ext in CODE_TS_EXTS else 0
    py = 1 if ext in CODE_PY_EXTS else 0
    other_code = 1 if ext in CODE_OTHER_EXTS else 0
    html = 1 if ext in HTML_EXTS else 0
    mtime = stat.st_mtime if stat else None
    return DirSummary(
        name=path.name,
        type="file",
        size_bytes=size,
        file_count=1,
        markdown_count=markdown,
        text_count=text,
        js_count=js,
        ts_count=ts,
        py_count=py,
        other_code_count=other_code,
        html_count=html,
        latest_mtime=mtime,
    )


def find_git_dirs(root: Path) -> List[Path]:
    git_dirs: List[Path] = []
    for path, dirnames, _ in os.walk(root):
        if ".git" in dirnames:
            git_dirs.append(Path(path) / ".git")
            dirnames.remove(".git")
    return git_dirs


def git_summary(git_dir: Path) -> Dict[str, str]:
    work_tree = git_dir.parent
    base_cmd = ["git", f"--git-dir={git_dir}", f"--work-tree={work_tree}"]

    def run_git(args: List[str]) -> Tuple[bool, str]:
        try:
            result = subprocess.run(
                base_cmd + args,
                capture_output=True,
                text=True,
                check=True,
            )
        except subprocess.CalledProcessError as exc:
            return False, exc.stderr.strip()
        return True, result.stdout.strip()

    status: Dict[str, str] = {
        "path": str(work_tree),
        "relative_path": str(work_tree.relative_to(ROOT_PATH)) if work_tree != ROOT_PATH else ".",
    }

    ok, head = run_git(["rev-parse", "HEAD"])
    if not ok:
        status["status"] = f"error: {head}"
        return status
    status["status"] = "ok"
    status["head"] = head

    ok, branch = run_git(["symbolic-ref", "-q", "--short", "HEAD"])
    status["branch"] = branch if ok and branch else "(detached)"

    ok, latest = run_git(["log", "-1", "--format=%H,%cI,%an,%s"])
    if ok and latest:
        parts = latest.split(",", 3)
        while len(parts) < 4:
            parts.append("")
        commit_hash, committed, author, message = parts
        status.update(
            {
                "latest_commit": commit_hash,
                "latest_committed": committed,
                "latest_author": author,
                "latest_subject": message,
            }
        )
    else:
        status["latest_commit"] = ""
        status["latest_committed"] = ""
        status["latest_author"] = ""
        status["latest_subject"] = latest

    ok, remotes = run_git(["remote", "-v"])
    status["remotes"] = remotes.replace("\t", " ") if ok else ""

    return status


def write_directory_csv(target: Path, summaries: List[DirSummary]) -> None:
    fieldnames = [
        "name",
        "type",
        "size_bytes",
        "size_mb",
        "size_gb",
        "file_count",
        "markdown_count",
        "text_count",
        "js_count",
        "ts_count",
        "py_count",
        "other_code_count",
        "html_count",
        "latest_modified_iso",
    ]
    target.parent.mkdir(parents=True, exist_ok=True)
    with target.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames)
        writer.writeheader()
        for summary in summaries:
            writer.writerow(
                {
                    "name": summary.name,
                    "type": summary.type,
                    "size_bytes": summary.size_bytes,
                    "size_mb": f"{summary.size_mb:.2f}",
                    "size_gb": f"{summary.size_gb:.3f}",
                    "file_count": summary.file_count,
                    "markdown_count": summary.markdown_count,
                    "text_count": summary.text_count,
                    "js_count": summary.js_count,
                    "ts_count": summary.ts_count,
                    "py_count": summary.py_count,
                    "other_code_count": summary.other_code_count,
                    "html_count": summary.html_count,
                    "latest_modified_iso": summary.latest_iso,
                }
            )


def write_git_csv(target: Path, rows: List[Dict[str, str]]) -> None:
    fieldnames = [
        "relative_path",
        "status",
        "branch",
        "head",
        "latest_commit",
        "latest_committed",
        "latest_author",
        "latest_subject",
        "remotes",
    ]
    target.parent.mkdir(parents=True, exist_ok=True)
    with target.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow({field: row.get(field, "") for field in fieldnames})


def write_markdown(target: Path, summaries: List[DirSummary], generated_at: datetime) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    lines: List[str] = []
    lines.append("<!-- Auto-generated by generate_rollup.py -->")
    lines.append("# Archive Overview")
    lines.append("")
    lines.append(f"Generated: {generated_at.isoformat()}Z")
    lines.append("")
    lines.append("## Top-Level Items")
    lines.append("")
    lines.append("| Name | Type | Size (GB) | Files | Markdown | JS | TS | PY | HTML | Latest Modified |")
    lines.append("| ---- | ---- | ---------:| -----:| -------:| --:| --:| --:| ---:| ---------------- |")

    for summary in summaries:
        lines.append(
            "| {name} | {type} | {size:.3f} | {files} | {md} | {js} | {ts} | {py} | {html} | {latest} |".format(
                name=summary.name,
                type=summary.type,
                size=summary.size_gb,
                files=summary.file_count,
                md=summary.markdown_count,
                js=summary.js_count,
                ts=summary.ts_count,
                py=summary.py_count,
                html=summary.html_count,
                latest=summary.latest_iso or "",
            )
        )

    lines.append("")
    lines.append("See `metrics/directory_inventory.csv` and `metrics/git_repos.csv` for machine-readable details.")

    target.write_text("\n".join(lines), encoding="utf-8")


def collect_summaries(root: Path) -> List[DirSummary]:
    summaries: List[DirSummary] = []
    for item in sorted(root.iterdir(), key=lambda p: p.name.lower()):
        if item.is_dir():
            summary = summarise_directory(item)
        else:
            summary = summarise_file(item)
        summaries.append(summary)
    return summaries


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate archive knowledge roll-up")
    parser.add_argument(
        "--root",
        type=Path,
        default=None,
        help="Root directory to analyse (defaults to archive root inferred from script)",
    )
    parser.add_argument(
        "--git",
        action="store_true",
        help="Include git repository scan (slower if many repos)",
    )
    args = parser.parse_args()

    root = args.root
    if root is None:
        root = Path(__file__).resolve().parents[2]
    if not root.exists():
        parser.error(f"Root directory '{root}' does not exist")

    summaries = collect_summaries(root)

    generated_at = datetime.utcnow()
    hub_root = Path(__file__).resolve().parents[1]
    metrics_dir = hub_root / "metrics"
    rollups_dir = hub_root / "rollups"

    write_directory_csv(metrics_dir / "directory_inventory.csv", summaries)

    git_rows: List[Dict[str, str]] = []
    if args.git:
        git_dirs = find_git_dirs(root)
        for git_dir in git_dirs:
            row = git_summary(git_dir)
            git_rows.append(row)
        write_git_csv(metrics_dir / "git_repos.csv", git_rows)

    write_markdown(rollups_dir / "archive_overview.md", summaries, generated_at)

    print(f"Analysed {len(summaries)} top-level items under {root}")
    if args.git:
        print(f"Captured metadata for {len(git_rows)} git repositories")
    return 0


ROOT_PATH = Path(__file__).resolve().parents[2]

if __name__ == "__main__":
    sys.exit(main())


