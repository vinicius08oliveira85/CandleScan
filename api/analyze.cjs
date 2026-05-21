const path = require("path");
const fs = require("fs");

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
    const bundlePath = resolveBundlePath();
    app = require(bundlePath);
  }
  return app;
}

module.exports = (req, res) => {
  try {
    const expressApp = loadApp();
    return expressApp(req, res);
  } catch (err) {
    console.error("BOOT_ERROR api/analyze:", err);
    return res.status(500).json({
      error: `Falha ao iniciar o backend: ${err.message}`,
      code: "BOOT_ERROR",
    });
  }
};
