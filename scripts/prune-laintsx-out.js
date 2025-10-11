const fs = require('fs');
const path = require('path');

// Only keep out/lainTSX/dist; remove everything else in out/lainTSX
function pruneLainTSXOut() {
  const outDir = path.join(__dirname, '..', 'out');
  const targetDir = path.join(outDir, 'lainTSX');
  const keepName = 'dist';

  if (!fs.existsSync(outDir)) {
    console.log(`[prune-laintsx-out] Skip: out/ not found at ${outDir}`);
    return;
  }

  if (!fs.existsSync(targetDir)) {
    console.log(`[prune-laintsx-out] Skip: ${targetDir} does not exist`);
    return;
  }

  const distPath = path.join(targetDir, keepName);
  if (!fs.existsSync(distPath)) {
    console.warn(`[prune-laintsx-out] Skip: ${distPath} not found — nothing to prune safely.`);
    return;
  }

  const entries = fs.readdirSync(targetDir);
  for (const entry of entries) {
    if (entry === keepName) continue;
    const fullPath = path.join(targetDir, entry);
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`[prune-laintsx-out] Removed ${path.relative(outDir, fullPath)}`);
    } catch (err) {
      console.warn(`[prune-laintsx-out] Failed to remove ${fullPath}: ${err.message}`);
    }
  }

  console.log(`[prune-laintsx-out] Kept ${path.relative(outDir, distPath)}; pruned other contents.`);
}

pruneLainTSXOut();

