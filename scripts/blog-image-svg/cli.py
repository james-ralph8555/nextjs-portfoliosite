#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from manifest import build_manifest, write_manifest
from paths import extract_markdown_image_sources, is_local_asset_src, post_id_from_path, read_post_markdown
from pipeline import PipelineConfig, preflight_required_tools, process_image, resolve_svgo_command


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate Potrace SVG variants for post images")
    parser.add_argument("--post", required=True, help="Path to markdown post file")
    parser.add_argument("--public-root", default="public", help="Path to public assets root")
    parser.add_argument("--out-manifest", default="", help="Explicit output sidecar map path")
    parser.add_argument("--style", default="gold-fill-transparent", help="Manifest style label")
    parser.add_argument("--color", default="#d4af37", help="Potrace output color")
    parser.add_argument("--turdsize", type=int, default=3, help="Potrace turdsize")
    parser.add_argument("--alphamax", type=float, default=0.9, help="Potrace alphamax")
    parser.add_argument("--opttolerance", type=float, default=0.25, help="Potrace opttolerance")
    parser.add_argument("--threshold", type=float, default=55.0, help="Threshold percentage (0-100)")
    parser.add_argument("--mkbitmap-filter", type=int, default=2, help="mkbitmap highpass radius")
    parser.add_argument("--mkbitmap-scale", type=int, default=2, help="mkbitmap scale")
    parser.add_argument("--poster-colors", type=int, default=4, help="Posterized palette size for multi-layer generation")
    parser.add_argument("--palette-fuzz", type=float, default=7.0, help="Color matching fuzz percent for layer masks")
    parser.add_argument("--preview", type=int, default=0, choices=[0, 1], help="Render preview PNGs with rsvg-convert")
    parser.add_argument("--optimize", type=int, default=1, choices=[0, 1], help="Optimize SVG with svgo when available")
    parser.add_argument("--verbose", action="store_true", help="Print per-image records")
    return parser.parse_args()


def print_report(records: list[dict[str, Any]]) -> None:
    ok = [r for r in records if r.get("status") == "ok"]
    failed = [r for r in records if r.get("status") != "ok"]

    before = sum(int(r.get("svgBytesBeforeOptimize", 0)) for r in ok)
    after = sum(int(r.get("svgBytes", 0)) for r in ok)

    print(f"processed={len(records)} ok={len(ok)} failed={len(failed)}")
    print(f"svg_bytes_before={before} svg_bytes_after={after}")

    coverages = [r.get("maskBlackCoverage") for r in ok if isinstance(r.get("maskBlackCoverage"), (int, float))]
    if coverages:
        avg = sum(float(v) for v in coverages) / len(coverages)
        print(f"mask_black_coverage_avg={avg:.4f}")

    if failed:
        print("failed_images:")
        for row in failed:
            print(f"- {row.get('src')}: {row.get('error', 'unknown error')}")


def main() -> int:
    args = parse_args()

    missing_tools = preflight_required_tools()
    if args.optimize and resolve_svgo_command() is None:
        missing_tools = [*missing_tools, "svgo"]
    if missing_tools:
        print(f"missing required tools: {', '.join(missing_tools)}", file=sys.stderr)
        return 2

    post_path = Path(args.post)
    if not post_path.exists():
        print(f"post file not found: {post_path}", file=sys.stderr)
        return 2

    public_root = Path(args.public_root)
    post_id = post_id_from_path(post_path)

    out_manifest = Path(args.out_manifest) if args.out_manifest else Path("src/_posts") / f"{post_id}.svg-map.json"

    markdown = read_post_markdown(post_path)
    sources = extract_markdown_image_sources(markdown)
    local_asset_sources = [src for src in sources if is_local_asset_src(src)]

    cfg = PipelineConfig(
        public_root=public_root,
        color=args.color,
        turdsize=args.turdsize,
        alphamax=args.alphamax,
        opttolerance=args.opttolerance,
        threshold=args.threshold,
        mkbitmap_filter=args.mkbitmap_filter,
        mkbitmap_scale=args.mkbitmap_scale,
        optimize=bool(args.optimize),
        preview=bool(args.preview),
        poster_colors=args.poster_colors,
        palette_fuzz=args.palette_fuzz,
    )

    records: list[dict[str, Any]] = []
    for src in local_asset_sources:
        result = process_image(src, cfg)
        records.append(result)
        if args.verbose:
            print(json.dumps(result, indent=2))

    manifest_images: list[dict[str, Any]] = []
    for rec in records:
        row = {
            "src": rec["src"],
            "status": rec.get("status", "error"),
        }
        if rec.get("status") == "ok":
            row["svgSrc"] = rec.get("svgSrc")
            if isinstance(rec.get("layers"), list):
                row["layers"] = rec["layers"]
            if isinstance(rec.get("palette"), dict):
                row["palette"] = rec["palette"]
        if "error" in rec:
            row["error"] = rec["error"]
        if "warning" in rec:
            row["warning"] = rec["warning"]
        manifest_images.append(row)

    manifest = build_manifest(post_id=post_id, style=args.style, images=manifest_images)
    write_manifest(out_manifest, manifest)

    print_report(records)
    print(f"manifest={out_manifest}")

    failures = [r for r in records if r.get("status") != "ok"]
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
