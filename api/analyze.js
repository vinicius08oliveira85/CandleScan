let app;

function loadApp() {
  if (!app) {
    const path = require("path");
    const fs = require("fs");
    const bundlePath = path.join(__dirname, "../dist/server.cjs");

    if (!fs.existsSync(bundlePath)) {
      throw new Error(
        `Bundle não encontrado em ${bundlePath}. O build da Vercel precisa gerar dist/server.cjs.`
      );
    }

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
