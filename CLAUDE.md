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

### Important Configuration

**Next.js Config** (`next.config.js`):
- Images are unoptimized (likely for static hosting)

**Tailwind Config** (`tailwind.config.ts`):
- Configured for App Router structure
- Custom gradient utilities defined

**Analytics**: Cloudflare Web Analytics integrated in layout.tsx

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
- `public/`: Static assets including project images and blog assets
- Images are converted to WebP format for performance