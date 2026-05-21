import express from 'express';
import dotenv from 'dotenv';
import {
  resolveGeminiApiKey,
  getGeminiClient,
  buildGeminiParts,
  generateGeminiJson,
  getGeminiModelList,
  DEFAULT_GEMINI_MODEL,
  CHART_ANALYSIS_SCHEMA,
  MULTI_ANALYSIS_SCHEMA,
} from './shared/geminiSchemas';
import { geminiErrorResponseBody } from './shared/geminiErrors';

try {
  dotenv.config({ path: '.env.local' });
} catch {
  /* ok */
}

const app = express();
const port = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const SYSTEM_INSTRUCTION = `Você é um analista profissional de trading amigável e focado em EXPLICAR DE FORMA SIMPLES para iniciantes e leigos.
Sua função é analisar imagens (prints de gráficos de velas/candles enviados pelo usuário) e fornecer uma avaliação extremamente clara, prática e didática sobre o momento atual do preço do ativo.

PRIORIDADE MÁXIMA — SEGURANÇA DO VALOR:
- Proteger o capital vem antes de buscar lucro agressivo.
- Sem dadosCompra: comentarioAnalista OBRIGATÓRIO no formato EXATO:
  "Se perder, você perde [valor ou % aproximado]; se ganhar, você ganha [valor ou % aproximado]."
- Com dadosCompra: comentarioAnalista OBRIGATÓRIO no formato EXATO:
  "Você comprou a [precoEntrada formatado], o preço está em [precoAtualEstimado]. Seu lucro/prejuízo atual é de [valor aproximado em R$ ou %]. Recomendo [statusTrade em linguagem simples] porque [motivo técnico lúdico]."

ATENÇÃO: Nunca invente dados que não estejam claramente visíveis na tela do gráfico.`;

const MULTI_SYSTEM_INSTRUCTION = `Você é um analista profissional de trading amigável para iniciantes.
Analise dois prints: M5 (lupa) e M15 (binóculo) do MESMO ativo. Use linguagem lúdica.`;

app.get('/api/health', (_req, res) => {
  const models = getGeminiModelList();
  res.status(200).json({
    ok: true,
    geminiConfigured: !!resolveGeminiApiKey(),
    vercelEnv: process.env.VERCEL_ENV || 'local',
    defaultModel: DEFAULT_GEMINI_MODEL,
    fallbackModels: models.slice(1),
  });
});

app.post('/api/analyze', async (req, res) => {
  try {
    const { images, dadosCompra, apiKey } = req.body;
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'Nenhuma imagem foi recebida para análise técnica.' });
    }

    const aiInstance = getGeminiClient(apiKey);

    let promptText = 'Por favor, faça uma análise técnica minuciosa deste gráfico de candles enviado. ';
    if (images.length > 1) {
      promptText += `Você recebeu ${images.length} prints em ORDEM CRONOLÓGICA. O último é o momento ATUAL.`;
    }
    if (dadosCompra?.precoEntrada && dadosCompra?.quantidade) {
      const op =
        dadosCompra.tipoOperacao === 'venda' ? 'vendeu' : 'comprou';
      promptText += ` MODO GERENTE DE TRADE: ${op} a ${dadosCompra.precoEntrada}, quantidade ${dadosCompra.quantidade}. Manter esse preço de entrada nas janelas seguintes.`;
    }

    const parts = buildGeminiParts(promptText, images);
    const textOutput = await generateGeminiJson(
      aiInstance,
      SYSTEM_INSTRUCTION,
      parts,
      CHART_ANALYSIS_SCHEMA
    );

    const parsed = JSON.parse(textOutput.trim());
    return res.json(parsed);
  } catch (err: unknown) {
    console.error('Erro na rota /api/analyze:', err);
    const { httpStatus, payload } = geminiErrorResponseBody(err);
    return res.status(httpStatus).json(payload);
  }
});

app.post('/api/analyze-multi', async (req, res) => {
  try {
    const { m5Image, m15Image, apiKey } = req.body;
    if (!m5Image || !m15Image) {
      return res.status(400).json({ error: 'Ambos os gráficos M5 e M15 são obrigatórios.' });
    }

    const aiInstance = getGeminiClient(apiKey);
    const promptText =
      'Analise estes dois gráficos: primeiro M5, depois M15. Integre as duas leituras.';

    const parts = buildGeminiParts(promptText, [
      { data: m5Image, mimeType: 'image/png' },
      { data: m15Image, mimeType: 'image/png' },
    ]);

    const textOutput = await generateGeminiJson(
      aiInstance,
      MULTI_SYSTEM_INSTRUCTION,
      parts,
      MULTI_ANALYSIS_SCHEMA
    );

    const parsed = JSON.parse(textOutput.trim());
    return res.json(parsed);
  } catch (err: unknown) {
    console.error('Erro na rota /api/analyze-multi:', err);
    const { httpStatus, payload } = geminiErrorResponseBody(err);
    return res.status(httpStatus).json(payload);
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
