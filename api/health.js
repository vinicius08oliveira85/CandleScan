/** Health check leve — sempre 200; indica se há chave no ambiente do servidor. */
export default function handler(req, res) {
  try {
    if (req.method !== "GET" && req.method !== "HEAD") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const envKey = (process.env.GEMINI_API_KEY || "").trim();

    return res.status(200).json({
      ok: true,
      geminiConfigured: !!envKey,
      vercelEnv: process.env.VERCEL_ENV || "unknown",
      runtime: "standalone-esm",
    });
  } catch (err) {
    return res.status(200).json({
      ok: true,
      geminiConfigured: false,
      vercelEnv: "unknown",
      runtime: "standalone-esm",
      warning: err.message,
    });
  }
}
