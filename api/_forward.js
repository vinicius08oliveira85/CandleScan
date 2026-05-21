/**
 * Encaminha requisições Vercel (path relativo à função) para rotas do Express.
 */
function createForwarder(expressPath) {
  const app = require("../dist/server.cjs");

  return function handler(req, res) {
    const query =
      req.url && req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
    req.url = expressPath + query;
    return app(req, res);
  };
}

module.exports = { createForwarder };
