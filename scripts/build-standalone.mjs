/**
 * Baut die App zu einer einzigen HTML-Datei.
 *
 * Ergebnis: dist/base-editing-labor.html – läuft in jedem Browser ohne Server,
 * ohne Installation und ohne Netzverbindung. Praktisch zum Weitergeben, zum
 * Öffnen auf dem iPad oder als Beleg für eine Abgabe.
 *
 * Aufruf: npm run build:standalone
 */

import { execFile } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import * as esbuild from "esbuild";

const run = promisify(execFile);
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const temp = join(root, ".standalone-build");
const outFile = join(root, "dist", "base-editing-labor.html");

const TITLE = "Base-Editing-Labor";
const DESCRIPTION =
  "Interaktive Biologie-App zum gezielten Austausch eines einzelnen Basenpaares: " +
  "3D-Doppelhelix, Base- und Prime-Editoren, neun Fälle vom Heilen bis zum Verbessern.";

/** Ein Zeichen, das ein Script-Tag vorzeitig beenden könnte, muss maskiert werden. */
function escapeForScript(code) {
  return code.replaceAll("</script", "<\\/script").replaceAll("<!--", "<\\!--");
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function main() {
  await rm(temp, { recursive: true, force: true });
  await mkdir(temp, { recursive: true });
  await mkdir(dirname(outFile), { recursive: true });

  console.log("Tailwind übersetzen …");
  await run(
    "npx",
    ["@tailwindcss/cli", "-i", "standalone/styles.css", "-o", join(temp, "styles.css"), "--minify"],
    { cwd: root },
  );

  console.log("JavaScript bündeln …");
  await esbuild.build({
    entryPoints: [join(root, "standalone", "main.tsx")],
    bundle: true,
    minify: true,
    format: "iife",
    target: ["safari16", "chrome109", "firefox115"],
    jsx: "automatic",
    tsconfig: join(root, "tsconfig.json"),
    define: { "process.env.NODE_ENV": '"production"' },
    alias: { "next/dynamic": join(root, "standalone", "next-dynamic.tsx") },
    outfile: join(temp, "app.js"),
    legalComments: "none",
    logLevel: "warning",
  });

  const css = await readFile(join(temp, "styles.css"), "utf8");
  const js = await readFile(join(temp, "app.js"), "utf8");

  const html = `<title>${escapeHtml(TITLE)}</title>
<meta name="description" content="${escapeHtml(DESCRIPTION)}">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#020617">
<style>${css}</style>
<div id="app"></div>
<script>${escapeForScript(js)}</script>
`;

  await writeFile(outFile, html, "utf8");
  await rm(temp, { recursive: true, force: true });

  const kb = (Buffer.byteLength(html, "utf8") / 1024).toFixed(0);
  console.log(`Fertig: ${outFile} (${kb} kB)`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
