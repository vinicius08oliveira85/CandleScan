/**
 * Entrada serverless na Vercel — encaminha /api/* para o Express em dist/server.cjs
 * (gerado por npm run build). Requer vercel-build antes do deploy.
 */
const app = require("../dist/server.cjs");

module.exports = app;
