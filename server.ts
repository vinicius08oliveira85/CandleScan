import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
// dotenv.config(); // Removido para evitar reconfiguração desnecessária, .env.local já tem precedência.

const app = express();
const port = 3000;

// Setup JSON body parsing with plenty of room for screenshots
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

/** Prioridade: chave do usuário (body) > GEMINI_API_KEY do ambiente */
function resolveGeminiApiKey(userApiKey?: string): string {
  return (userApiKey?.trim() || process.env.GEMINI_API_KEY || '').trim();
}

function getGemini(userApiKey?: string): GoogleGenAI {
  const key = resolveGeminiApiKey(userApiKey);
  if (!key) {
    const err = new Error(
      'Nenhuma chave API do Gemini encontrada. Abra Configurações no app e cole sua chave, ou defina GEMINI_API_KEY na Vercel.'
    ) as Error & { code?: string };
    err.code = 'MISSING_API_KEY';
    throw err;
  }
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

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
10. Dados Sintéticos para Visualização (syntheticCandles) — OBRIGATÓRIO:
   - Identifique os 10 últimos candles visíveis no gráfico, da esquerda para a direita (o último item do array é o candle mais recente).
   - Extraia valores OHLC numéricos proporcionais ao movimento real: se o eixo de preços estiver legível, use esses valores; caso contrário, construa uma escala relativa coerente preservando amplitude, direção e proporção corpo/pavio de cada vela.
   - Regras matemáticas: high >= max(open, close); low <= min(open, close); a sequência deve refletir a tendência e o momento identificados.
   - Não invente velas invisíveis. Retorne exatamente 10 objetos { open, high, low, close }.
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

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    geminiConfigured: !!resolveGeminiApiKey(),
  });
});

// API Endpoint to analyze screenshots of charts
app.post('/api/analyze', async (req, res) => {
  try {
    const { images, dadosCompra, apiKey } = req.body;
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'Nenhuma imagem foi recebida para análise técnica.' });
    }

    const aiInstance = getGemini(apiKey);

    // Prepare content parts for Gemini
    const contents: any[] = [];
    
    // Add text prompt giving instructions and context
    let promptText = 'Por favor, faça uma análise técnica minuciosa deste gráfico de candles enviado. ';
    if (images.length > 1) {
      promptText += `Você recebeu ${images.length} prints do MESMO ativo em ORDEM CRONOLÓGICA (do mais antigo ao mais recente). O ÚLTIMO print é o momento ATUAL do mercado. Compare a evolução do preço entre eles antes de recomendar.`;
    }
    if (dadosCompra?.precoEntrada && dadosCompra?.quantidade) {
      promptText += ` MODO GERENTE DE TRADE ATIVO: o investidor comprou a ${dadosCompra.precoEntrada} com quantidade ${dadosCompra.quantidade}. Compare o gráfico atual com esse preço pago, preencha statusTrade e use o formato obrigatório no comentarioAnalista.`;
    }
    contents.push({ text: promptText });

    // Append multiple base64 images as parts if supplied
    for (const img of images) {
      if (!img.data || !img.mimeType) {
        continue;
      }
      
      // Clean prefix if present in the base64 string
      const cleanData = img.data.replace(/^data:image\/\w+;base64,/, '');
      
      contents.push({
        inlineData: {
          data: cleanData,
          mimeType: img.mimeType
        }
      });
    }

    // Call Gemini with schema configuration
    const response = await aiInstance.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: { parts: contents },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ativoCooptado: { type: Type.STRING, description: "Ticker ou nome do ativo detectado no gráfico (ex: CSED3, PETR4, EUR/USD), ou 'Não detectado'" },
            tempoGrafico: { type: Type.STRING, description: "Tempo gráfico detectado (ex: 15 Minutos, 5 Minutos, Diário), ou 'Não detectado'" },
            tendencia: { type: Type.STRING, description: 'Tendência principal observada: Alta, Baixa ou Lateral' },
            momento: { type: Type.STRING, description: 'Momento do mercado: Forte, fraco, indeciso, reversão possível' },
            leituraCandles: { type: Type.STRING, description: 'Explicação dos candles recentes de forma lúdica e ultra simples sobre as forças do mercado (usando as analogias descritas de cabo de guerra entre Time Verde e Time Vermelho, molas de empurrão, empates, etc. para leigos).' },
            suporte: { type: Type.STRING, description: "Explicação simples do Suporte focado em ser o 'chão que impede o preço de cair mais' de onde ele está (ex: '$4,32 - chão firme de apoio onde o preço para de cair'). Evite 'médias móveis' ou termos complexos." },
            resistencia: { type: Type.STRING, description: "Explicação simples da Resistência focalizando em ser o 'teto que impede o preço de subir mais' do que aquilo (ex: '$4,38 - teto forte que limita os avanços de preço'). Evite termos complexos." },
            cenarioProvavel: { type: Type.STRING, description: 'O cenário técnico mais provável de se concretizar a curtíssimo prazo' },
            acaoRecomendada: { type: Type.STRING, description: "Ação sugerida: 'Comprar', 'Vender' ou 'Aguardar'" },
            tipoEntrada: { type: Type.STRING, description: "Tipo recomendado de entrada apresentado em forma de 'tipo de terreno' lúdico no gráfico usando as analogias descritas (ex: 'Entrar em terreno plano depois que o chão rachou' para rompimento de suporte, ou 'Pisar de leve no chão recém-testado' para pullback, ou 'Subir ou descer a encosta íngreme quando o vento de forças vira' para reversão, ou 'Pântano movesco sem direção confiável' para sem entrada)" },
            pontoEntrada: { type: Type.STRING, description: 'Preço de entrada no formato "R$ X,XX" ou "$X.XX" seguido de explicação opcional entre parênteses' },
            stopLoss: { type: Type.STRING, description: 'Stop loss no formato "R$ X,XX" ou "$X.XX" seguido de explicação opcional entre parênteses' },
            alvo: { type: Type.STRING, description: 'Take profit no formato "R$ X,XX" ou "$X.XX" seguido de explicação opcional entre parênteses' },
            nivelConfianca: { type: Type.STRING, description: 'Baixo, Médio ou Alto — baseado principalmente na nitidez visual dos candles e legibilidade dos preços na imagem' },
            relacaoRiscoRetorno: { type: Type.STRING, description: 'Relação risco/retorno estimada no formato "1:X — viável/equilibrada/fraca" com breve justificativa lúdica' },
            comentarioAnalista: { type: Type.STRING, description: 'Conselho do mentor. Sem posição: incluir "Se perder, você perde X; se ganhar, você ganha Y". Com dadosCompra: "Você comprou a X, o preço está em Y. Seu lucro/prejuízo atual é Z. Recomendo [ação] porque [motivo técnico]"' },
            precoAtualEstimado: { type: Type.STRING, description: 'Preço atual do ativo no print mais recente, formato "R$ X,XX" ou "$X.XX"' },
            statusTrade: { type: Type.STRING, description: 'Somente com posição aberta: "MANTER", "VENDER AGORA", "REALIZAR PARCIAL" ou "STOP ATIVADO"' },
            syntheticCandles: { 
              type: Type.ARRAY, 
              items: {
                type: Type.OBJECT,
                properties: {
                  open: { type: Type.NUMBER },
                  high: { type: Type.NUMBER },
                  low: { type: Type.NUMBER },
                  close: { type: Type.NUMBER }
                }
              },
              description: "Exatamente 10 candles OHLC numericamente proporcionais aos últimos 10 candles visíveis na imagem (ordem cronológica; o último é o mais recente)."
            },
            rompimentoDetectado: { type: Type.BOOLEAN, description: "Defina como true se o preço rompeu recentemente ou está rompendo um suporte (piso) ou resistência (teto) importante; caso contrário, false" },
            rompimentoComentario: { type: Type.STRING, description: "Breve explicação/comentário sobre a força e direção deste rompimento (ex: 'Rompimento forte de teto sustentado por velas verdes volumosas' ou 'Piso quebrado com muita agressividade'), ou vazio se rompimentoDetectado for false" }
          },
          required: [
            'ativoCooptado', 'tempoGrafico', 'tendencia', 'momento', 'leituraCandles',
            'suporte', 'resistencia', 'cenarioProvavel', 'acaoRecomendada', 
            'tipoEntrada', 'pontoEntrada', 'stopLoss', 'alvo', 'nivelConfianca', 'relacaoRiscoRetorno',
            'comentarioAnalista', 'rompimentoDetectado', 'rompimentoComentario', 'syntheticCandles'
          ]
        }
      }
    });

    const textOutput = response.text;
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

  } catch (err: any) {
    console.error('Erro na rota /api/analyze:', err);
    if (err?.code === 'MISSING_API_KEY' || /Nenhuma chave API/i.test(err?.message || '')) {
      return res.status(400).json({
        error: err.message,
        code: 'MISSING_API_KEY',
      });
    }
    return res.status(500).json({
      error: err.message || 'Ocorreu um erro interno na análise do gráfico.',
    });
  }
});

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

    const aiInstance = getGemini(apiKey);

    const contents: any[] = [
      { text: 'Por favor, analise simultaneamente estes dois gráficos do mesmo ativo: o primeiro é de 5 minutos (M5) e o segundo é de 15 minutos (M15). Produza uma comparação side-by-side integrando as duas perspectivas.' }
    ];

    // Clean prefix for M5 base64
    const cleanDataM5 = m5Image.replace(/^data:image\/\w+;base64,/, '');
    contents.push({
      inlineData: {
        data: cleanDataM5,
        mimeType: 'image/png'
      }
    });

    // Clean prefix for M15 base64
    const cleanDataM15 = m15Image.replace(/^data:image\/\w+;base64,/, '');
    contents.push({
      inlineData: {
        data: cleanDataM15,
        mimeType: 'image/png'
      }
    });

    const response = await aiInstance.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: { parts: contents },
      config: {
        systemInstruction: MULTI_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ativoCooptado: { type: Type.STRING, description: 'O nome ou ticker do ativo lido (ex: PETR4, WINM26, etc)' },
            comparativoAnalise: { type: Type.STRING, description: 'Explicação minuciosa cruzando os dados do M5 e do M15. Explique a teoria da lupa (M5) e do binóculo (M15), destacando se há alinhamento ou divergência saudável de forças.' },
            conclusaoDecisao: { type: Type.STRING, description: 'Orientação final e clara unindo as duas leituras para orientar a operação ideal.' },
            acaoRecomendada: { type: Type.STRING, description: "'Comprar', 'Vender' ou 'Aguardar'" },
            pontoEntrada: { type: Type.STRING, description: 'Ponto exato ideal de entrada' },
            stopLoss: { type: Type.STRING, description: 'Stop loss sugerido protetor' },
            alvo: { type: Type.STRING, description: 'Alvo ideal / Take profit' },
            nivelConfianca: { type: Type.STRING, description: 'Nível de confiança técnica: Baixo, Médio ou Alto' },
            comentarioAnalista: { type: Type.STRING, description: 'O conselho do mentor do trading sobre alinhamento de tempos gráficos.' },
            m5: {
              type: Type.OBJECT,
              properties: {
                tendencia: { type: Type.STRING, description: 'Tendência principal no M5: Alta, Baixa ou Lateral' },
                momento: { type: Type.STRING, description: 'Momento no M5 (ex: corrigindo, exaurido, rompendo)' },
                leituraCandles: { type: Type.STRING, description: 'Explicação lúdica das velinhas do M5 para iniciantes' },
                suporte: { type: Type.STRING, description: 'O suporte/chão chave de M5' },
                resistencia: { type: Type.STRING, description: 'A resistência/teto chave de M5' }
              },
              required: ['tendencia', 'momento', 'leituraCandles', 'suporte', 'resistencia']
            },
            m15: {
              type: Type.OBJECT,
              properties: {
                tendencia: { type: Type.STRING, description: 'Tendência principal no M15: Alta, Baixa ou Lateral' },
                momento: { type: Type.STRING, description: 'Momento no M15' },
                leituraCandles: { type: Type.STRING, description: 'Explicação lúdica das velinhas do M15' },
                suporte: { type: Type.STRING, description: 'O suporte/chão de M15' },
                resistencia: { type: Type.STRING, description: 'A resistência/teto de M15' }
              },
              required: ['tendencia', 'momento', 'leituraCandles', 'suporte', 'resistencia']
            }
          },
          required: [
            'ativoCooptado', 'comparativoAnalise', 'conclusaoDecisao', 'acaoRecomendada',
            'pontoEntrada', 'stopLoss', 'alvo', 'nivelConfianca', 'comentarioAnalista',
            'm5', 'm15'
          ]
        }
      }
    });

    const textOutput = response.text;
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
  } catch (err: any) {
    console.error('Erro na rota /api/analyze-multi:', err);
    return res.status(500).json({ 
      error: err.message || 'Ocorreu um erro interno na análise múltipla dos gráficos.' 
    });
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
