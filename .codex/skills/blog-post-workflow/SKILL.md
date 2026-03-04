---
name: blog-post-workflow
description: Guide blog post creation in this portfolio repo, including where to place markdown files and image assets, how to run SVG layering/optimization commands, and how to commit asset submodule updates and parent repo blog changes using the strict two-commit workflow. Use when creating, updating, or publishing posts in src/_posts with assets in public/assets.
---

# Blog Post Workflow

## Use Repo Paths Correctly

- Create post markdown files in `src/_posts/`.
- Name posts as `YYYY-MM-DD-post-slug.md`.
- Treat the post id as the filename without `.md`.
- Place optional SVG map files next to posts as `src/_posts/<post-id>.svg-map.json`.
- Place post images inside the assets submodule at `public/assets/<post-slug>/`.
- Reference images from markdown with absolute paths like `/assets/<post-slug>/<file>.webp`.

## Author a New Post

- Create `src/_posts/YYYY-MM-DD-<post-slug>.md`.
- Add frontmatter with at least:

```yaml
---
title: <Post title>
date: YYYY-MM-DD
image: /assets/<post-slug>/thumb.webp
---
```

- Keep `<post-slug>` stable across markdown, asset directory, and image URLs.
- Prefer optimized image formats (WebP when practical).

## Run Blog SVG/Image Pipeline

- Ensure `svg-layer-tool` is installed before SVG generation:
  - `uv tool install --editable /home/james/projects/svg-layer-tool`
- Generate layered SVG mappings for a post when needed:
  - `npm run svg:post -- --post src/_posts/YYYY-MM-DD-<post-slug>.md`
- Confirm the generated mapping file exists:
  - `src/_posts/YYYY-MM-DD-<post-slug>.svg-map.json`
- Optimize SVG assets when relevant:
  - `npm run svg:optimize`

## Validate Before Committing

- Check submodule and parent working trees separately:
  - `git -C public/assets status --short`
  - `git status --short`
- Run project checks from repo root:
  - `npm run lint`
  - `npm run build`
- Verify post and assets to commit are the intended files only.

## Commit With Strict Two-Commit Flow

- Always commit inside `public/assets` first, then commit parent repo changes.

### Step 1: Commit Assets Submodule

```bash
git -C public/assets status --short
git -C public/assets add <asset-paths>
git -C public/assets commit -m "feat: add assets for <post-slug>"
git -C public/assets push
git -C public/assets log -1 --oneline
```

### Step 2: Commit Parent Repo

```bash
git status --short
git add src/_posts/YYYY-MM-DD-<post-slug>.md
git add src/_posts/YYYY-MM-DD-<post-slug>.svg-map.json   # if generated
git add public/assets                                     # submodule pointer update
git commit -m "feat(blog): publish <post-slug>"
git push
```

- Use `feat(blog): ...`, `fix(blog): ...`, or similar Conventional Commit messages in parent repo.

## Recover Common Git Mistakes

- If parent repo staged `public/assets` before submodule commit:
  - `git restore --staged public/assets`
  - finish submodule commit flow first
- If submodule commit exists but parent pointer is missing:
  - `git add public/assets`
  - create a follow-up parent commit
- If parent commit is done but submodule commit is not pushed:
  - push submodule commit
  - create another parent commit updating `public/assets` pointer

## Reference

- Use [references/commit-and-pipeline-cheatsheet.md](references/commit-and-pipeline-cheatsheet.md) for command templates and fast checks.
