// Helper to generate internal hrefs for production: prefer extensionless paths.
// Many static hosts enable “Clean URLs” (/foo -> foo.html). We standardize on
// extensionless links everywhere for consistency across build/serve.
export function hrefHtml(path: string): string {
  // Preserve in-page anchors and external links unchanged
  if (!path || path.startsWith('#') || path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Normalize common .html forms back to clean URLs
  if (path === '/index.html') return '/';
  if (path.endsWith('.html')) return path.slice(0, -5);

  // Already clean
  return path;
}
