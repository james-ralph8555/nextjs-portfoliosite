# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` (runs with Turbopack for faster builds)
- **Production build**: `npm run build`
- **Start production server**: `npm start`
- **Linting**: `npm run lint`

## Architecture Overview

This is a Next.js 15 portfolio website built with:
- **Framework**: Next.js 15 with App Router architecture
- **Styling**: Tailwind CSS with custom emerald theme
- **UI Components**: Material-UI for icons and components
- **Language**: TypeScript with some @ts-nocheck pragmas
- **Blog System**: Markdown-based with gray-matter for frontmatter parsing
- **Asset Management**: Private git submodule for secure asset storage

### Key Architectural Patterns

**Layout Structure**: 
- Two-column layout implemented in `src/app/page.tsx`
- Left side: sticky sidebar with name, navigation, and socials
- Right side: main content blocks (about, experience, projects, blog)

**Markdown Processing Pipeline**:
- Uses unified ecosystem (remark/rehype) for rich markdown processing
- Custom processing chain in `src/lib/api.tsx` includes:
  - GitHub Flavored Markdown support
  - Syntax highlighting with rehype-pretty-code (one-dark-pro theme)
  - Figure captions for images
  - Auto-linked headings with slugs
  - Custom CSS classes for styling

**Blog System**:
- Blog posts stored in `src/_posts/` as markdown files
- Frontmatter requires `title` and `date` fields
- Dynamic routing via `src/app/posts/[id]/page.tsx`
- Parser is memoized for performance (reduced build time from ~60s to ~10s)

**Component Structure**:
- Each main section is a separate component (AboutBlock, ExperienceBlock, etc.)
- Components are co-located in `src/app/` directory
- Uses React Server Components for data fetching

**Asset Management**:
- All static assets stored in private git submodule at `public/assets/`
- Remote repository: `git@github.com:james-ralph8555/nextjs-portfoliosite-assets.git`
- Deployed via CDK infrastructure (see `infra/` directory)
- Protects licensed fonts (Berkeley Mono) and keeps main repository clean
- No code changes required - asset URLs remain unchanged

### Important Configuration

**Next.js Config** (`next.config.js`):
- Images are unoptimized (likely for static hosting)

**Tailwind Config** (`tailwind.config.ts`):
- Configured for App Router structure
- Custom gradient utilities defined
- Extended animation library with custom keyframes for globe and UI animations

**Analytics**: Cloudflare Web Analytics integrated in layout.tsx

### CSS Architecture

**Modular CSS Structure**:
- CSS is organized into modular partials in `src/styles/` for better maintainability
- Main `globals.css` imports all partials in dependency order
- Each partial serves a specific purpose with clear separation of concerns

**CSS Partials**:
- `01-base.css`: Variables, fonts, resets, and base styles
- `02-tokens.css`: CSS custom properties and theme tokens  
- `03-utilities.css`: One-off helpers and utility classes
- `04-components.css`: Reusable UI components built with Tailwind @apply
- `05-animations.css`: Keyframes and animation utilities
- `06-3d-globe.css`: Globe-specific 3D wireframe styles (largest component)
- `07-layout.css`: Portfolio layout system and grid structure
- `08-scrollbars.css`: Custom scrollbar styling for different screen sizes

**Styling Philosophy**:
- Prioritize Tailwind utilities over custom CSS where possible
- Use `@apply` for reusable component patterns
- Custom CSS reserved for complex animations and 3D transforms
- Animations moved to Tailwind config for consistency
- Build time reduced by ~40% through better organization

## Adding Blog Posts

Create new markdown files in `src/_posts/` with required frontmatter:

```yaml
---
title: Post Title
date: 2025-01-01
---
```

Markdown features supported:
- GitHub Flavored Markdown
- Syntax highlighting (specify language after backticks)
- Image captions (italicized text after images becomes figcaption)
- Auto-linked headings

## File Organization

- `src/app/`: Next.js App Router pages and components
- `src/_posts/`: Blog post markdown files  
- `src/lib/api.tsx`: Markdown processing and blog post utilities
- `public/assets/`: Git submodule containing all static assets (fonts, images, etc.)
- Images are converted to WebP format for performance

## Asset Management

### Adding New Assets
1. Add files to the `public/assets/` directory
2. Commit and push changes to the assets submodule:
   ```bash
   cd public/assets
   git add .
   git commit -m "Add new assets"
   git push origin main
   ```
3. Commit submodule updates in main repository:
   ```bash
   cd ..
   git add public/assets
   git commit -m "Update assets submodule"
   ```

### Deployment
Deployed via AWS CDK infrastructure in the `infra/` directory:

1. Build the site: `npm run build`
2. Deploy via CDK:
   ```bash
   cd infra
   npm ci
   npm run deploy:portfolio
   ```

The CDK stack handles S3 bucket creation, CloudFront distribution, and asset deployment from the `out/` directory.