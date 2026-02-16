# Repository Guidelines
## Project Structure & Module Organization
- `src/app/`: Next.js App Router (routes, pages, and UI blocks). Example: `src/app/posts/[id]/page.tsx`.
- `src/_posts/`: Markdown blog posts consumed by `src/lib/api.tsx`.
- `src/content/`: User-editable JSON content (projects, experience, about).
- `public/`: Static assets (images, icons).
- Config: `next.config.js`, `tailwind.config.ts`, `tsconfig.json`.
## Build, Test, and Development Commands
- `npm ci` (or `npm install`): Install dependencies. CI uses `npm ci`.
- `npm run dev`: Start dev server (Turbopack) at `http://localhost:3000`.
- `npm run build`: Production build (`.next/` and `out/`). Deployed via CDK.
- `npm start`: Serve the production build locally.
- `npm run lint`: Run ESLint with Next.js rules.
- Optional: `nix develop` for a preconfigured Node 20 dev shell (see `flake.nix`).
## Coding Style & Naming Conventions
- Language: TypeScript (strict). Indentation: 2 spaces.
- Components: PascalCase `.tsx` (e.g., `AboutBlock.tsx`).
- Routes: App Router conventions; use folder-based routes and dynamic segments (`[id]`).
- Styling: Tailwind CSS utilities; global styles in `src/app/globals.css`.
- Content: Prefer JSON/Markdown in `src/content` and `src/_posts` over hardcoding.
## Testing Guidelines
- No test suite is configured yet. If adding tests:
  - Unit: Vitest + React Testing Library (`*.spec.tsx`).
  - E2E: Playwright under `tests/e2e/`.
  - Add scripts (e.g., `test`, `test:e2e`) and ensure CI can run them.
## Commit & Pull Request Guidelines
- Commits: Prefer Conventional Commits (`feat:`, `fix:`, `refactor:`, `perf:`). Keep messages imperative and scoped.
- PRs: Include a clear summary, linked issues, and screenshots/GIFs for UI changes. Ensure `npm run build` and `npm run lint` pass locally.
## Security & Configuration Tips
- Secrets: Use AWS Secrets Manager or SSM Parameter Store via CDK. Only expose public values with `NEXT_PUBLIC_`.
- Images: `images.unoptimized` is enabled for static hosting—optimize sources (WebP where possible).
- Avoid committing large binaries to `public/`; use optimized assets.
## Agent Guidelines
- NEVER run development servers (`npm run dev`) - only the user should start/stop dev servers
- Focus on code changes, build processes, and static analysis
## MCP Server Activation

When you need to use Chrome DevTools functionality, activate the MCP server by using the `task` tool with the `general` subagent:

```
Use the task tool with subagent_type="general" to activate Chrome DevTools MCP tools
```

The general agent has access to MCP tools and can:
- Take screenshots
- Navigate pages
- Interact with web elements
- Analyze performance
- Debug browser issues

Example activation:
```
task(description="Use Chrome DevTools", prompt="Take a screenshot of the current page", subagent_type="general")
```
