import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { join, extname } from 'path';

export const runtime = 'nodejs';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const parts = slug || [];
  const basePath = join(process.cwd(), 'public', 'lainTSX', 'dist');

  // Helper to serve a file with content type by extension
  const serveFile = async (absolutePath: string, rewriteHtml: boolean = false) => {
    let data = await readFile(absolutePath);
    const ext = extname(absolutePath).slice(1).toLowerCase();
    let contentType = 'application/octet-stream';
    switch (ext) {
      case 'html': contentType = 'text/html'; break;
      case 'css': contentType = 'text/css'; break;
      case 'js': contentType = 'application/javascript'; break;
      case 'json': contentType = 'application/json'; break;
      case 'png': contentType = 'image/png'; break;
      case 'jpg': case 'jpeg': contentType = 'image/jpeg'; break;
      case 'gif': contentType = 'image/gif'; break;
      case 'svg': contentType = 'image/svg+xml'; break;
      case 'webp': contentType = 'image/webp'; break;
      case 'wasm': contentType = 'application/wasm'; break;
      case 'mp3': contentType = 'audio/mpeg'; break;
      case 'ogg': contentType = 'audio/ogg'; break;
      case 'wav': contentType = 'audio/wav'; break;
      case 'mp4': contentType = 'video/mp4'; break;
      default: contentType = 'application/octet-stream';
    }
    
    // Rewrite HTML content to fix asset paths
    if (rewriteHtml && ext === 'html') {
      let htmlContent = data.toString();
      // Fix absolute paths to be relative to /lainTSX/
      htmlContent = htmlContent
        .replace(/src="\/assets\//g, 'src="/lainTSX/assets/')
        .replace(/href="\/assets\//g, 'href="/lainTSX/assets/')
        .replace(/src="\/scripts\//g, 'src="/lainTSX/scripts/')
        .replace(/src="\/images\//g, 'src="/lainTSX/images/')
        .replace(/src="\/emote-wheel\//g, 'src="/lainTSX/emote-wheel/')
        .replace(/href="\/images\//g, 'href="/lainTSX/images/')
        .replace(/href="\/vite\.svg"/g, 'href="/lainTSX/vite.svg');
      data = Buffer.from(htmlContent);
    }
    
    return new NextResponse(data, { headers: { 'Content-Type': contentType } });
  };

  // Root of the section -> index.html
  if (parts.length === 0) {
    try {
      const indexPath = join(basePath, 'index.html');
      await stat(indexPath);
      return await serveFile(indexPath, true);
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
  }

  const requestedPath = join(basePath, ...parts);

  // First try the path as a file or directory
  try {
    const st = await stat(requestedPath);
    if (st.isFile()) {
      const ext = extname(requestedPath).slice(1).toLowerCase();
      const isHtml = ext === 'html';
      return await serveFile(requestedPath, isHtml);
    }
    if (st.isDirectory()) {
      const indexPath = join(requestedPath, 'index.html');
      const stIndex = await stat(indexPath);
      if (stIndex.isFile()) {
        return await serveFile(indexPath, true);
      }
    }
  } catch {
    // fall through to extensionless handling
  }

  // If no extension, try mapping to .html and directory index.html
  const last = parts[parts.length - 1] || '';
  const hasExtension = last.includes('.');
  if (!hasExtension) {
    const htmlPath = requestedPath + '.html';
    try {
      const stHtml = await stat(htmlPath);
      if (stHtml.isFile()) {
        return await serveFile(htmlPath, true);
      }
    } catch {}

    try {
      const indexPath = join(requestedPath, 'index.html');
      const stIndex = await stat(indexPath);
      if (stIndex.isFile()) {
        return await serveFile(indexPath, true);
      }
    } catch {}
  }

  return NextResponse.json({ error: 'File not found' }, { status: 404 });
}
