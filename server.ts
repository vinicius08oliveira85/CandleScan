import express from 'express';
import path from 'path';
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
import {
  LIVE_ANALYSIS_SYSTEM_INSTRUCTION,
  buildLiveAnalysisPrompt,
  buildCandleTimeLabelsFromMt5,
  timeframeLabel,
} from './shared/analyzeLive';

try {
  dotenv.config({ path: '.env.local' });
} catch {
  /* ambiente serverless */
}
// dotenv.config(); // Removido para evitar reconfiguração desnecessária, .env.local já tem precedência.

const app = express();
const port = 3000;

// Setup JSON body parsing with plenty of room for screenshots
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const SYSTEM_INSTRUCTION = `Você é um analista profissional de trading amigável e focado em EXPLICAR DE FORMA SIMPLES para iniciantes e leigos.
Sua função é analisar imagens (prints de gráficos de velas/candles enviados pelo usuário) e fornecer uma avaliação extremamente clara, prática e didática sobre o momento atual do preço do ativo.

PRIORIDADE MÁXIMA — SEGURANÇA DO VALOR:
- Proteger o capital do investidor vem antes de buscar lucro agressivo.
- Sempre defina um stop loss realista e nunca incentive operar sem limite de perda.
- Se a relação risco/retorno for fraca (ganho menor que o risco), recomende "Aguardar" ou reduzir tamanho da posição.
- Sem dadosCompra: no comentarioAnalista inclua OBRIGATORIAMENTE e no formato EXATO:
  "Se perder, você perde [valor ou % aproximado]; se ganhar, você ganha [valor ou % aproximado]."
  Use entrada, stop e alvo sugeridos para calcular os valores.

Siga rigorosamente estas diretrizes ao analisar a imagem do gráfico:
1. Identifique a Direção Principal do Preço (Tendência):
   - Alta (Subindo)
   - Baixa (Caindo)
   - Lateral (Sem rumo, andando de lado)
2. Explique os desenhos das velas (Candles) recentes de forma simples e intuitiva para leigos usando analogias e comparações fáceis do cotidiano:
   - Apresente as velas como um cabo de guerra: "Cada vela é uma disputa de força entre o Time Verde (Compradores, que empurram o preço para cima) e o Time Vermelho (Vendedores, que empurram para baixo)".
   - Explique o "Corpo" (a parte gordinha e pintada da vela) como impulso e pressa: "Um corpo verde gordinho significa que o Time Verde correu livre com a bola para cima. Um corpo vermelho gordinho mostra que o Time Vermelho dominou e empurrou com muita pressa para baixo".
   - Explique a "Sombra" ou "Pavio" (as linhas finas nas pontas das velas) como uma mola de empurrão ou rejeição: "A linha fina no topo ou fundo mostra que o preço tentou ir até lá, mas o outro time usou uma mola invisível para empurrá-lo de volta com força (isso se chama rejeição, mostrando que aquela região ficou cara ou barata demais). Um martelo é como um elástico que tentou esticar para baixo e voltou com tudo".
   - Explique o "Doji" (vela em formato de cruz (+) com corpo quase nulo) como um empate total: "Doji é aquela velinha que parece uma cruz ou um hífen. Ela indica um empate perfeito no cabo de guerra, onde nenhum dos dois times conseguiu vencer o cabo, refletindo total dúvida e indecisão no mercado".
   - Explique o "Engolfo" (uma vela grande que cobre totalmente a anterior) como um herói engolindo o rival: "É quando uma nova vela surge gigante e 'engole' a vela anterior inteira, mostrando um nocaute ou domínio absoluto e repentino daquele time".
   - Explique o "Martelo" (Hammer) como uma mola de recuperação no fundo: "Tem um corpinho pequeno no topo e uma perninha longa para baixo. Mostra que o time vermelho chutou o preço para baixo, mas o time verde pegou um bastão pesado de mola e rebateu com tudo de volta antes do horário fechar. Isso indica força compradora no chão e chance de decolar para cima".
   - Explique a "Estrela Cadente" (Shooting Star) como um balão que estourou no teto: "Tem um corpinho pequeno embaixo e um pavio longo espetado para cima. Mostra que o preço tentou decolar como um foguete, mas bateu com a cabeça em um teto e caiu de volta. Isso indica fraqueza dos compradores e chance de despencar ladeira abaixo".
   - Explique o "Pião" (Spinning Top) como o pião de brinquedo zonzo: "É aquela vela com corpinho super pequeno bem no centro e pavios compridos simétricos para cima e para baixo. Mostra que o preço rodou feito pião tonto sem saber para onde ir, com compradores e vendedores exaustos. Indica indecisão extrema e que ninguém manda no preço no momento".
3. Identifique as barreiras de preço chaves de forma descomplicada e 100% focado em analogias do cotidiano (Evite ao máximo palavras técnicas como "médias móveis", "médias ponderadas" ou "níveis"):
   - Suporte: Apresente estritamente como "o chão que impede o preço de cair mais de onde ele está" (como um piso resistente onde o preço pisa e ganha apoio para subir).
   - Resistência: Apresente estritamente como "o teto que impede o preço de subir mais de onde ele está" (como uma laje rígida de concreto onde o preço bate a cabeça e é empurrado para baixo).
   - Detecção de Rompimento: Verifique se há um rompimento recente (preço racha e fura o chão de vez desabando em queda livre, ou racha e fura o teto de vez decolando alto).
4. Avalie o ritmo / momento do mercado de forma simplista (Forte, fraco, indeciso, ou possível mudança de direção).
5. Defina cenários fáceis de prever para as próximas horas (Cenário Provável).
6. Recomende uma ação direta e muito amigável: "Comprar", "Vender" ou "Aguardar (Melhor não fazer nada agora)".
7. Dê a estratégia mastigada para o iniciante apresentando os 'Tipos de Entrada' como 'Tipos de Terreno' lúdicos que você encontra sob os seus pés no gráfico:
   - Rompimento de Suporte (Support Breakout): Apresente como "Entrar em terreno plano depois que o chão rachou e desabou de vez" (o preço quebrou a base de apoio e despencará livre).
   - Rompimento de Resistência (Resistance Breakout): Apresente como "Entrar em terreno aberto livre depois que o teto rachou e foi estourado para cima" (o preço quebrou o limite de teto e disparará livre).
   - Pullback de Retração: Apresente como "Pisar de leve no chão recém-testado após o preço recuar para checar a segurança das fundações" (o preço volta a escorregar para testar a estabilidade do novo chão ou novo teto).
   - Reversão de Forças: Apresente como "Subir ou descer a encosta íngreme exatamente quando o vento muda de lado repentinamente" (o preço cansou de subir e vira ladeira abaixo, ou cansou de cair e decola ladeira acima).
   - Sem Entrada: Apresente como "Pântano de areia movediça sem direção confiável (Melhor não pisar agora)"
   - Ponto ideal de entrada (Qual preço aproximado comprar/vender)
   - Limite de Segurança (Stop loss): Explique como "O seu ESCUDO DE PROTEÇÃO. Se o preço tocar aqui, saímos para proteger seu dinheiro."
   - Alvo de Ganho (Take profit): Explique como "O seu TROFÉU DE VITÓRIA. Aqui é onde colocamos o lucro no bolso e encerramos o dia feliz."
   - Relação Risco/Retorno: Calcule mentalmente se o ganho potencial supera o risco (ex: "1:2,5 — ganho vale o dobro do risco").
8. Nível de Confiança (nivelConfianca) — OBRIGATÓRIO e baseado na NITIDEZ VISUAL:
   - Alto: candles, eixo de preços e níveis estão nítidos e legíveis na imagem; padrões são claros.
   - Médio: imagem aceitável, mas com alguma compressão, zoom ou sobreposição que dificulta leitura fina.
   - Baixo: print borrado, cortado, muito pequeno ou com elementos que impedem ler velas e preços com segurança.
   - Nunca atribua "Alto" se a nitidez visual dos candles for duvidosa.
9. Classifique se há um rompimento de suporte ou resistência e comente sobre o mesmo.
10. Dados do Gráfico para Reconstrução Visual — OBRIGATÓRIO (mesma escala do print):
   - syntheticCandles: exatamente 10 velas visíveis, da esquerda para a direita (última = mais recente).
   - Cada OHLC deve estar na MOEDA REAL do ativo (R$ ou $), na MESMA escala numérica de pontoEntrada, stopLoss, alvo, suporte e resistência.
   - Leia os valores no eixo Y do print: eixoPrecoMin = menor preço visível no eixo; eixoPrecoMax = maior preço visível no eixo.
   - candleTimeLabels: 10 rótulos do eixo X (ex: "16:26", "16:31", …); o último deve ser "Agora" quando for a vela atual.
   - PROIBIDO usar escala 0–100 ou 0–150 abstrata quando o ativo custa dezenas de reais/dólares no print.
   - Regras: high >= max(open, close); low <= min(open, close); preserve direção, tamanho de corpo e pavios.
   - Não invente velas fora da tela.
11. Formatação de Preços de Operação (pontoEntrada, stopLoss, alvo) — OBRIGATÓRIO:
   - Estrutura fixa: VALOR NUMÉRICO PURO primeiro, depois explicação lúdica breve entre parênteses.
   - Ativos brasileiros (B3): "R$ X,XX (explicação curta)" — ex: "R$ 4,28 (pisar no chão recém-testado)".
   - Ativos em dólar: "$X.XX (explicação curta)" — ex: "$58,50 (vender no reteste do teto)".
   - PROIBIDO começar com frases longas; o primeiro caractere legível deve ser R$, $ ou o dígito do preço.
   - Stop loss: use analogia de escudo/cinto — ex: "R$ 4,22 (seu escudo se o preço despencar)".
   - Alvo: use analogia de troféu/lucro — ex: "$4,38 (troféu: colocar lucro no bolso)".
12. Relação Risco/Retorno (relacaoRiscoRetorno) — OBRIGATÓRIO:
   - Formato curto: "1:X — [viável / equilibrada / fraca]" com base na distância entre entrada, stop e alvo visíveis no gráfico.
   - Exemplo: "1:2,3 — viável (ganho maior que o risco)" ou "1:0,8 — fraca (risco maior que o ganho)".

MODO GERENTE DE TRADE (quando o usuário informar dadosCompra com precoEntrada e quantidade):
- Você deixa de ser apenas analista e passa a ser GERENTE DE TRADE da posição já aberta.
- Compare o gráfico ATUAL (último print, se houver vários) com o preço que o investidor PAGOU (precoEntrada).
- Leia precoAtualEstimado do eixo ou do último candle visível no print mais recente.
- Defina statusTrade com UMA destas opções exatas: "MANTER", "VENDER AGORA", "REALIZAR PARCIAL" ou "STOP ATIVADO".
  - MANTER: tendência ainda favorável e preço acima do stop sugerido.
  - VENDER AGORA: sinais técnicos de fraqueza, reversão ou alvo atingido.
  - REALIZAR PARCIAL: lucro parcial bom, mas ainda há espaço — sugira travar parte do ganho.
  - STOP ATIVADO: preço rompeu ou está muito próximo do stop loss da operação.
- No comentarioAnalista, OBRIGATÓRIO incluir frase no formato EXATO:
  "Você comprou a [precoEntrada formatado], o preço está em [precoAtualEstimado]. Seu lucro/prejuízo atual é de [valor aproximado em R$ ou %]. Recomendo [statusTrade em linguagem simples] porque [motivo técnico lúdico]."
- acaoRecomendada deve refletir a gestão da posição (ex: se statusTrade for VENDER AGORA, tende a "Vender").

EVOLUÇÃO DE PRINTS (múltiplas imagens em ordem):
- As imagens chegam em ORDEM CRONOLÓGICA: a primeira é o passado, a última é o AGORA.
- Descreva brevemente como o preço evoluiu entre os prints antes de dar a recomendação final.

ATENÇÃO: Nunca invente dados que não estejam claramente visíveis na tela do gráfico. Use uma comunicação calorosa, empática, parecendo um professor paciente ensinando uma pessoa querida do zero.`;

const healthHandler = (_req: express.Request, res: express.Response) => {
  const models = getGeminiModelList();
  res.status(200).json({
    ok: true,
    geminiConfigured: !!resolveGeminiApiKey(),
    vercelEnv: process.env.VERCEL_ENV || 'local',
    defaultModel: DEFAULT_GEMINI_MODEL,
    fallbackModels: models.slice(1),
  });
};

app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// API Endpoint to analyze screenshots of charts
const analyzeHandler = async (req: express.Request, res: express.Response) => {
  try {
    const { images, dadosCompra, apiKey } = req.body;
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'Nenhuma imagem foi recebida para análise técnica.' });
    }

    const aiInstance = getGeminiClient(apiKey);

    let promptText = 'Por favor, faça uma análise técnica minuciosa deste gráfico de candles enviado. ';
    if (images.length > 1) {
      promptText += `Você recebeu ${images.length} prints do MESMO ativo em ORDEM CRONOLÓGICA (do mais antigo ao mais recente). O ÚLTIMO print é o momento ATUAL do mercado. Compare a evolução do preço entre eles antes de recomendar.`;
    }
    if (dadosCompra?.precoEntrada && dadosCompra?.quantidade) {
      const op =
        dadosCompra.tipoOperacao === 'venda' ? 'vendeu (posição vendida)' : 'comprou (posição comprada)';
      promptText += ` MODO GERENTE DE TRADE ATIVO: o investidor ${op} a ${dadosCompra.precoEntrada} com quantidade ${dadosCompra.quantidade}. Esse preço de entrada deve ser mantido como referência da operação original, mesmo com prints novos. Compare o gráfico atual com esse preço, preencha statusTrade e use o formato obrigatório no comentarioAnalista.`;
    }

    const parts = buildGeminiParts(promptText, images);
    const textOutput = await generateGeminiJson(
      aiInstance,
      SYSTEM_INSTRUCTION,
      parts,
      CHART_ANALYSIS_SCHEMA
    );
    if (!textOutput) {
      throw new Error('O modelo Gemini de inteligência artificial retornou uma resposta vazia.');
    }

    try {
      const parsed = JSON.parse(textOutput.trim());
      return res.json(parsed);
    } catch (parseError) {
      console.error('Falha ao analisar JSON retornado pelo Gemini:', textOutput, parseError);
      return res.status(500).json({ 
        error: 'Resposta do modelo não pôde ser convertida para uma estrutura de dados válida.',
        raw: textOutput 
      });
    }

  } catch (err: unknown) {
    console.error('Erro na rota /api/analyze:', err);
    const { httpStatus, payload } = geminiErrorResponseBody(err);
    return res.status(httpStatus).json(payload);
  }
};

app.post('/api/analyze', analyzeHandler);
app.post('/analyze', analyzeHandler);

const analyzeLiveHandler = async (req: express.Request, res: express.Response) => {
  try {
    const { symbol, timeframe, candles, precoAtual, dadosCompra, apiKey } = req.body as {
      symbol?: string;
      timeframe?: string;
      candles?: { open: number; high: number; low: number; close: number; time?: number }[];
      precoAtual?: number;
      dadosCompra?: { precoEntrada: number; quantidade: number; tipoOperacao?: string };
      apiKey?: string;
    };

    if (!symbol?.trim()) {
      return res.status(400).json({ error: 'Símbolo MT5 obrigatório.' });
    }
    if (!candles || !Array.isArray(candles) || candles.length < 2) {
      return res.status(400).json({ error: 'Envie pelo menos 2 candles OHLC do MT5.' });
    }

    const tf = (timeframe || 'M5').trim();
    const slice = candles.slice(-10);
    const aiInstance = getGeminiClient(apiKey);
    const promptText = buildLiveAnalysisPrompt(
      symbol.trim(),
      tf,
      slice,
      precoAtual ?? null,
      dadosCompra
    );

    const parts = buildGeminiParts(promptText, []);
    const textOutput = await generateGeminiJson(
      aiInstance,
      LIVE_ANALYSIS_SYSTEM_INSTRUCTION,
      parts,
      CHART_ANALYSIS_SCHEMA
    );

    if (!textOutput) {
      throw new Error('Resposta vazia do Gemini na análise MT5.');
    }

    const parsed = JSON.parse(textOutput.trim()) as Record<string, unknown>;
    parsed.syntheticCandles = slice;
    parsed.candleTimeLabels = buildCandleTimeLabelsFromMt5(slice);
    parsed.ativoCooptado = symbol.trim();
    parsed.tempoGrafico = timeframeLabel(tf);
    parsed.graficoReferenciaEm = new Date().toISOString();
    if (precoAtual != null && Number.isFinite(precoAtual)) {
      const brl = !symbol.includes('.') && !symbol.startsWith('#');
      parsed.precoAtualEstimado = brl
        ? `R$ ${precoAtual.toFixed(2).replace('.', ',')}`
        : `$${precoAtual.toFixed(2)}`;
    }

    return res.json(parsed);
  } catch (err: unknown) {
    console.error('Erro na rota /api/analyze-live:', err);
    const { httpStatus, payload } = geminiErrorResponseBody(err);
    return res.status(httpStatus).json(payload);
  }
};

app.post('/api/analyze-live', analyzeLiveHandler);
app.post('/analyze-live', analyzeLiveHandler);

const MULTI_SYSTEM_INSTRUCTION = `Você é um analista profissional de trading amigável e focado em EXPLICAR DE FORMA SIMPLES para iniciantes e leigos.
Sua função é analisar dois prints de gráficos simultaneamente: um gráfico de 5 minutos (M5) e um de 15 minutos (M15) do MESMO ativo financeiro.
Você deve explicar detalhadamente como esses dois tempos gráficos se complementam ou contrastam para orientar o trader iniciante na tomada de decisão.

Para a explicação:
- Apresente o gráfico de 15 minutos como o "Binóculo" do mercado: ele dá o panorama geral, a maré macro, mostrando para onde a maré maior está empurrando o preço.
- Apresente o gráfico de 5 minutos como a "Lupa": ele foca nos detalhes microscópicos, nos galhos, mostrando o preço exato de desconto ou os primeiros sinais de fadiga e viradas de curto prazo.
- Explique se as tendências estão alinhadas (M5 e M15 na mesma direção) ou divergentes (ex: M15 subindo e M5 respirando/caindo para retestar suporte, o que configura compra de desconto).
- Use linguagem extremamente lúdica, recorrendo às analogias dos lances de cabo de guerra (Time Verde vs Time Vermelho), molas e colchões (piso/suporte e teto/resistência).`;

app.post('/api/analyze-multi', async (req, res) => {
  try {
    const { m5Image, m15Image, apiKey } = req.body;
    if (!m5Image || !m15Image) {
      return res.status(400).json({ error: 'Ambos os gráficos de M5 e M15 são obrigatórios para a análise simultânea.' });
    }

    const aiInstance = getGeminiClient(apiKey);

    const promptText =
      'Por favor, analise simultaneamente estes dois gráficos do mesmo ativo: o primeiro é de 5 minutos (M5) e o segundo é de 15 minutos (M15). Produza uma comparação side-by-side integrando as duas perspectivas.';

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
    if (!textOutput) {
      throw new Error('O modelo Gemini de inteligência artificial retornou uma resposta vazia na análise multi-tempo.');
    }

    try {
      const parsed = JSON.parse(textOutput.trim());
      return res.json(parsed);
    } catch (parseError) {
      console.error('Falha ao analisar JSON retornado pelo Gemini no multi-tempo:', textOutput, parseError);
      return res.status(500).json({ 
        error: 'Resposta do modelo não pôde ser convertida para uma estrutura de dados de multi-tempo.',
        raw: textOutput 
      });
    }
  } catch (err: unknown) {
    console.error('Erro na rota /api/analyze-multi:', err);
    const { httpStatus, payload } = geminiErrorResponseBody(err);
    return res.status(httpStatus).json(payload);
  }
});

const isVercelRuntime = !!(process.env.VERCEL || process.env.VERCEL_ENV);

// Em produção local, serve o frontend estático; na Vercel o static-build cuida disso.
if (!isVercelRuntime) {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

if (!isVercelRuntime) {
  app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });
}

export = app;
