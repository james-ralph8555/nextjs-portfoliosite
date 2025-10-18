# Next.js Portfolio Site

Personal portfolio built with Next.js App Router, TypeScript, and Tailwind CSS. It features JSON‑driven content, Markdown‑powered blog posts, and a retro terminal aesthetic with a CSS 3D spinning globe.

**Highlights**
- Modern App Router architecture under `src/app/`
- JSON content in `src/content/` and Markdown posts in `src/_posts/`
- GFM blog with code highlighting, captions, and anchored headings
- CSS‑only 3D wireframe globe component (no WebGL/three.js)

## Tech Stack
- Framework: Next.js (App Router)
- UI: React + Tailwind CSS
- Language: TypeScript (strict)
- Markdown: gray-matter + unified (remark/rehype) + rehype-pretty-code

## Architecture
- `src/app/`: Next.js App Router pages, routes, and UI blocks
  - `page.tsx`: Home view wiring the left profile/retro globe and right content blocks
  - `blog/`: Blog index route
  - `posts/[id]/page.tsx`: Dynamic route for individual Markdown posts
  - UI Blocks: `AboutBlock.tsx`, `ExperienceBlock.tsx`, `ProjectsBlock.tsx`, `BlogLinkBlock.tsx`, `SideBar.tsx`, `Socials.tsx`
- `src/_posts/`: Markdown posts consumed by `src/lib/api.tsx`
- `src/content/`: User‑editable JSON for About, Experience, Projects
- `src/lib/api.tsx`: Markdown parsing pipeline and post helpers
- `public/`: Static assets (images, icons)
- Config: `next.config.js`, `tailwind.config.ts`, `tsconfig.json`, `amplify.yml`

## Spinning Globe
The globe is a pure CSS 3D wireframe sphere rendered via nested divs and transforms. No WebGL or canvas is used.

- Component: `src/app/RetroGlobe.tsx`
- Styles: `src/app/globals.css` (search for “RETRO GLOBE 3D WIREFRAME”)
- How it works:
  - Renders latitude rings and longitude meridians as bordered circles positioned/rotated in 3D (`rotateX`/`rotateY`)
  - Continuous rotation via `@keyframes globe-rotate`; subtle tilt via `@keyframes globe-wobble`
  - Atmospheric effects with `.globe-glow` and gradient shading
  - Mount guard avoids hydration mismatches in SSR (`mounted` state)
- Customize:
  - Size: change `const R = 120` in `RetroGlobe.tsx` and matching `.meridian-line` width/height in CSS
  - Speed: tweak animation durations in `globals.css` (`globe-rotate`, `globe-wobble`)
  - Theme: adjust Tailwind tokens and `.latitude-ring`/`.meridian-line` borders
- Mobile/perf:
  - Uses `translate3d` and tuned `perspective` to force GPU acceleration
  - iOS fallbacks increase border thickness and adjust perspective for clarity

## Development
- Install deps: `npm ci` (or `npm install`)
- Dev server: `npm run dev` → http://localhost:3000
- Build: `npm run build` → outputs `out/` (static export)
- Serve: `npm run serve` → serves the static export from `out/`
- Lint: `npm run lint`
- Optional: `nix develop` for a preconfigured Node 20 dev shell

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
  image: /blog/my-post-featured-image.webp
  ---
  ```
- Features:
  - GitHub Flavored Markdown
  - Syntax highlighting (`rehype-pretty-code`)
  - Image captions via italic line after image (figure + figcaption)
  - Linkable headings via `rehype-slug` + autolink
- Note: Markdown parser creation is memoized for faster builds

## Deployment (AWS Amplify)
- Config: `amplify.yml`
- Steps: `npm ci` → `npm run build`
- Artifact: deploy `out/` directory (for static export)
- Cache: `.npm/**/*` (adjust other caches as needed)

## CDK Infra (Static Sites)
- Location: `infra/`
- Stacks:
  - `NextjsPortfoliositeCertificateStack`: ACM cert for `james-ralph.com` with SANs `www` and wildcard `*.james-ralph.com` (DNS validation; manual records).
  - `NextjsPortfoliositeSiteStack`: S3+CloudFront for the main static export (`out/`).
  - `NextjsPortfoliositeLainTsxSiteStack`: S3+CloudFront for `public/lainTSX/dist` served at `lainTSX.james-ralph.com`.

Quick start:
- Cert (must be in `us-east-1` for CloudFront):
  - `cd infra && npm run build`
  - `CERTIFICATE_REGION=us-east-1 npm run cdk -- deploy NextjsPortfoliositeCertificateStack`
  - Manually create the DNS validation CNAMEs in your DNS provider, then continue once issued.
- LainTSX static site:
  - Ensure `public/lainTSX/dist` exists (or pass `-c lainDistPath=/abs/path`).
  - Deploy with existing cert ARN:
    - `CERTIFICATE_ARN=<acm-arn> npm run cdk -- deploy NextjsPortfoliositeLainTsxSiteStack`
    - Or rely on cross-stack import of `NextjsPortfoliositeCertificateArn` if both stacks are in the same account/region.
  - Create a DNS CNAME: `lainTSX.james-ralph.com` → the output `LainTsxCloudFrontDomainName`.

## Configuration & Security
- Env vars via Amplify; expose only public values with `NEXT_PUBLIC_`
- Images: `images.unoptimized = true` (optimize sources; prefer WebP)
- Avoid large binaries in `public/`

## Fonts
This site uses proprietary fonts from https://usgraphics.com, which are gitignored. The site will fallback to JetBrains Mono if the custom fonts are not provided in the proper directory.
