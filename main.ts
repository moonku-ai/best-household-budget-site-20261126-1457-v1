// DompetKeluarga — program penyerahan (Node 22, standard library saja).
//
// Situsnya adalah file statis di app/ (index.html + CSS + modul JS, tanpa build
// step dan tanpa satu pun request jaringan). Program ini menyerahkan situs itu
// ke make.fun: menyalin app/ dan screenshots/ dari samping file ini ke direktori
// keluaran, lalu menulis dossier.json dengan pustaka make.fun yang tervendor
// di vendor/.
//
// Di luar grader, MAKEFUN_OUTPUT_DIR menggantikan /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Mulai dari keluaran kosong supaya dua kali jalan menghasilkan byte yang sama.
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
