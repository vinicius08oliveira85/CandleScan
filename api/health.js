/** Health check leve — não depende do bundle Express (evita 500 no cold start). */
module.exports = (req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const envKey = (process.env.GEMINI_API_KEY || "").trim();

  return res.status(200).json({
    ok: true,
    geminiConfigured: !!envKey,
    vercelEnv: process.env.VERCEL_ENV || "unknown",
    runtime: "standalone",
  });
};
