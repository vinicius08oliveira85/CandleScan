import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

let app;

function resolveBundlePath() {
  const candidates = [
    path.join(__dirname, "server.cjs"),
    path.join(__dirname, "../dist/server.cjs"),
    path.join(process.cwd(), "dist/server.cjs"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error(
    `Bundle não encontrado. Caminhos testados: ${candidates.join(" | ")}`
  );
}

function loadApp() {
  if (!app) {
    app = require(resolveBundlePath());
  }
  return app;
}

export default function handler(req, res) {
  try {
    const expressApp = loadApp();
    return expressApp(req, res);
  } catch (err) {
    console.error("BOOT_ERROR api/analyze-live:", err);
    return res.status(500).json({
      error: `Falha ao iniciar o backend: ${err.message}`,
      code: "BOOT_ERROR",
    });
  }
}
