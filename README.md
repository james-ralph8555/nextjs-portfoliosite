# Next.js Portfolio Site

Personal portfolio built with Next.js App Router, TypeScript, and Tailwind CSS. It features JSON-driven content, Markdown-powered blog posts, and a retro terminal aesthetic with an interactive canvas-rendered spinning globe.

**Highlights**
- Modern App Router architecture under `src/app/`
- JSON content in `src/content/` and Markdown posts in `src/_posts/`
- Markdown blog pipeline with GFM, syntax highlighting, math, Mermaid, and SVG depth effects
- Interactive canvas 3D wireframe globe with drag controls and boombox-style speed matrix (no WebGL/three.js)

## Tech Stack
- Framework: Next.js (App Router)
- UI: React + Tailwind CSS
- Language: TypeScript (strict)
- Rendering: Canvas 2D API for the retro globe
- Markdown: gray-matter + unified (remark/rehype) + rehype-pretty-code + KaTeX + Mermaid

## Architecture
- `src/app/`: Next.js App Router pages, routes, and UI blocks
  - `page.tsx`: Home view wiring the left profile/retro globe and right content blocks
  - `blog/`: Blog index route
  - `posts/[id]/page.tsx`: Dynamic route for individual Markdown posts
  - `posts/[id]/MermaidRenderer.tsx`: client-side Mermaid diagram rendering for fenced `mermaid` code blocks
  - `posts/[id]/SvgImageReactivity.tsx`: interactive layered SVG/image depth effect in post content
  - UI Blocks: `AboutBlock.tsx`, `ExperienceBlock.tsx`, `ProjectsBlock.tsx`, `BlogLinkBlock.tsx`, `SideBar.tsx`, `Socials.tsx`
- `src/_posts/`: Markdown posts consumed by `src/lib/api.tsx`
- `src/_posts/*.audio-map.json`: generated sidecars for blog audio assets
- `src/content/`: User‑editable JSON for About, Experience, Projects
- `src/lib/api.tsx`: Markdown parsing pipeline and post helpers
- `src/lib/retroGlobeCanvas.ts`: Globe rendering math + Canvas frame renderer
- `public/`: Static assets (images, icons)
- `public/assets/post-audio/`: generated public blog audio assets
- Config: `next.config.js`, `tailwind.config.ts`, `tsconfig.json`

## Spinning Globe
The globe now uses a dedicated canvas renderer with a React control shell. No WebGL/three.js is used.

- Component: `src/app/RetroGlobe.tsx`
- Renderer: `src/lib/retroGlobeCanvas.ts`
- Styles: `src/styles/06-3d-globe.css` (imported from `src/app/globals.css`)
- How it works:
  - `requestAnimationFrame` loop advances runtime state (`rotX`, `rotY`, `rotZ`, `wobble`, `bandPhase`)
  - Draws projected latitude/longitude shell lines and moving light bands in multiple passes
  - React state controls line width/density, axis spin speeds, wobble speed, and band speed
  - Supports drag-to-rotate (mouse and touch), plus pause/play controls
  - Mount guard avoids hydration mismatches in SSR (`mounted` state)
- Customize:
  - Shell complexity/palette math: `src/lib/retroGlobeCanvas.ts`
  - Control UI/layout: `src/app/RetroGlobe.tsx` + `src/styles/06-3d-globe.css`
  - Size/perspective: `.globe-wrapper` and responsive media queries in `06-3d-globe.css`
- Mobile/perf:
  - Canvas DPR-aware sizing keeps rendering sharp while clamping DPR to control cost
  - Includes iOS-focused perspective/transform fallbacks in globe styles

## Development
- Install deps: `npm ci` (or `npm install`)
- Build: `npm run build` → outputs `out/` (static export)
- Serve: `npm run serve` → serves the static export from `out/`
- Preview loop: `npm run preview` (clean build + serve)
- Lint: `npm run lint`
- Optional: `nix develop` for a combined Node + CUDA + uv dev shell
- SVG utility (one-time): `uv tool install --editable /home/james/projects/svg-layer-tool`
- Generate layered blog SVGs: `npm run svg:post -- --post src/_posts/<post>.md`
- Optimize generated SVG assets: `npm run svg:optimize`
- Bootstrap the copied blog-audio runtime: `npm run audio:bootstrap`
- Raw voice design CLI: `npm run audio:design -- design --text "..." --instruct "..." --language English`
- Blog-native audio sidecar generation: `npm run audio:post -- --post src/_posts/<post>.md --language English`
- Audio post generation uses paragraph-sized chunking by default (`200-500` chars, `100ms` pauses), merges adjacent short blocks, and publishes `public/assets/post-audio/<post>/post.mp3`
- Blog-native post narration uses Qwen Base voice cloning through `vllm-omni` with `/home/james/projects/tts/prepared_audio/voice_sample_original_mono_48k_00m15s_00m30s_denoise_2.wav` as the default shared reference sample
- Blog-audio sidecars include transcript text plus per-chunk text/timing metadata for later synchronized highlighting
- `ffmpeg` is required for the MP3 transcode in `audio:post`

## Content Editing
All non‑code content lives in `src/content` (JSON) and `src/_posts` (Markdown).

- About (`src/content/about.json`)
  - Shape: `{ "paragraphs": ["..."] }`
- Experience (`src/content/experience.json`)
  - Items contain: `start`, `end`, `company`, `company_link`, `title`, `body[]`
- Projects (`src/content/projects.ts`)
  - Items contain: `title`, `summary`, `image`, `url`, `github`

## Blog
- Location: `src/_posts/*.md`
- Frontmatter example:
  ```yaml
  ---
  title: My Awesome Blog Post
  date: 2025-08-16
  coverImage: /assets/my-post/cover.webp
  ---
  ```
- Features:
  - GitHub Flavored Markdown
  - Math via `remark-math` + `rehype-katex`
  - Syntax highlighting (`rehype-pretty-code`)
  - Mermaid diagrams from fenced code blocks (rendered client-side on post pages)
  - Image captions via italic line after image (figure + figcaption)
  - Linkable headings via `rehype-slug` + autolink
  - Layered SVG/image depth cards driven by optional post sidecar maps (`src/_posts/<post>.svg-map.json`)
  - Blog-audio sidecars written to `src/_posts/<post>.audio-map.json`
  - AI-image prompt sidecars written to `src/_posts/<post>.ai-image-map.json`
  - HTML media embeds in posts (for example `<video>`), plus video or image `coverImage` support in blog listings
- Blog surfaces:
  - Home page `BLOG` block (`BlogLinkBlock`) shows recent posts in terminal-table/card format
  - `/blog` route lists all posts
  - `/posts/[id]` route renders full post HTML content
- Note: Markdown parser creation is memoized for faster builds

## Deployment (AWS CDK)

The repository deploys two independently built static sites:

| Site | Domain | Source | Build output |
| --- | --- | --- | --- |
| Portfolio | `james-ralph.com`, `www.james-ralph.com` | repository root | `out/` |
| GravityLens | `gravitylens.james-ralph.com` | `projects/black-hole-laboratory/` | `projects/black-hole-laboratory/www/dist/` |

`hosted-apps.json` is the source of truth for project paths, build commands,
artifacts, and domain aliases.

**Prerequisites**:
- AWS CLI configured with appropriate credentials
- ACM certificate in `us-east-1` for `james-ralph.com`, `www.james-ralph.com`, and `*.james-ralph.com`
- Node.js/npm, Rust, the `wasm32-unknown-unknown` target, and `wasm-pack`

**Build and deploy**:

```bash
# Install root and hosted-project dependencies.
npm run bootstrap:apps

# Build the portfolio and GravityLens.
npm run build:apps

# Deploy both CloudFront/S3 sites with the existing wildcard certificate.
cd infra
npm ci
SITE_CERTIFICATE_ARN='arn:aws:acm:us-east-1:ACCOUNT:certificate/ID' npm run deploy:portfolio
```

To build GravityLens by itself, run `npm run build:gravitylens`.

The CDK stack (`infra/lib/static-site-stack.ts`) provisions a private,
versioned S3 bucket, CloudFront distribution, static asset deployment, and
cache invalidation for each site in `hosted-apps.json`. After deployment,
point the `gravitylens.james-ralph.com` DNS record at the emitted
`GravitylensCloudFrontDomainName`.

## CDK Infra (Static Sites)

- Location: `infra/`
- Stacks:
  - `NextjsPortfoliositeCertificateStack`: ACM certificate for `james-ralph.com` with `www` and wildcard SANs (DNS validation).
  - `NextjsPortfoliositeSiteStack`: S3 and CloudFront resources for the portfolio and GravityLens.

The certificate must be in `us-east-1` for CloudFront. To create it, run
`CERTIFICATE_REGION=us-east-1 npm run cdk -- deploy NextjsPortfoliositeCertificateStack`
from `infra/`, create the emitted DNS validation CNAMEs, and wait for ACM to
issue the certificate before deploying the site stack.

## Configuration & Security
- Secrets via AWS Secrets Manager or SSM Parameter Store
- Images: `images.unoptimized = true` (optimize sources; prefer WebP)
- Avoid large binaries in `public/`

## Fonts
This site uses proprietary fonts from https://usgraphics.com, which are gitignored. The site will fallback to JetBrains Mono if the custom fonts are not provided in the proper directory.
