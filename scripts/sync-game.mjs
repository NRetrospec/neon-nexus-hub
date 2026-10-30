#!/usr/bin/env node
/**
 * game:sync — copy a standalone game project into this site's public/games/.
 *
 *   npm run game:sync -- phresh-smoothie
 *   npm run game:sync -- phresh-smoothie "C:\path\to\other\game"
 *
 * Why a copy instead of a symlink/import: the games are plain ES-module +
 * canvas projects with RELATIVE asset paths (assets/..., Public/...). Serving
 * them from public/games/<slug>/ keeps every path working untouched, keeps the
 * bundle out of Vite's graph, and means deploying the site deploys the games.
 *
 * Only files the game actually loads are copied (see KEEP_PUBLIC for the
 * source-art allowlist) — the standalone repos carry 20MB+ of unused source
 * sprite sheets that would otherwise bloat every deploy.
 *
 * After syncing: reload the site, the game is served at
 *   /games/<slug>/index.html
 *
 * NOTE: this folder is WIPED and re-copied on every sync — never put art you
 * author here. Promo/promo-thumbnail art belongs in `public/game-covers/<slug>.jpg`
 * (committed, survives syncs) and is referenced by the game's `thumbnail` field
 * in Convex (games:upsertGame).
 */
import { cp, mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = path.resolve(HERE, "..");
const PROJECTS_ROOT = path.resolve(SITE_ROOT, ".."); // Desktop/Projects
const DEST_ROOT = path.join(SITE_ROOT, "public", "games");

/** slug (URL + folder under public/games) -> project folder name in Desktop/Projects */
const SOURCE_DIRS = {
  "phresh-smoothie": "phreshsmoothie",
};

/** Source-art files under Public/ that the game actually loads at runtime. */
const KEEP_PUBLIC = {
  "phresh-smoothie": [
    "PS MENU.png",
    "Eat Phresh Button 3.png",
    "How to button PS.png",
    "setting button.png",
  ],
};

const SKIP_DIRS = new Set(["node_modules", ".git", "Public", "scripts", ".claude", "dist"]);

const slug = process.argv[2];
if (!slug) {
  console.error("usage: npm run game:sync -- <slug> [source-dir]");
  process.exit(1);
}

const srcDir = path.resolve(
  process.argv[3] || path.join(PROJECTS_ROOT, SOURCE_DIRS[slug] || slug)
);
const destDir = path.join(DEST_ROOT, slug);

if (!existsSync(path.join(srcDir, "index.html"))) {
  console.error(`✗ no index.html in ${srcDir} — is that the game's root folder?`);
  process.exit(1);
}

async function du(dir) {
  let total = 0;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) total += await du(p);
    else total += (await stat(p)).size;
  }
  return total;
}

const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`;

console.log(`⟳ syncing ${slug}\n  from ${srcDir}\n  to   ${destDir}`);

await rm(destDir, { recursive: true, force: true });
await mkdir(destDir, { recursive: true });

// 1. Everything the game needs, minus heavy/unused source folders.
for (const entry of await readdir(srcDir, { withFileTypes: true })) {
  if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
  if (entry.name.startsWith(".") && entry.name !== ".well-known") continue;
  await cp(path.join(srcDir, entry.name), path.join(destDir, entry.name), {
    recursive: true,
  });
}

// 2. The runtime-referenced source art from Public/ (allowlist).
const keep = KEEP_PUBLIC[slug] || [];
if (keep.length) {
  await mkdir(path.join(destDir, "Public"), { recursive: true });
  for (const name of keep) {
    const from = path.join(srcDir, "Public", name);
    if (!existsSync(from)) {
      console.warn(`  ! missing runtime asset: Public/${name}`);
      continue;
    }
    await cp(from, path.join(destDir, "Public", name));
  }
  console.log(`  · Public/: kept ${keep.length} runtime image(s), skipped source sheets`);
}

// 3. Bust the browser cache on every sync (the iframe URL is what users load).
const indexFile = path.join(destDir, "index.html");
const html = await import("node:fs/promises").then((fs) =>
  fs.readFile(indexFile, "utf8")
);
if (!html.includes("pt-game-meta")) {
  await writeFile(
    indexFile,
    html.replace(
      "</head>",
      `  <!-- pt-game-meta -->\n  <meta name="color-scheme" content="dark" />\n</head>`
    )
  );
}

console.log(`✓ synced → public/games/${slug} (${mb(await du(destDir))})`);
console.log(`  serve path: /games/${slug}/index.html`);
