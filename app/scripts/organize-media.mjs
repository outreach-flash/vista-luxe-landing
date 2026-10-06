/**
 * Moves property-referenced images from public/assets/img/ into
 * src/assets/properties/<slug>/ so Astro's build-time image engine can
 * optimize them. YAML files are only read, never modified.
 *
 * Idempotent: safe to re-run (e.g. after new Keystatic uploads land in
 * public/assets/img/). Usage: node scripts/organize-media.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import GithubSlugger from 'github-slugger';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = path.join(appRoot, 'src/content/properties');
const publicImgDir = path.join(appRoot, 'public/assets/img');
const assetsRoot = path.join(appRoot, 'src/assets/properties');

let moved = 0;
let skipped = 0;

for (const file of fs.readdirSync(contentDir).filter((f) => f.endsWith('.yaml'))) {
  // Match Astro's glob-loader id generation so dirs line up with route slugs.
  const slug = new GithubSlugger().slug(file.replace(/\.yaml$/, ''));
  const doc = YAML.parse(fs.readFileSync(path.join(contentDir, file), 'utf8'));

  const refs = new Set();
  for (const key of ['cardImage', 'floorPlan']) {
    if (typeof doc?.[key] === 'string') refs.add(doc[key]);
  }
  for (const item of doc?.gallery ?? []) {
    if (typeof item === 'string') refs.add(item);
  }

  for (const ref of refs) {
    if (!ref.startsWith('/assets/img/')) continue;
    const basename = path.basename(ref);
    const src = path.join(publicImgDir, basename);
    const destDir = path.join(assetsRoot, slug);
    const dest = path.join(destDir, basename);

    if (!fs.existsSync(src)) {
      skipped++;
      continue;
    }
    fs.mkdirSync(destDir, { recursive: true });
    fs.renameSync(src, dest);
    console.log(`${slug}: ${basename}`);
    moved++;
  }
}

console.log(`\nDone. Moved ${moved} image(s), skipped ${skipped} (already moved or missing).`);
