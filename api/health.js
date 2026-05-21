/** Health check leve — sempre 200; indica se há chave no ambiente do servidor. */
function getModelList() {
  const primary = (process.env.GEMINI_MODEL || "").trim();
  const csv = (process.env.GEMINI_MODEL_FALLBACK || "").trim();
  const defaults = ["gemini-2.5-flash", "gemini-2.0-flash-lite", "gemini-2.5-flash-lite"];
  const fromEnv = csv
    ? csv.split(",").map((m) => m.trim()).filter(Boolean)
    : defaults;
  const list = [];
  if (primary) list.push(primary);
  for (const m of fromEnv) {
    if (!list.includes(m)) list.push(m);
  }
  if (list.length === 0) list.push(...defaults);
  return list;
}

export default function handler(req, res) {
  try {
    if (req.method !== "GET" && req.method !== "HEAD") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const envKey = (process.env.GEMINI_API_KEY || "").trim();
    const models = getModelList();

    return res.status(200).json({
      ok: true,
      geminiConfigured: !!envKey,
      vercelEnv: process.env.VERCEL_ENV || "unknown",
      runtime: "standalone-esm",
      defaultModel: models[0],
      fallbackModels: models.slice(1),
    });
  } catch (err) {
    const models = getModelList();
    return res.status(200).json({
      ok: true,
      geminiConfigured: false,
      vercelEnv: "unknown",
      runtime: "standalone-esm",
      defaultModel: models[0],
      fallbackModels: models.slice(1),
      warning: err.message,
    });
  }
}
