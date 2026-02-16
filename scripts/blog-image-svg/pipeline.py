from __future__ import annotations

import re
import shutil
import subprocess
import tempfile
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from paths import (
    layer_svg_src_from_src,
    preview_src_from_src,
    public_path_from_src,
    svg_src_from_src,
)

_HISTOGRAM_RE = re.compile(r"\s*(\d+):\s*\((\d+),(\d+),(\d+)\)\s+#([0-9A-Fa-f]{6})")
_SVG_NS = "http://www.w3.org/2000/svg"
ET.register_namespace("", _SVG_NS)


@dataclass(frozen=True)
class PipelineConfig:
    public_root: Path
    color: str
    turdsize: int
    alphamax: float
    opttolerance: float
    threshold: float
    mkbitmap_filter: int
    mkbitmap_scale: int
    optimize: bool
    preview: bool
    poster_colors: int
    palette_fuzz: float


def command_exists(command: str) -> bool:
    return shutil.which(command) is not None


def resolve_svgo_command() -> list[str] | None:
    global_svgo = shutil.which("svgo")
    if global_svgo:
        return [global_svgo]

    local_svgo = Path("node_modules/.bin/svgo")
    if local_svgo.exists():
        return [str(local_svgo)]

    return None


def run_checked(command: list[str], *, capture_output: bool = False) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        command,
        check=True,
        text=True,
        capture_output=capture_output,
    )


def preflight_required_tools() -> list[str]:
    required = ["magick", "mkbitmap", "potrace"]
    return [tool for tool in required if not command_exists(tool)]


def maybe_optimize_svg(svg_path: Path) -> dict[str, Any]:
    before = svg_path.stat().st_size

    svgo_cmd = resolve_svgo_command()
    if not svgo_cmd:
        raise RuntimeError("svgo not found")

    # Try with increased Node stack size first
    env_with_stack = dict(subprocess.os.environ)
    env_with_stack["NODE_OPTIONS"] = "--max-old-space-size=8192"

    try:
        subprocess.run(
            [*svgo_cmd, "--multipass", str(svg_path)],
            check=True,
            text=True,
            capture_output=True,
            env=env_with_stack,
        )
    except subprocess.CalledProcessError:
        # If stack overflow, try with mergePaths disabled via inline config
        config_js = f'''export default {{ multipass: true, plugins: [{{ name: "preset-default", params: {{ overrides: {{ mergePaths: false }} }} }}] }};'''
        with tempfile.NamedTemporaryFile(mode="w", suffix=".mjs", delete=False) as cfg_file:
            cfg_file.write(config_js)
            cfg_path = Path(cfg_file.name)

        try:
            subprocess.run(
                [*svgo_cmd, "--config", str(cfg_path), str(svg_path)],
                check=True,
                text=True,
                capture_output=True,
                env=env_with_stack,
            )
        except subprocess.CalledProcessError:
            # Skip optimization for this file, keep unoptimized SVG
            return {
                "optimized": False,
                "bytesBefore": before,
                "bytesAfter": before,
                "optimizer": "svgo",
                "skipped": True,
                "reason": "SVGO stack overflow, kept unoptimized",
            }
        finally:
            cfg_path.unlink(missing_ok=True)

    after = svg_path.stat().st_size
    return {
        "optimized": True,
        "bytesBefore": before,
        "bytesAfter": after,
        "optimizer": "svgo",
    }


def luminance(r: int, g: int, b: int) -> float:
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def parse_histogram_colors(histogram_text: str) -> list[tuple[int, str, tuple[int, int, int]]]:
    colors: list[tuple[int, str, tuple[int, int, int]]] = []
    for line in histogram_text.splitlines():
        m = _HISTOGRAM_RE.match(line)
        if not m:
            continue
        count = int(m.group(1))
        r, g, b = int(m.group(2)), int(m.group(3)), int(m.group(4))
        hex_color = f"#{m.group(5).lower()}"
        colors.append((count, hex_color, (r, g, b)))
    return colors


def extract_palette_from_image(image_path: Path, poster_colors: int) -> list[str]:
    result = run_checked([
        "magick",
        str(image_path),
        "-resize",
        "1600x1600>",
        "+dither",
        "-colors",
        str(max(3, poster_colors)),
        "-format",
        "%c",
        "histogram:info:-",
    ], capture_output=True)

    parsed = parse_histogram_colors(result.stdout)
    if not parsed:
        return ["#101010", "#5d4a1f", "#d4af37"]

    # Keep top colors by area, then sort dark->light for layer assignment.
    top = sorted(parsed, key=lambda item: item[0], reverse=True)[: max(3, poster_colors)]
    ranked = sorted(top, key=lambda item: luminance(*item[2]))

    return [item[1] for item in ranked]


def mask_black_coverage(mask_path: Path) -> float | None:
    try:
        result = run_checked([
            "magick",
            str(mask_path),
            "-format",
            "%[fx:1-mean]",
            "info:",
        ], capture_output=True)
        return float(result.stdout.strip())
    except Exception:
        return None


def trace_intensity_region(
    *,
    gray_image: Path,
    lower_bound: float | None,
    upper_bound: float | None,
    fill_color: str,
    output_svg: Path,
    turdsize: int,
    opttolerance: float,
    tmp_dir: Path,
) -> float | None:
    raw_mask = tmp_dir / f"{output_svg.stem}.raw.pbm"
    clean_mask = tmp_dir / f"{output_svg.stem}.clean.pbm"

    if lower_bound is None and upper_bound is None:
        expression = "1"
    elif lower_bound is None:
        expression = f"u<={upper_bound:.4f} ? 0 : 1"
    elif upper_bound is None:
        expression = f"u>{lower_bound:.4f} ? 0 : 1"
    else:
        expression = f"(u>{lower_bound:.4f} && u<={upper_bound:.4f}) ? 0 : 1"

    run_checked([
        "magick",
        str(gray_image),
        "-fx",
        expression,
        "-threshold",
        "50%",
        str(raw_mask),
    ])
    run_checked([
        "mkbitmap",
        "-f",
        "1",
        "-s",
        "1",
        "-t",
        "0.5",
        "-o",
        str(clean_mask),
        str(raw_mask),
    ])

    # Keep the original bitmap canvas. `--tight` crops each layer differently,
    # which causes visible misregistration when layers are stacked in CSS.
    run_checked([
        "potrace",
        "-s",
        "--group",
        "-t",
        str(max(2, turdsize)),
        "-a",
        "1.0",
        "-O",
        str(opttolerance),
        "-C",
        fill_color,
        "-o",
        str(output_svg),
        str(clean_mask),
    ])

    return mask_black_coverage(clean_mask)


def trace_line_layer(
    *,
    input_path: Path,
    output_svg: Path,
    cfg: PipelineConfig,
    tmp_dir: Path,
) -> float | None:
    gray = tmp_dir / "line.gray.pgm"
    mask = tmp_dir / "line.mask.pbm"
    mask_trace = tmp_dir / "line.trace.pbm"

    run_checked([
        "magick",
        str(input_path),
        "-colorspace",
        "Gray",
        str(gray),
    ])
    run_checked([
        "mkbitmap",
        "-f",
        str(cfg.mkbitmap_filter),
        "-s",
        str(cfg.mkbitmap_scale),
        "-t",
        str(max(0.0, min(1.0, cfg.threshold / 100.0))),
        "-o",
        str(mask),
        str(gray),
    ])
    run_checked([
        "magick",
        str(mask),
        "-negate",
        str(mask_trace),
    ])
    # Keep line layer on its full canvas for consistent registration.
    run_checked([
        "potrace",
        "-s",
        "--group",
        "-t",
        str(cfg.turdsize),
        "-a",
        str(cfg.alphamax),
        "-O",
        str(cfg.opttolerance),
        "-C",
        cfg.color,
        "-o",
        str(output_svg),
        str(mask_trace),
    ])

    return mask_black_coverage(mask_trace)


def _parse_float_token(value: str) -> float:
    cleaned = value.strip().replace("px", "")
    return float(cleaned)


def inject_black_matte(svg_path: Path) -> None:
    tree = ET.parse(svg_path)
    root = tree.getroot()

    existing = root.find(f"./{{{_SVG_NS}}}rect[@id='bg-matte']")
    if existing is not None:
        return

    x = 0.0
    y = 0.0
    width = 0.0
    height = 0.0

    view_box = root.attrib.get("viewBox")
    if view_box:
        parts = [p for p in view_box.strip().split() if p]
        if len(parts) == 4:
            x = _parse_float_token(parts[0])
            y = _parse_float_token(parts[1])
            width = _parse_float_token(parts[2])
            height = _parse_float_token(parts[3])

    if width <= 0 or height <= 0:
        width_attr = root.attrib.get("width", "0")
        height_attr = root.attrib.get("height", "0")
        width = _parse_float_token(width_attr)
        height = _parse_float_token(height_attr)

    if width <= 0 or height <= 0:
        raise RuntimeError(f"cannot derive SVG bounds for matte injection: {svg_path}")

    matte = ET.Element(
        f"{{{_SVG_NS}}}rect",
        {
            "id": "bg-matte",
            "x": f"{x:g}",
            "y": f"{y:g}",
            "width": f"{width:g}",
            "height": f"{height:g}",
            "fill": "#000000",
        },
    )
    root.insert(0, matte)
    tree.write(svg_path, encoding="utf-8", xml_declaration=False)


def process_image(src: str, cfg: PipelineConfig) -> dict[str, Any]:
    input_path = public_path_from_src(cfg.public_root, src)

    svg_src = svg_src_from_src(src)
    svg_path = public_path_from_src(cfg.public_root, svg_src)

    layer_bg_src = layer_svg_src_from_src(src, "bg")
    layer_tone_src = layer_svg_src_from_src(src, "tone")
    layer_highlight_src = layer_svg_src_from_src(src, "highlight")
    layer_line_src = layer_svg_src_from_src(src, "line")

    layer_bg_path = public_path_from_src(cfg.public_root, layer_bg_src)
    layer_tone_path = public_path_from_src(cfg.public_root, layer_tone_src)
    layer_highlight_path = public_path_from_src(cfg.public_root, layer_highlight_src)
    layer_line_path = public_path_from_src(cfg.public_root, layer_line_src)

    preview_src = preview_src_from_src(src)
    preview_path = public_path_from_src(cfg.public_root, preview_src)

    record: dict[str, Any] = {
        "src": src,
        "svgSrc": svg_src,
        "status": "error",
        "layers": [],
    }

    if not input_path.exists():
        record["error"] = f"input not found: {input_path}"
        return record

    svg_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        with tempfile.TemporaryDirectory(prefix="blog-image-svg-") as tmp_dir_name:
            tmp_dir = Path(tmp_dir_name)
            poster = tmp_dir / "poster.png"
            gray_base = tmp_dir / "base.gray.pgm"

            run_checked([
                "magick",
                str(input_path),
                "-resize",
                "2000x2000>",
                "+dither",
                "-colors",
                str(max(3, cfg.poster_colors)),
                str(poster),
            ])
            run_checked([
                "magick",
                str(input_path),
                "-colorspace",
                "Gray",
                str(gray_base),
            ])

            palette = extract_palette_from_image(poster, cfg.poster_colors)
            dark = palette[0]
            mid = palette[len(palette) // 2]
            bright = palette[-1]

            coverages: dict[str, float | None] = {}

            coverages["bg"] = trace_intensity_region(
                gray_image=gray_base,
                lower_bound=None,
                upper_bound=0.27,
                fill_color="#000000",
                output_svg=layer_bg_path,
                turdsize=cfg.turdsize + 4,
                opttolerance=max(cfg.opttolerance, 0.42),
                tmp_dir=tmp_dir,
            )
            inject_black_matte(layer_bg_path)
            coverages["tone"] = trace_intensity_region(
                gray_image=gray_base,
                lower_bound=0.27,
                upper_bound=0.66,
                fill_color=mid,
                output_svg=layer_tone_path,
                turdsize=cfg.turdsize + 3,
                opttolerance=max(cfg.opttolerance, 0.4),
                tmp_dir=tmp_dir,
            )
            coverages["highlight"] = trace_intensity_region(
                gray_image=gray_base,
                lower_bound=0.66,
                upper_bound=0.94,
                fill_color=bright,
                output_svg=layer_highlight_path,
                turdsize=cfg.turdsize + 5,
                opttolerance=max(cfg.opttolerance, 0.5),
                tmp_dir=tmp_dir,
            )
            coverages["line"] = trace_line_layer(
                input_path=input_path,
                output_svg=layer_line_path,
                cfg=cfg,
                tmp_dir=tmp_dir,
            )

            # Keep a flat fallback for environments that don't compose layers.
            shutil.copyfile(layer_line_path, svg_path)

            output_layers = [
                {
                    "kind": "bg",
                    "src": layer_bg_src,
                    "opacity": 1,
                    "blend": "normal",
                },
                {
                    "kind": "tone",
                    "src": layer_tone_src,
                    "opacity": 0.88,
                    "blend": "normal",
                },
                {
                    "kind": "highlight",
                    "src": layer_highlight_src,
                    "opacity": 0.72,
                    "blend": "normal",
                },
                {
                    "kind": "line",
                    "src": layer_line_src,
                    "opacity": 0.62,
                    "blend": "normal",
                },
            ]

            all_svg_paths = [layer_bg_path, layer_tone_path, layer_highlight_path, layer_line_path, svg_path]
            before_bytes = sum(path.stat().st_size for path in all_svg_paths)

            if cfg.optimize:
                for layer_path in all_svg_paths:
                    maybe_optimize_svg(layer_path)

            after_bytes = sum(path.stat().st_size for path in all_svg_paths)

            if cfg.preview and command_exists("rsvg-convert"):
                preview_path.parent.mkdir(parents=True, exist_ok=True)
                run_checked([
                    "rsvg-convert",
                    str(svg_path),
                    "-o",
                    str(preview_path),
                ])
                record["previewSrc"] = preview_src

            record["status"] = "ok"
            record["layers"] = output_layers
            record["palette"] = {
                "dark": dark,
                "mid": mid,
                "bright": bright,
            }
            record["maskCoverage"] = coverages
            record["inputBytes"] = input_path.stat().st_size
            record["svgBytesBeforeOptimize"] = before_bytes
            record["svgBytes"] = after_bytes

            return record
    except subprocess.CalledProcessError as exc:
        stderr = (exc.stderr or "").strip()
        stdout = (exc.stdout or "").strip()
        detail = stderr or stdout or str(exc)
        record["error"] = detail
        return record
