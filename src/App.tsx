import React, { useState, useEffect, useRef } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowRight, 
  UploadCloud, 
  History, 
  Plus, 
  X, 
  Copy, 
  Download, 
  RefreshCw, 
  Sliders, 
  HelpCircle, 
  Target, 
  AlertTriangle, 
  Compass, 
  Sparkles,
  BookOpen,
  Image as ImageIcon,
  CheckCircle,
  FileText,
  Thermometer
} from "lucide-react";
import { ChartAnalysis, MultiChartAnalysis, SavedAnalysis, PresetChart } from "./types";
import { PRESET_CHARTS, PRESET_MULTI_CHARTS } from "./data/presets";
import { motion } from "motion/react";

export default function App() {
  // Application State
  const [scannerMode, setScannerMode] = useState<"single" | "multi">("single");
  const [activeAnalysis, setActiveAnalysis] = useState<ChartAnalysis>(PRESET_CHARTS[0].analysis);
  const [activeMultiAnalysis, setActiveMultiAnalysis] = useState<MultiChartAnalysis | null>(null);
  
  const [selectedPresetId, setSelectedPresetId] = useState<string>("csed3-example");
  const [selectedMultiPresetId, setSelectedMultiPresetId] = useState<string>("");
  
  const [showGlossary, setShowGlossary] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"scanner" | "simulator" | "school">("scanner");
  
  // Interactive Custom Candle State
  const [customCandleIsUp, setCustomCandleIsUp] = useState<boolean>(true);
  const [customCandleBody, setCustomCandleBody] = useState<number>(45);
  const [customCandleUpper, setCustomCandleUpper] = useState<number>(15);
  const [customCandleLower, setCustomCandleLower] = useState<number>(15);
  
  // Custom upload state
  const [uploadedPhotos, setUploadedPhotos] = useState<{ id: string; name: string; type: string; base64: string }[]>([]);
  const [m5Photo, setM5Photo] = useState<{ id: string; name: string; type: string; base64: string } | null>(null);
  const [m15Photo, setM15Photo] = useState<{ id: string; name: string; type: string; base64: string } | null>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  // Saved scans history
  const [history, setHistory] = useState<SavedAnalysis[]>([]);
  
  // Interactive full-screen preview state
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Success Toast & Visual feedback state
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<"analyze" | "preset" | "history">("analyze");

  // Automatically hide the visual success feedback toast after 5 seconds
  useEffect(() => {
    if (showSuccessToast) {
      const timer = setTimeout(() => {
        setShowSuccessToast(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessToast]);

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("candlescan_history_v1");
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load history from localStorage", e);
    }
  }, []);

  // Save history to localStorage
  const saveToHistory = (newAnalysis: ChartAnalysis, imageCount: number) => {
    const record: SavedAnalysis = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) + " - " + new Date().toLocaleDateString("pt-BR"),
      ativoCooptado: newAnalysis.ativoCooptado || "Ativo Desconhecido",
      tempoGrafico: newAnalysis.tempoGrafico || "Desconhecido",
      tendencia: newAnalysis.tendencia || "Lateral",
      acaoRecomendada: newAnalysis.acaoRecomendada || "Aguardar",
      nivelConfianca: newAnalysis.nivelConfianca || "Médio",
      analysis: newAnalysis,
      imageCount
    };

    const updated = [record, ...history].slice(0, 50); // Keep last 50
    setHistory(updated);
    try {
      localStorage.setItem("candlescan_history_v1", JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save history to localStorage", e);
    }
  };

  // Helper to handle copies
  const triggerCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Handle image upload conversions
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    processFiles(files);
  };

  const processFiles = (files: FileList) => {
    setAnalysisError(null);
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        setAnalysisError("Apenas arquivos de imagem são permitidos.");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setUploadedPhotos(prev => [
            ...prev,
            {
              id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
              name: file.name,
              type: file.type,
              base64: reader.result as string
            }
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Drag and drop events
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const removeUploadedPhoto = (id: string) => {
    setUploadedPhotos(prev => prev.filter(p => p.id !== id));
  };

  // Start analysis using Gemini API on backend
  const handleAnalyzeGraph = async () => {
    if (uploadedPhotos.length === 0) {
      setAnalysisError("Por favor, faça upload de pelo menos um print de gráfico (M5 ou M15) antes de analisar.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      // Prepare body payload matching server.ts schema
      const payloadImages = uploadedPhotos.map(photo => ({
        data: photo.base64,
        mimeType: photo.type
      }));

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ images: payloadImages })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Erro do servidor (${res.status}). Verifique se sua chave API do Gemini está configurada.`);
      }

      const data: ChartAnalysis = await res.json();
      setActiveAnalysis(data);
      setSelectedPresetId(""); // Clear active preset flag
      saveToHistory(data, uploadedPhotos.length);
      
      // Trigger success visual feedback toast
      setToastType("analyze");
      setToastMessage(`Análise inteligente para o ativo ${data.ativoCooptado || "Detectado"} concluída e gerada com sucesso!`);
      setShowSuccessToast(true);
    } catch (err: any) {
      console.error(err);
      setAnalysisError(err.message || "Ocorreu um erro ao processar. Verifique se a sua chave do Gemini está salva corretamente nas Configurações > Segredos.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Clear current upload and fall back to default
  const handleResetWorkspace = () => {
    setUploadedPhotos([]);
    setAnalysisError(null);
    const defaultPreset = PRESET_CHARTS[0];
    setActiveAnalysis(defaultPreset.analysis);
    setSelectedPresetId(defaultPreset.id);
  };

  const loadPreset = (preset: PresetChart) => {
    setActiveAnalysis(preset.analysis);
    setSelectedPresetId(preset.id);
    setUploadedPhotos([]);
    setAnalysisError(null);

    // Trigger feedback for presets
    setToastType("preset");
    setToastMessage(`Gráfico prático de ${preset.analysis.ativoCooptado || "Exemplo"} carregado para estudo!`);
    setShowSuccessToast(true);
  };

  const loadHistoryItem = (item: SavedAnalysis) => {
    setActiveAnalysis(item.analysis);
    setSelectedPresetId("");
    setUploadedPhotos([]);
    setAnalysisError(null);

    // Trigger feedback for restored item
    setToastType("history");
    setToastMessage(`Análise gravada para o ativo ${item.analysis.ativoCooptado || "Histórico"} restaurada!`);
    setShowSuccessToast(true);
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    try {
      localStorage.setItem("candlescan_history_v1", JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  // Confidence percentage helpers
  const getConfidencePercentage = (level: string) => {
    const lvl = level?.toLowerCase() || "";
    if (lvl.includes("alto") || lvl.includes("high")) return 90;
    if (lvl.includes("médio") || lvl.includes("medio") || lvl.includes("medium")) return 65;
    return 35;
  };

  const getCleanLabel = (val: string) => {
    if (!val) return "---";
    const clean = val.split("(")[0].trim();
    return clean.length > 20 ? clean.slice(0, 20) + "..." : clean;
  };

  // Dynamic style badge mapping
  const getActionColorDetails = (action: string) => {
    const act = action?.toUpperCase() || "";
    if (act.includes("COMPRAR") || act.includes("BUY")) {
      return {
        bg: "bg-emerald-500/10 border-emerald-500 text-emerald-400",
        pill: "bg-emerald-500 text-black",
        light: "text-emerald-400",
        glow: "shadow-[0_0_20px_rgba(34,197,94,0.15)]",
        radar: "bg-emerald-500",
        label: "COMPRAR"
      };
    }
    if (act.includes("VENDER") || act.includes("SELL")) {
      return {
        bg: "bg-rose-500/10 border-rose-500 text-rose-400",
        pill: "bg-rose-500 text-white",
        light: "text-rose-400",
        glow: "shadow-[0_0_20px_rgba(239,68,68,0.15)]",
        radar: "bg-rose-500",
        label: "VENDER"
      };
    }
    return {
      bg: "bg-amber-500/10 border-amber-500 text-amber-400",
      pill: "bg-amber-500 text-black",
      light: "text-amber-400",
      glow: "shadow-[0_0_20px_rgba(245,158,11,0.15)]",
      radar: "bg-amber-500",
      label: "AGUARDAR"
    };
  };

  const actionCfg = getActionColorDetails(activeAnalysis.acaoRecomendada);

  // Pre-configured list of background candles to show visually when using presets
  const renderDummyGraph = (tendenciaRaw: string) => {
    interface SimulatedCandle {
      open: number;
      close: number;
      high: number;
      low: number;
    }

    const candles: { up: SimulatedCandle[]; down: SimulatedCandle[]; lateral: SimulatedCandle[] } = {
      up: [
        { open: 20, close: 32, high: 38, low: 15 },
        { open: 32, close: 26, high: 36, low: 22 },
        { open: 26, close: 54, high: 56, low: 23 }, // span: 33, body: 28, ratio: 84% (Bullish strength!)
        { open: 54, close: 48, high: 58, low: 44 },
        { open: 48, close: 72, high: 75, low: 45 }, // span: 30, body: 24, ratio: 80% (Bullish strength!)
        { open: 72, close: 66, high: 76, low: 62 },
        { open: 66, close: 84, high: 86, low: 64 }, // span: 22, body: 18, ratio: 81.8% (Bullish strength!)
        { open: 84, close: 80, high: 88, low: 76 }
      ],
      down: [
        { open: 85, close: 72, high: 88, low: 68 },
        { open: 72, close: 76, high: 80, low: 70 },
        { open: 76, close: 52, high: 78, low: 48 }, // bearish body ratio: 24/30 = 80% (but bearish)
        { open: 52, close: 56, high: 62, low: 50 },
        { open: 56, close: 34, high: 58, low: 30 },
        { open: 34, close: 38, high: 42, low: 32 },
        { open: 38, close: 18, high: 40, low: 14 },
        { open: 18, close: 22, high: 26, low: 15 }
      ],
      lateral: [
        { open: 45, close: 55, high: 60, low: 40 },
        { open: 55, close: 48, high: 58, low: 44 },
        { open: 48, close: 66, high: 68, low: 45 }, // span: 23, body: 18, ratio: 78.2% (Bullish strength!)
        { open: 66, close: 52, high: 70, low: 50 },
        { open: 52, close: 46, high: 56, low: 42 },
        { open: 46, close: 62, high: 64, low: 44 }, // span: 20, body: 16, ratio: 80% (Bullish strength!)
        { open: 62, close: 54, high: 66, low: 50 },
        { open: 54, close: 50, high: 58, low: 46 }
      ]
    };

    const isUpTrend = tendenciaRaw?.includes("Alta") || tendenciaRaw?.includes("up") || tendenciaRaw?.toLowerCase().includes("sub");
    const isDownTrend = tendenciaRaw?.includes("Baixa") || tendenciaRaw?.includes("down") || tendenciaRaw?.toLowerCase().includes("cai");
    const activeCandles = candles[isUpTrend ? "up" : isDownTrend ? "down" : "lateral"];

    return (
      <div className="flex items-end gap-3 h-full w-full justify-between pt-6 pb-2 px-1 relative select-none">
        {activeCandles.map((c, i) => {
          const isUp = c.close >= c.open;
          const range = c.high - c.low;
          const bodySize = Math.abs(c.close - c.open);
          const ratio = range > 0 ? bodySize / range : 0;
          const isStrengthBull = isUp && ratio >= 0.70;

          // Dimensions
          const bottomWick = c.low;
          const wickHeight = range;
          const bottomBody = Math.min(c.open, c.close);
          const bodyHeight = bodySize;

          return (
            <div 
              key={i} 
              className="flex-1 h-full relative group/candle flex justify-center items-end"
            >
              {/* Dynamic Tooltip on Hover */}
              <div className="group-hover/candle:flex hidden absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#121214] border border-[#27272a] text-zinc-100 p-2 text-[10px] w-48 flex-col z-30 pointer-events-none shadow-2xl transition-all duration-200 leading-normal gap-1 font-sans">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-1 mb-1 font-bold">
                  <span>Vela #{i + 1}</span>
                  <span className={isUp ? "text-emerald-400" : "text-rose-400"}>
                    {isUp ? "Alta 🟢" : "Baixa 🔴"}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Proporção do Corpo:</span>
                  <span className="font-mono text-zinc-200 font-bold">
                    {(ratio * 100).toFixed(0)}%
                  </span>
                </div>
                {isStrengthBull && (
                  <div className="mt-1 pt-1 border-t border-zinc-800/60 text-emerald-400 font-bold bg-emerald-950/40 p-1 rounded border border-emerald-500/25 flex items-center gap-1">
                    <span>⚡ Alta Expressiva (Corpo {Math.round(ratio * 100)}%)</span>
                  </div>
                )}
              </div>

              {/* High-Low Wick (Sombra) */}
              <div 
                className={`w-[2px] absolute rounded-full transition-all duration-300 ${
                  isUp 
                    ? isStrengthBull 
                      ? "bg-emerald-400 brightness-125" 
                      : "bg-emerald-600/60" 
                    : "bg-rose-600/60"
                }`}
                style={{ 
                  bottom: `${bottomWick}%`, 
                  height: `${wickHeight}%` 
                }}
              />

              {/* Candle Body (Corpo) */}
              <div 
                className={`w-full max-w-[12px] sm:max-w-[16px] rounded-xs absolute transition-all duration-500 cursor-help ${
                  isUp 
                    ? isStrengthBull
                      ? "bg-emerald-400 border border-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.8)] animate-pulse"
                      : "bg-emerald-500/80 hover:bg-emerald-400 border border-emerald-500/30"
                    : "bg-rose-500/80 hover:bg-rose-400 border border-rose-500/30"
                }`}
                style={{ 
                  bottom: `${bottomBody}%`, 
                  height: `${bodyHeight}%` 
                }}
              >
                {/* Subtle highlight inner indicator for strong candles */}
                {isStrengthBull && (
                  <div className="absolute inset-0 bg-white/20 rounded-xs animate-pulse pointer-events-none" />
                )}
              </div>

              {/* Under-candle accent marker for beginners to instantly locate it */}
              {isStrengthBull && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
                  <span className="text-[12px] text-emerald-400 font-black filter drop-shadow-[0_0_3px_rgba(52,211,153,0.8)] animate-bounce font-mono">
                    ⚡
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Download complete text analysis
  const handleDownloadAnalysis = () => {
    const rompimentoText = activeAnalysis.rompimentoDetectado
      ? `\n==================================================\n⚠️ [ALERTA DE ROMPIMENTO DETECTADO!]\n${activeAnalysis.rompimentoComentario || "O preço cruzou e fechou fora de uma barreira importante."}\n==================================================\n`
      : "";

    const text = `=== CANDLESCAN PRO: RELATÓRIO DE ANÁLISE TÉCNICA ===
Gerado em: ${new Date().toLocaleString()}
Ativo Detectado: ${activeAnalysis.ativoCooptado}
Tempo Gráfico: ${activeAnalysis.tempoGrafico}
--------------------------------------------------
TENDÊNCIA: ${activeAnalysis.tendencia}
MOMENTO DO MERCADO: ${activeAnalysis.momento}
RECOMENDAÇÃO: ${activeAnalysis.acaoRecomendada.toUpperCase()}
CONFIANÇA: ${activeAnalysis.nivelConfianca}${rompimentoText}
--------------------------------------------------
Pontos Importantes:
- Suporte: ${activeAnalysis.suporte}
- Resistência: ${activeAnalysis.resistencia}

Leitura dos Candles:
${activeAnalysis.leituraCandles}

Cenário Provável:
${activeAnalysis.cenarioProvavel}

Estratégia Sugerida:
- Tipo de Entrada: ${activeAnalysis.tipoEntrada}
- Ponto Ideal de Entrada: ${activeAnalysis.pontoEntrada}
- Stop Loss Sugerido: ${activeAnalysis.stopLoss}
- Alvo (Take Profit): ${activeAnalysis.alvo}

Comentários do Analista Mentor:
${activeAnalysis.comentarioAnalista}
--------------------------------------------------
CandleScan PRO • Inteligência Artificial de Alta Precisão para Traders de Curto Prazo
`;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `CANDLESCAN-${activeAnalysis.ativoCooptado || "TRADE"}-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Dynamic intensity score (candle and volume force thermometer)
  const getIntensityDetails = (analysis: ChartAnalysis) => {
    const mom = (analysis.momento || "").toLowerCase();
    const tend = (analysis.tendencia || "").toLowerCase();
    const recom = (analysis.acaoRecomendada || "").toLowerCase();
    const romp = !!analysis.rompimentoDetectado;

    let score = 55; // default moderate score
    let levelLabel = "Moderada / Equilibrada";
    let statusText = "Equilíbrio de forças";
    let colorClass = "from-amber-500 to-yellow-400"; // neutral gradients
    let textColor = "text-amber-400";
    let rgbGlow = "rgba(245,158,11,0.2)";
    let description = "Transação equilibrada de ordens. Não há domínio absoluto de nenhum dos lados nas velas recentes.";

    if (romp) {
      score = 95;
      levelLabel = "FORÇA MÁXIMA / ROMPIMENTO DETECTADO ⚡";
      statusText = "Rompendo Provedor de Volume";
      colorClass = "from-emerald-500 via-teal-400 to-emerald-400";
      textColor = "text-emerald-400";
      rgbGlow = "rgba(16,185,129,0.3)";
      description = "Pressão colossal rompendo barreiras de preço (teto ou chão)! Há extrema aceleração e alta injeção de volume.";
    } else if (mom.includes("queda livre") || mom.includes("controle") || mom.includes("esmagou") || mom.includes("nocaute") || tend.includes("forte") || tend.includes("alta") || recom === "comprar" || recom === "vender") {
      // Direct directional strength
      const isUp = tend.includes("alta") || tend.includes("sub") || recom === "comprar";
      score = isUp ? 85 : 80;
      levelLabel = isUp ? "INTENSIDADE FORTE DE COMPRA 🔥" : "INTENSIDADE FORTE DE VENDA 🛑";
      statusText = isUp ? "Alta Energia Compradora" : "Alta Energia Vendedora";
      colorClass = isUp ? "from-emerald-600 to-emerald-400" : "from-rose-600 to-rose-450";
      textColor = isUp ? "text-emerald-400" : "text-rose-400";
      rgbGlow = isUp ? "rgba(16,185,129,0.25)" : "rgba(244,63,94,0.25)";
      description = isUp 
        ? "Excelente fluxo recente com velas verdes encorpadas. A força compradora domina amplamente e tende a sustentar novas altas."
        : "Forte pressão vendedora com velas vermelhas robustas. Vendedores estão agressivos empurrando a cotação ladeira abaixo.";
    } else if (mom.includes("cansando") || mom.includes("recuo") || mom.includes("retração") || mom.includes("dúvida") || mom.includes("empate") || mom.includes("indecis") || tend.includes("lateral") || recom === "aguardar") {
      score = 15;
      levelLabel = "INTENSIDADE FRACA / EXAUSTÃO ❄️";
      statusText = "Dúvida e Baixa Atividade";
      colorClass = "from-rose-500 to-rose-400";
      textColor = "text-rose-400";
      rgbGlow = "rgba(244,63,94,0.25)";
      description = "Volume muito baixo ou exaustão do movimento recente. As velas perderam corpo (Dojis) ou estão batendo em barreiras intransponíveis.";
    }

    return { score, levelLabel, statusText, colorClass, textColor, rgbGlow, description };
  };

  // Dynamic classification logic for the user-designed custom candle
  const getCustomCandleAnalysis = () => {
    const isUp = customCandleIsUp;
    const body = customCandleBody;
    const upper = customCandleUpper;
    const lower = customCandleLower;
    
    const total = body + upper + lower;
    const rangeRatio = total > 0 ? body / total : 0;

    let patternName = "Vela Comum (Standard)";
    let visualAnalogy = "Marcha Gradual do Preço 📊";
    let badgeType = "Neutro";
    let badgeColor = "bg-zinc-800 text-zinc-300 border border-zinc-700/50";
    let description = "Formato de vela clássico, com corpo moderado e pavios (sombras) normais em ambas as pontas.";
    let dynamicEx = `Mostra que o time do ${isUp ? "Verde (Compradores)" : "Vermelho (Vendedores)"} dominou o final deste horário e empurrou o preço de forma equilibrada sem rejeições drásticas.`;

    if (body <= 15) {
      patternName = "Doji (Empate Crítico)";
      visualAnalogy = "Cabo de Guerra Travado ⚖️";
      badgeType = "Equilíbrio Extremo";
      badgeColor = "bg-amber-500/15 text-amber-400 border border-amber-500/20";
      description = "O corpo desta vela é quase uma linha invisível. Compradores e vendedores lutaram violentamente durante o horário, mas fecharam perfeitamente empatados no mesmo valor.";
      dynamicEx = "Indica dúvida absoluta no mercado. O melhor conselho é aguardar e não operar até surgir uma nova vela mostrando força clara.";
    } else if (body >= 75) {
      patternName = isUp ? "Marubozu / Vela Careca de Alta" : "Marubozu / Vela Careca de Baixa";
      visualAnalogy = isUp ? "Nocaute Avassalador Verde! 💪🟢" : "Trator Rolo Compressor Vermelho! 💪🔴";
      badgeType = isUp ? "Explosão Compradora" : "Explosão Vendedora";
      badgeColor = isUp ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/15 text-rose-400 border border-rose-500/20";
      description = "Uma vela gordinha totalmente preenchida sem nenhuma sombra ou linha visível nas pontas.";
      dynamicEx = `Representa domínio completo de um dos times. O Time ${isUp ? "Verde esmagou" : "Vermelho tratorou"} o oponente do início ao fim! Grande chance do movimento continuar forte.`;
    } else if (isUp && upper < 12 && lower >= 2.0 * body) {
      patternName = "Martelo (Hammer)";
      visualAnalogy = "Mola Protetora contra Quedas! 🟢🔨";
      badgeType = "Reversão de Alta";
      badgeColor = "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20";
      description = "Possui um corpo verde curto posicionado no topo, com uma longa e fina perna empurrada para o fundo.";
      dynamicEx = "O Time Vermelho bateu forte tentando furar o chão firme. Porém, o Time Verde acionou um elástico potente que repeliu o preço de volta com fúria. Indica que o suporte segurou bem e o preço quer subir!";
    } else if (!isUp && upper < 12 && lower >= 2.0 * body) {
      patternName = "Homem Enforcado (Hanging Man)";
      visualAnalogy = "Sonda de Fundo Perigosa! 🔴🔨";
      badgeType = "Fraqueza de Alta";
      badgeColor = "bg-amber-500/15 text-amber-300 border border-amber-500/25";
      description = "Corpo vermelho pequeno no topo com uma longa perna de pavio esticada para o fundo.";
      dynamicEx = "Compradores ainda tentam segurar as pontas, mas a perna do pavio para baixo mostra que os vendedores já descobriram um caminho fácil para machucar as posições. Acenda o pisca alerta!";
    } else if (!isUp && lower < 12 && upper >= 2.0 * body) {
      patternName = "Estrela Cadente (Shooting Star)";
      visualAnalogy = "Cabeçada Violenta no Teto! 🔴☄️";
      badgeType = "Reversão de Baixa";
      badgeColor = "bg-rose-500/15 text-rose-400 border border-rose-500/20";
      description = "Possui um corpo vermelho pequeno posicionado no chão, com um pavio de rejeição muito longo esticado para cima.";
      dynamicEx = "O preço tentou um voo espacial gigantesco, mas colidiu numa laje rígida de concreto (teto de resistência) e caiu desabando pelas leis da gravidade. É um sinal clássico de queda rápida!";
    } else if (isUp && lower < 12 && upper >= 2.0 * body) {
      patternName = "Martelo Invertido de Alta";
      visualAnalogy = "Salto de Teste nas Alturas! 🟢☄️";
      badgeType = "Tentativa de Alta";
      badgeColor = "bg-sky-500/15 text-sky-400 border border-sky-500/25";
      description = "Corpo verde pequeno no fundo com um longo pavio apontado para cima.";
      dynamicEx = "Os compradores tentaram decolar mas foram repelidos temporariamente. Contudo, o fechamento no verde mostra que eles continuam sondando o teto e preparando uma nova explosão.";
    } else if (upper >= 35 && lower >= 35 && body < 30) {
      patternName = "Pião (Spinning Top)";
      visualAnalogy = "Pião Zonzo Decidindo Rumo! 😵🌀";
      badgeType = "Indecisão Geral";
      badgeColor = "bg-purple-500/15 text-purple-400 border border-purple-500/20";
      description = "Vela curta centralizada com antenas verticais compridas e equilibradas em ambas as extremidades.";
      dynamicEx = "O preço oscilou desesperado nas duas direções, mas acabou voltando para o centro. Indica um exaustivo combate técnico sem heróis. Aguarde as próximas velas para ver quem cansa primeiro.";
    }

    return { patternName, visualAnalogy, badgeType, badgeColor, description, dynamicEx };
  };

  return (
    <div id="root-view" className="min-h-screen bg-[#09090b] text-[#fafafa] font-sans antialiased selection:bg-rose-500/30 selection:text-red-200">
      
      {/* HEADER SECTION */}
      <header className="border-b border-[#27272a] bg-[#121214]/85 backdrop-blur-md sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-rose-500/10 border border-rose-500 p-2.5 rounded-xl shrink-0 animate-pulse">
              <Compass className="h-6 w-6 text-rose-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight">
                  CandleScan <span className="text-rose-500 font-black">FÁCIL</span>
                </h1>
                <span className="hidden sm:inline-block bg-[#1c1c20] border border-[#27272a] text-xs text-[#a1a1aa] px-2 py-0.5 rounded-full">
                  Para Iniciantes
                </span>
              </div>
              <p className="text-xs text-[#a1a1aa] mt-0.5 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                Sua Inteligência Artificial para traduzir gráficos de velas (candles) de forma simples e direta!
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={() => setActiveTab(activeTab === "school" ? "scanner" : "school")}
              className={`px-3.5 py-1.5 flex items-center gap-1.5 rounded-lg text-xs font-semibold active:scale-95 transition-all text-center border cursor-pointer ${
                activeTab === "school" 
                  ? "bg-amber-500/20 border-amber-400 text-amber-300"
                  : "bg-[#18181b] border-[#27272a] text-[#a1a1aa] hover:border-amber-500/50 hover:text-white"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              {activeTab === "school" ? "Ir para o Scanner" : "📚 Guia do Iniciante"}
            </button>
            
            <button
              id="reset-btn"
              onClick={handleResetWorkspace}
              className="px-3.5 py-1.5 flex items-center gap-1.5 rounded-lg bg-[#18181b] border border-[#27272a] text-xs font-semibold text-[#fafafa] hover:bg-[#27272a] hover:border-zinc-600 active:scale-95 transition-all text-center cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Limpar Análise
            </button>

            <button
              id="download-btn"
              onClick={handleDownloadAnalysis}
              className="px-3.5 py-1.5 flex items-center gap-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold active:scale-95 transition-all shadow-[0_4px_12px_rgba(239,68,68,0.12)] text-center cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              Salvar em Texto
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        
        {/* TAB NAVIGATION SELECTOR */}
        <div className="flex border-b border-zinc-800 gap-1 overflow-x-auto scroller-none pb-px">
          <button
            onClick={() => setActiveTab("scanner")}
            className={`py-3 px-6 text-xs sm:text-sm font-extrabold border-b-2 flex items-center gap-2 select-none cursor-pointer whitespace-nowrap transition-all uppercase tracking-wider ${
              activeTab === "scanner"
                ? "border-rose-500 text-rose-450 bg-rose-500/[0.04]"
                : "border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
            }`}
          >
            <Compass className="h-4 w-4" />
            🔍 Scanner de Gráficos (IA)
          </button>
          
          <button
            onClick={() => setActiveTab("simulator")}
            className={`py-3 px-6 text-xs sm:text-sm font-extrabold border-b-2 flex items-center gap-2 select-none cursor-pointer whitespace-nowrap transition-all uppercase tracking-wider ${
              activeTab === "simulator"
                ? "border-rose-500 text-rose-450 bg-rose-500/[0.04]"
                : "border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
            }`}
          >
            <Thermometer className="h-4 w-4" />
            🎛️ Laboratório de Velas
          </button>
          
          <button
            onClick={() => setActiveTab("school")}
            className={`py-3 px-6 text-xs sm:text-sm font-extrabold border-b-2 flex items-center gap-2 select-none cursor-pointer whitespace-nowrap transition-all uppercase tracking-wider ${
              activeTab === "school"
                ? "border-rose-500 text-rose-450 bg-rose-500/[0.04]"
                : "border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            📚 Escola de Trading
          </button>
        </div>

        {/* TAB 1: SCANNER CORE (TOP BANNER) */}
        {activeTab === "scanner" && (
          <div id="welcome-message" className="bg-gradient-to-r from-rose-950/20 via-zinc-900 to-zinc-900 border border-[#27272a] rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 w-80 h-32 bg-rose-500/5 blur-3xl rounded-full pointer-events-none"></div>
            
            <div className="space-y-1 z-10 w-full">
              <div className="flex items-center gap-2">
                <span className="bg-amber-500/10 text-amber-400 text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded border border-amber-500/20">
                  Aprenda Grátis
                </span>
                <span className="text-xs text-[#a1a1aa]">• Análise de Gráficos Descomplicada</span>
              </div>
              <h2 className="text-lg font-bold text-white">
                Sua Inteligência de Velas (Candlesticks) Amigável para Leigos
              </h2>
              <p className="text-sm text-[#a1a1aa] leading-relaxed">
                Não sabe nada sobre gráficos financeiros? Sem problemas! Esqueça termos complicados. Basta tirar um print do gráfico do seu celular ou computador, carregar aqui, e nossa Inteligência Artificial vai traduzir o desenho das barras em conselhos práticos e simples de entender.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: INTERACTIVE CANDLE SIMULATOR */}
        {activeTab === "simulator" && (
          <div id="interactive-candle-laboratory" className="bg-[#18181b] border border-[#27272a] rounded-2xl p-5 md:p-6 space-y-5 transition-all">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-500 shrink-0">
                  <Thermometer className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">🎛️ Laboratório de Velas & Simulador Interativo</h3>
                  <p className="text-xs text-[#a1a1aa]">Modelize seus próprios candles e estude os nomes e analogias técnicas correspondentes em tempo real!</p>
                </div>
              </div>
              <span className="text-[10px] bg-rose-500/10 text-rose-300 border border-rose-500/20 px-2.5 py-1 rounded font-bold font-mono">
                Padrões Visuais
              </span>
            </div>
            
            <p className="text-[11px] text-zinc-400 font-sans max-w-3xl leading-relaxed">
              Ajuste os controles abaixo para modelar sua própria vela de preço (candle) e veja em tempo real como a nossa tecnologia de análise visual classifica o comportamento do mercado, fornecendo analogias e orientações práticas de trading!
            </p>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
              
              {/* Painel de Controles */}
              <div className="lg:col-span-12 xl:col-span-5 bg-zinc-950/40 p-4 rounded-xl border border-zinc-850 flex flex-col justify-between space-y-4">
                <div className="space-y-3.5">
                  {/* Seletor de Time */}
                  <div className="space-y-1.5">
                    <span className="font-sans font-bold text-[10px] text-zinc-400 uppercase tracking-widest block">1. Direção da Vela (Fechamento)</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setCustomCandleIsUp(true)}
                        className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                          customCandleIsUp 
                            ? "bg-emerald-500/15 border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.1)]"
                            : "bg-[#111] border-zinc-800 text-zinc-500 hover:text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Time Verde (Alta)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomCandleIsUp(false)}
                        className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                          !customCandleIsUp 
                            ? "bg-rose-500/15 border-rose-500 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.1)]"
                            : "bg-[#111] border-zinc-800 text-zinc-500 hover:text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                        Time Vermelho (Baixa)
                      </button>
                    </div>
                  </div>

                  {/* Slider Corpo */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-bold text-zinc-300 font-sans">Tamanho do Corpo:</span>
                      <span className="font-mono text-zinc-400 font-semibold">{customCandleBody}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="95"
                      value={customCandleBody}
                      onChange={(e) => setCustomCandleBody(Number(e.target.value))}
                      className="w-full h-1.5 rounded-lg bg-zinc-800 appearance-none cursor-pointer accent-rose-500"
                    />
                  </div>

                  {/* Slider Pavio Superior */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-bold text-zinc-300 font-sans">Pavio Superior (Teto):</span>
                      <span className="font-mono text-zinc-400 font-semibold">{customCandleUpper}%</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="80"
                      value={customCandleUpper}
                      onChange={(e) => setCustomCandleUpper(Number(e.target.value))}
                      className="w-full h-1.5 rounded-lg bg-zinc-800 appearance-none cursor-pointer accent-rose-500"
                    />
                  </div>

                  {/* Slider Pavio Inferior */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-bold text-zinc-300 font-sans">Pavio Inferior (Chão):</span>
                      <span className="font-mono text-zinc-400 font-semibold">{customCandleLower}%</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="80"
                      value={customCandleLower}
                      onChange={(e) => setCustomCandleLower(Number(e.target.value))}
                      className="w-full h-1.5 rounded-lg bg-zinc-800 appearance-none cursor-pointer accent-rose-500"
                    />
                  </div>
                </div>

                <div className="bg-[#111112] p-2.5 rounded-lg border border-zinc-900/60 text-[10px] text-zinc-500 leading-normal font-sans">
                  💡 <strong>Dica do Mentor:</strong> Tente reduzir o <strong>Corpo</strong> para menos de 15% para criar um Doji, ou maximize o <strong>Pavio Inferior</strong> mantendo o corpo no topo para criar um Martelo!
                </div>
              </div>

              {/* Resultados da IA em tempo real */}
              <div className="lg:col-span-12 xl:col-span-7 bg-[#111] border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row gap-5 items-center justify-between">
                
                {/* SVG Render Canvas */}
                <div className="w-24 h-36 bg-zinc-950/80 border border-zinc-900 rounded-lg flex items-center justify-center shrink-0 relative overflow-hidden group">
                  <div className={`absolute inset-0 opacity-5 pointer-events-none ${
                    customCandleIsUp ? "bg-emerald-500" : "bg-rose-500"
                  }`}></div>
                  
                  {/* Calculated coordinate-based SVG */}
                  {(() => {
                    const total = customCandleBody + customCandleUpper + customCandleLower;
                    const scale = 110 / total;
                    const uPx = customCandleUpper * scale;
                    const bPx = customCandleBody * scale;
                    const lPx = customCandleLower * scale;

                    const topY = 15;
                    const bTopY = topY + uPx;
                    const bBottomY = bTopY + bPx;
                    const bottomY = bBottomY + lPx;
                    const midX = 48; // center of 96 width

                    const themeColor = customCandleIsUp ? "#10b981" : "#f43f5e";

                    return (
                      <svg className="w-full h-full" viewBox="0 0 96 140">
                        {/* High-Low Shadow line */}
                        <line
                          x1={midX}
                          y1={topY}
                          x2={midX}
                          y2={bottomY}
                          stroke={themeColor}
                          strokeWidth="2"
                          strokeLinecap="round"
                          opacity="0.8"
                        />
                        {/* Candle body */}
                        <rect
                          x={midX - 10}
                          y={bTopY}
                          width="20"
                          height={Math.max(bPx, 4)} // guarantee visibility
                          fill={themeColor}
                          stroke={themeColor}
                          strokeWidth="1"
                          rx="1.5"
                          className="transition-all duration-300"
                        />
                      </svg>
                    );
                  })()}
                </div>

                {/* Explanatory Technical & Visual Description side */}
                <div className="space-y-2 w-full text-left">
                  {(() => {
                    const analysis = getCustomCandleAnalysis();
                    return (
                      <>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider ${analysis.badgeColor}`}>
                            {analysis.badgeType}
                          </span>
                          <span className="text-xs text-zinc-500 font-mono">Simulação IA</span>
                        </div>

                        <h5 className="font-extrabold text-sm text-white font-sans flex items-center gap-1.5">
                          {analysis.patternName}
                        </h5>

                        <div className="text-xs font-bold text-amber-200/90 font-sans bg-amber-500/5 px-2.5 py-1 rounded inline-block border border-amber-500/10">
                          Analogia: {analysis.visualAnalogy}
                        </div>

                        <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                          {analysis.description}
                        </p>

                        <div className="bg-[#18181b]/60 p-2.5 rounded-lg border border-zinc-850 text-[11px] leading-relaxed">
                          <span className="font-bold text-zinc-300 block mb-0.5">Visão do Mentor no Mercado:</span>
                          <span className="text-zinc-400">{analysis.dynamicEx}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>

              </div>

            </div>
          </div>
        )}

        {/* TAB 3: TRADING SCHOOL & GUIDE BOOK */}
        {activeTab === "school" && (
          <div className="space-y-6 transition-all duration-300">
            {/* COMPLETE GLOSSARY CONTAINER */}
            <div id="beginner-glossary-card" className="border border-amber-500/20 bg-amber-500/[0.01] rounded-2xl p-5 md:p-6 space-y-5 relative overflow-hidden transition-all duration-300">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-500 shrink-0">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-amber-100">💡 Mini Dicionário de Sobrevivência (Para Iniciantes)</h3>
                    <p className="text-xs text-[#a1a1aa]">Tudo o que você precisa saber para entender qualquer análise deste aplicativo em 1 minuto.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                
                <div className="bg-[#111] p-3.5 rounded-xl border border-zinc-850 hover:border-zinc-700 transition">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2.5 h-6 bg-emerald-500 rounded-sm"></div>
                    <span className="font-bold text-xs text-emerald-400 font-sans">Velas Verdes e Vermelhas</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-normal font-sans">
                    Cada barra é uma <strong>vela (candle)</strong>. As <strong>verdes</strong> mostram que o preço subiu naquele período (Time Verde forte). As <strong>vermelhas</strong> mostram queda (Time Vermelho forte). As lines finas nas pontas são pavios de rejeição rápida.
                  </p>
                </div>

                <div className="bg-[#111] p-3.5 rounded-xl border border-zinc-850 hover:border-zinc-700 transition">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    <span className="font-bold text-xs text-emerald-300 font-sans">Suporte (O "Chão")</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-normal font-sans">
                    O <strong>Suporte</strong> funciona como o <strong>chão que impede o preço de cair mais</strong> de onde ele está. Quando o valor escorrega até esse chão, os compradores se posicionam para conter a descida e fazê-lo subir de novo!
                  </p>
                </div>

                <div className="bg-[#111] p-3.5 rounded-xl border border-zinc-850 hover:border-zinc-700 transition">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="h-4 w-4 text-rose-400" />
                    <span className="font-bold text-xs text-rose-300 font-sans">Resistência (O "Teto")</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-normal font-sans">
                    A <strong>Resistência</strong> funciona como o <strong>teto que impede o preço de subir mais</strong> do que aquilo. Ao bater a cabeça nesse teto rígido, os vendedores aparecem para empurrar o preço de volta para baixo!
                  </p>
                </div>

                <div className="bg-[#111] p-3.5 rounded-xl border border-zinc-850 hover:border-zinc-700 transition">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-blue-400" />
                    <span className="font-bold text-xs text-blue-300 font-sans">Stop Loss e Alvo</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-normal font-sans">
                    O <strong>Cinto de Segurança (Stop loss)</strong> é o preço limite da perda: se passar dele, a operação cancela para salvar sua conta. A <strong>Meta de Ganho (Alvo)</strong> é onde você põe a grana no bolso e comemora.
                  </p>
                </div>

              </div>

              {/* Guia de Velas (Candlesticks) Especiais */}
              <div className="border-t border-zinc-800/80 pt-5 mt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🕯️</span>
                  <h4 className="font-extrabold text-xs text-[#a1a1aa] uppercase tracking-widest font-sans">
                    Guia de Velas (Candlesticks) Especiais: O Desenho das Forças
                  </h4>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  
                  {/* Martelo Card */}
                  <div className="bg-[#111] p-4 rounded-xl border border-zinc-850 hover:border-zinc-705 transition flex flex-col md:flex-row gap-4 items-center md:items-start group">
                    <div className="w-16 h-28 bg-emerald-950/20 rounded-lg flex flex-col items-center justify-center border border-emerald-500/20 px-2 shrink-0 relative overflow-hidden">
                      <div className="absolute inset-x-0 bottom-0 bg-emerald-500/5 h-1/2 pointer-events-none"></div>
                      <svg className="w-8 h-20" viewBox="0 0 32 80">
                        <line x1="16" y1="10" x2="16" y2="20" stroke="#10b981" strokeWidth="1.5" />
                        <rect x="8" y="20" width="16" height="12" fill="#10b981" rx="1.5" />
                        <line x1="16" y1="32" x2="16" y2="70" stroke="#10b981" strokeWidth="2" />
                      </svg>
                      <span className="text-[8px] font-mono font-extrabold text-emerald-400 uppercase tracking-widest mt-1">Martelo</span>
                    </div>

                    <div className="space-y-1 w-full text-left">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-extrabold text-xs text-emerald-400 font-sans">Martelo (Hammer)</span>
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold uppercase">Mola de Chão</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                        Tem o <strong>corpinho gordinho no topo</strong> e uma <strong>linha super longa esticada para baixo</strong>.
                      </p>
                      <p className="text-[11px] text-zinc-500 font-sans leading-normal">
                        <strong className="text-emerald-300 font-medium">Como Funciona:</strong> O time vermelho tentou empurrar o preço ladeira abaixo para furar o chão. Porém, as forças compradoras esticaram um elástico invisível e puxaram o preço de volta com tudo. É sinal clássico de cansaço da queda e que o preço quer subir rápido!
                      </p>
                    </div>
                  </div>

                  {/* Estrela Cadente Card */}
                  <div className="bg-[#111] p-4 rounded-xl border border-zinc-850 hover:border-zinc-705 transition flex flex-col md:flex-row gap-4 items-center md:items-start group">
                    <div className="w-16 h-28 bg-rose-950/20 rounded-lg flex flex-col items-center justify-center border border-rose-500/20 px-2 shrink-0 relative overflow-hidden">
                      <div className="absolute inset-x-0 top-0 bg-rose-500/5 h-1/2 pointer-events-none"></div>
                      <svg className="w-8 h-20" viewBox="0 0 32 80">
                        <line x1="16" y1="10" x2="16" y2="48" stroke="#f43f5e" strokeWidth="2" />
                        <rect x="8" y="48" width="16" height="12" fill="#f43f5e" rx="1.5" />
                        <line x1="16" y1="60" x2="16" y2="70" stroke="#f43f5e" strokeWidth="1.5" />
                      </svg>
                      <span className="text-[8px] font-mono font-extrabold text-rose-400 uppercase tracking-widest mt-1">Estrela</span>
                    </div>

                    <div className="space-y-1 w-full text-left">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-extrabold text-xs text-rose-400 font-sans">Estrela Cadente</span>
                        <span className="text-[9px] bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded font-mono font-bold uppercase">Balão no Teto</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                        Tem o <strong>corpinho gordinho embaixo</strong> e uma <strong>linha super comprida espetada para cima</strong>.
                      </p>
                      <p className="text-[11px] text-zinc-500 font-sans leading-normal">
                        <strong className="text-rose-300 font-medium">Como Funciona:</strong> O preço tentou voar livre pelas nuvens de alta, mas bateu a cabeça contra um teto de concreto impiedoso e foi arremessado de volta para as profundezas. É sinal claro de debilidade compradora e provável ladeira abaixo!
                      </p>
                    </div>
                  </div>

                  {/* Pião Card */}
                  <div className="bg-[#111] p-4 rounded-xl border border-zinc-850 hover:border-zinc-705 transition flex flex-col md:flex-row gap-4 items-center md:items-start group">
                    <div className="w-16 h-28 bg-amber-950/20 rounded-lg flex flex-col items-center justify-center border border-amber-500/20 px-2 shrink-0 relative overflow-hidden">
                      <div className="absolute inset-0 bg-amber-500/[0.01] pointer-events-none"></div>
                      <svg className="w-8 h-20" viewBox="0 0 32 80">
                        <line x1="16" y1="10" x2="16" y2="34" stroke="#f59e0b" strokeWidth="1.5" />
                        <rect x="8" y="34" width="16" height="12" fill="#f59e0b" rx="1.5" />
                        <line x1="16" y1="46" x2="16" y2="70" stroke="#f59e0b" strokeWidth="1.5" />
                      </svg>
                      <span className="text-[8px] font-mono font-extrabold text-amber-400 uppercase tracking-widest mt-1">Pião</span>
                    </div>

                    <div className="space-y-1 w-full text-left">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-extrabold text-xs text-amber-400 font-sans">Pião (Spinning Top)</span>
                        <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-mono font-bold uppercase">Empate Zonzo</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                        Tem um <strong>corpo minúsculo centralizado</strong> e "antenas" compridas iguais nos dois extremos.
                      </p>
                      <p className="text-[11px] text-zinc-500 font-sans leading-normal">
                        <strong className="text-amber-300 font-medium">Como Funciona:</strong> O preço rodou de um lado para o outro como um pião zonzo, mas ambos os times terminaram em empate rigoroso, sem nenhum avanço real. Significa indecisão máxima de mercado: evite agir agora até o vento tomar uma direção fixa!
                      </p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Guia Rápido de Estratégias */}
              <div className="border-t border-zinc-805 pt-5 mt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🗺️</span>
                  <h4 className="font-extrabold text-xs text-amber-200 uppercase tracking-widest font-sans">
                    Guia Rápido de Estratégias: Como Ler o Terreno do Preço
                  </h4>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  
                  {/* Rompimento Card */}
                  <div className="bg-[#111] p-4 rounded-xl border border-zinc-850 hover:border-zinc-705 transition flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-extrabold text-xs text-amber-300 font-sans">1. Rompimento de Barreira</span>
                        <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-mono font-bold">Estouro</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                        A força compradora ou vendedora acumula tanta pressão que o preço estoura direto pelo teto ou pelo chão, seguindo em disparada na direção do rompimento.
                      </p>
                    </div>

                    {/* Miniature SVG Illustration */}
                    <div className="h-20 w-full bg-zinc-950/80 rounded-lg relative overflow-hidden flex items-center justify-center border border-zinc-90">
                      <svg className="w-full h-full px-4" viewBox="0 0 200 80">
                        {/* Ceilling Line */}
                        <line x1="10" y1="35" x2="190" y2="35" stroke="#f43f5e" strokeWidth="1" strokeDasharray="3,3" />
                        <text x="12" y="30" fill="#f43f5e" className="text-[8px] font-semibold opacity-75 font-sans">TETO DE RESISTÊNCIA</text>
                        {/* Price movement breaking ceiling */}
                        <path d="M 20 60 Q 50 50 80 50 T 130 35 T 180 15" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" />
                        {/* Glowing dot representing breakout */}
                        <circle cx="130" cy="35" r="3" fill="#34d399" className="animate-ping" />
                        <circle cx="130" cy="35" r="2" fill="#34d399" />
                        {/* Text explanation */}
                        <text x="135" y="45" fill="#34d399" className="text-[9px] font-bold font-sans">ESCAPOU DE VEZ! 🚀</text>
                      </svg>
                    </div>

                    <div className="text-[11px] bg-zinc-900/60 p-2 rounded-lg border border-zinc-850">
                      <span className="font-semibold text-zinc-300 block mb-0.5">Como agir:</span>
                      <span className="text-zinc-400 block leading-tight">Espere a vela fechar totalmente fora do teto/chão e siga o fluxo rápido do estouro.</span>
                    </div>
                  </div>

                  {/* Pullback Card */}
                  <div className="bg-[#111] p-4 rounded-xl border border-zinc-850 hover:border-zinc-705 transition flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-extrabold text-xs text-blue-300 font-sans">2. Pullback / O Apoio Primordial</span>
                        <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded font-mono font-bold">Reteste</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                        Logo após estourar uma barreira, o preço recua temporariamente só para testar e "pisar com cuidado" no antigo teto (que agora vira um novo chão firme), antes de continuar subindo.
                      </p>
                    </div>

                    {/* Miniature SVG Illustration */}
                    <div className="h-20 w-full bg-zinc-950/80 rounded-lg relative overflow-hidden flex items-center justify-center border border-zinc-90">
                      <svg className="w-full h-full px-4" viewBox="0 0 200 80">
                        {/* Old ceiling now acting as floor */}
                        <line x1="10" y1="45" x2="190" y2="45" stroke="#3b82f6" strokeWidth="1" strokeDasharray="3,3" />
                        <text x="12" y="40" fill="#3b82f6" className="text-[8px] font-semibold opacity-75 font-sans">ANTIGO TETO (AGORA CHÃO)</text>
                        {/* Price movement breaking ceiling, then testing it, then launching up */}
                        <path d="M 20 65 Q 40 55 70 30 T 110 45 Q 120 45 140 25 T 180 15" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" />
                        {/* Point of pullback test */}
                        <circle cx="110" cy="45" r="3.5" fill="#f59e0b" className="animate-ping" />
                        <circle cx="110" cy="45" r="2" fill="#f59e0b" />
                        <text x="115" y="55" fill="#f59e0b" className="text-[9px] font-bold font-sans">PISADA DE APOIO! 🎯</text>
                      </svg>
                    </div>

                    <div className="text-[11px] bg-zinc-900/60 p-2 rounded-lg border border-zinc-850">
                      <span className="font-semibold text-zinc-300 block mb-0.5">Como agir:</span>
                      <span className="text-zinc-400 block leading-tight">Aproveite o exato momento que o preço recua e "quica" sobre o novo chão para comprar seguro e barato.</span>
                    </div>
                  </div>

                  {/* Reversão Card */}
                  <div className="bg-[#111] p-4 rounded-xl border border-zinc-850 hover:border-zinc-705 transition flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-extrabold text-xs text-rose-300 font-sans">3. Reversão de Força</span>
                        <span className="text-[10px] bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded font-mono font-bold">Virada do Vento</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                        O preço sobe/desce muito forte, mas ao se aproximar de um teto rígido ou chão profundo, as velas demonstram cansaço e rejeição extrema, revertendo a direção do mercado.
                      </p>
                    </div>

                    {/* Miniature SVG Illustration */}
                    <div className="h-20 w-full bg-zinc-950/80 rounded-lg relative overflow-hidden flex items-center justify-center border border-zinc-90">
                      <svg className="w-full h-full px-4" viewBox="0 0 200 80">
                        {/* Rugged ceiling that the price fails to cross */}
                        <line x1="10" y1="20" x2="190" y2="20" stroke="#f43f5e" strokeWidth="1" />
                        <text x="12" y="15" fill="#f43f5e" className="text-[8px] font-semibold opacity-75 font-sans">TETO RÍGIDO (RESISTÊNCIA)</text>
                        {/* Price climbing, failing with tail, then tumbling down */}
                        <path d="M 20 65 Q 40 45 80 30 Q 95 18 100 23 T 115 45 T 160 70 M 100 23 L 100 15" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
                        {/* Candle wick at the top limit */}
                        <circle cx="100" cy="15" r="1.5" fill="#f43f5e" />
                        <text x="108" y="28" fill="#f43f5e" className="text-[9px] font-bold font-sans">BATEU E VOLTOU! ⛔</text>
                      </svg>
                    </div>

                    <div className="text-[11px] bg-zinc-900/60 p-2 rounded-lg border border-zinc-850">
                      <span className="font-semibold text-zinc-300 block mb-0.5">Como agir:</span>
                      <span className="text-zinc-400 block leading-tight">Ao ver uma vela de cansaço ou pavio longo contra o teto/chão, prepare-se para apostar no rumo contrário do vento.</span>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 1 CONTENT GROUPS */}
        {activeTab === "scanner" && (
          <>
            {/* INPUT AND PRESETS CONTROLS BLOCK */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* DRAG-AND-DROP UPLOAD & PRESET CARD (width: col-span-7) */}
          <div id="card-uploader" className="lg:col-span-12 xl:col-span-8 bg-[#18181b] border border-[#27272a] rounded-2xl p-5 md:p-6 flex flex-col justify-between space-y-5 transition-all">
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <h3 className="font-bold text-sm tracking-widest uppercase text-[#a1a1aa]">
                    1. Enviar Print do Gráfico ou Escolher Exemplo Didático
                  </h3>
                </div>
                <span className="text-xs text-[#a1a1aa] bg-[#111] px-2.5 py-1 rounded border border-zinc-800">
                  {uploadedPhotos.length} {uploadedPhotos.length === 1 ? 'imagem carregada' : 'imagens carregadas'}
                </span>
              </div>

              {/* Presets fast picker */}
              <div className="mb-5">
                <span className="text-xs text-[#a1a1aa] block mb-2 font-medium">
                  Clique em um dos gráficos de exemplo para ver a mágica da IA acontecendo na prática:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {PRESET_CHARTS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => loadPreset(preset)}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all group relative active:scale-[0.98] cursor-pointer ${
                        selectedPresetId === preset.id
                          ? "bg-rose-500/10 border-rose-500/70 text-white shadow-md shadow-rose-950/10"
                          : "bg-[#111112] border-zinc-800 text-[#a1a1aa] hover:border-zinc-700 hover:text-white"
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                            preset.analysis.tendencia === "Alta" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                            preset.analysis.tendencia === "Baixa" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                            "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}>
                            {preset.analysis.tendencia}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">{preset.asset}</span>
                        </div>
                        <h4 className="font-bold text-xs text-white line-clamp-1 group-hover:text-rose-400 transition-colors">
                          {preset.title}
                        </h4>
                        <p className="text-[11px] text-zinc-500 line-clamp-1 mt-1 font-sans">
                          {preset.timeframe}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-zinc-900">
                        <span className="text-[10px] text-zinc-400">Ver Análise</span>
                        <ArrowRight className="h-3 w-3 text-zinc-500 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* File Uploader Zone */}
              <div 
                id="uploader-drop-zone"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  isDragging 
                    ? "bg-rose-950/15 border-rose-500/80 text-rose-300"
                    : "bg-[#111112] border-zinc-800 hover:border-zinc-700 text-[#a1a1aa]"
                }`}
              >
                <input 
                  type="file" 
                  id="graph-file-input" 
                  multiple 
                  accept="image/*" 
                  onChange={handleFileChange}
                  className="hidden" 
                />
                
                <label htmlFor="graph-file-input" className="cursor-pointer block space-y-3">
                  <div className="mx-auto w-12 h-12 bg-[#18181b] border border-zinc-800 text-zinc-400 rounded-full flex items-center justify-center transition-transform hover:scale-105">
                    <UploadCloud className="h-6 w-6 text-rose-500" />
                  </div>
                  <div>
                    <span className="text-white text-sm font-semibold block">
                      Arraste e solte o seu print de gráfico aqui ou <span className="text-rose-500 underline hover:text-rose-400">escolha do seu celular ou PC</span>
                    </span>
                    <span className="text-xs text-zinc-550 block mt-1">
                      Suporta prints do MetaTrader, TradingView, IQ Option, Profit ou qualquer outra plataforma!
                    </span>
                  </div>
                </label>
              </div>

              {/* Uploaded Images List */}
              {uploadedPhotos.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-zinc-400 px-1">
                    <span>IMAGENS SELECIONADAS:</span>
                    <button 
                      onClick={() => setUploadedPhotos([])}
                      className="text-rose-400 hover:underline hover:text-rose-300"
                    >
                      Limpar tudo
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {uploadedPhotos.map((photo, index) => (
                      <div key={photo.id} className="relative bg-[#111] border border-zinc-800 rounded-lg p-2 flex flex-col group overflow-hidden">
                        <img 
                           src={photo.base64} 
                          alt={photo.name} 
                          className="h-20 w-full object-cover rounded-md cursor-zoom-in hover:brightness-110 transition"
                          onClick={() => setPreviewImage(photo.base64)}
                        />
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[10px] text-zinc-400 truncate max-w-[80%]" title={photo.name}>
                            {index + 1}. {photo.name}
                          </span>
                          <button 
                            onClick={() => removeUploadedPhoto(photo.id)}
                            className="bg-black/80 hover:bg-rose-500 hover:text-white p-1 rounded text-zinc-400 text-xs transition"
                            title="Remover imagem"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {/* Fast add photo thumbnail block */}
                    <label 
                      htmlFor="graph-file-input-extra" 
                      className="border border-dashed border-zinc-800 hover:border-rose-500/50 hover:bg-rose-500/5 rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer transition text-zinc-500 h-[116px]"
                    >
                      <input 
                        type="file" 
                        id="graph-file-input-extra" 
                        multiple 
                        accept="image/*" 
                        onChange={handleFileChange}
                        className="hidden" 
                      />
                      <Plus className="h-5 w-5 mb-1 text-rose-500/75" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 text-center">Adicionar Outra</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Error messaging bar */}
            {analysisError && (
              <div className="p-3 bg-red-950/20 border border-red-500/40 text-red-300 rounded-xl text-xs flex gap-2.5 items-start">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                <div>
                  <span className="font-bold block">Erro na Leitura:</span>
                  <p>{analysisError}</p>
                </div>
              </div>
            )}

            {/* Core activation action */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-zinc-800">
              <div className="flex items-center gap-1.5 text-xs text-zinc-450">
                <Sparkles className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                <span>Nossa Inteligência Artificial vai traduzir o desenho das velas de preço em português simples!</span>
              </div>
              <button
                id="main-analyze-btn"
                onClick={handleAnalyzeGraph}
                disabled={isAnalyzing || uploadedPhotos.length === 0}
                className={`py-3 px-6 rounded-xl font-bold text-sm tracking-wide transition-all shadow flex items-center justify-center gap-2 cursor-pointer ${
                  uploadedPhotos.length === 0
                    ? "bg-zinc-800 border border-zinc-700 text-zinc-500 cursor-not-allowed"
                    : isAnalyzing
                    ? "bg-rose-950 border border-rose-500 text-rose-200 cursor-wait"
                    : "bg-rose-500 hover:bg-rose-600 text-white hover:shadow-lg active:scale-95"
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-rose-400" />
                    IA Traduzindo Gráfico...
                  </>
                ) : (
                  <>
                    <Compass className="h-4 w-4" />
                    Traduzir Gráfico Enviado IP
                  </>
                )}
              </button>
            </div>

          </div>

          {/* HISTORIC SCANS JOURNAL (width: col-span-5) */}
          <div id="card-history" className="lg:col-span-12 xl:col-span-4 bg-[#18181b] border border-[#27272a] rounded-2xl p-5 md:p-6 flex flex-col justify-between space-y-4">
            
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-rose-500" />
                  <h3 className="font-bold text-sm tracking-widest uppercase text-[#a1a1aa]">
                    Meu Histórico de Gráficos
                  </h3>
                </div>
                <span className="bg-[#111] px-2 py-0.5 rounded text-[11px] text-zinc-400 font-mono">
                  {history.length} salvos
                </span>
              </div>
              
              <p className="text-xs text-[#a1a1aa] mb-4">
                Suas análises concluídas ficam guardadas de forma segura no seu próprio navegador para você consultar quando quiser.
              </p>

              {history.length === 0 ? (
                <div className="border border-dashed border-zinc-800 rounded-xl p-8 text-center text-[#a1a1aa] space-y-2.5">
                  <BookOpen className="h-8 w-8 mx-auto text-zinc-650" />
                  <p className="text-xs">
                    Nenhum gráfico analisado ainda. Envie uma imagem para começar a sua coleção!
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1 custom-scrollbar">
                  {history.map((item) => {
                    const localActionColor = getActionColorDetails(item.acaoRecomendada);
                    return (
                      <div
                        key={item.id}
                        onClick={() => loadHistoryItem(item)}
                        className={`p-3 rounded-xl border bg-[#111112] hover:bg-zinc-900 transition flex items-center justify-between cursor-pointer group border-zinc-800 hover:border-zinc-700`}
                      >
                        <div className="space-y-1 max-w-[80%]">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white tracking-tight">
                              {item.ativoCooptado}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              ({item.tempoGrafico})
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5 text-[10.5px]">
                            <span className={`font-semibold px-1 py-0.2 rounded text-[10px] ${localActionColor.bg} border ${localActionColor.bg}`}>
                              {localActionColor.label}
                            </span>
                            <span className="text-zinc-500">
                              {item.timestamp}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            Restaurar
                          </span>
                          <button
                            onClick={(e) => deleteHistoryItem(item.id, e)}
                            className="text-zinc-600 hover:text-rose-400 p-1 rounded bg-zinc-900 group-hover:bg-zinc-800 transition"
                            title="Deletar do diário"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-zinc-800/80 pt-3 flex items-center justify-between text-xs text-zinc-500">
              <span>Foco em scalping M5 e M15</span>
              <span>CandleScan Engine</span>
            </div>

          </div>

        </div>

        {/* LOADING PROGRESS SENSE */}
        {isAnalyzing && (
          <div className="animate-pulse bg-[#1a1515] border border-rose-900/30 rounded-xl p-4 flex items-center gap-4 text-rose-300">
            <RefreshCw className="h-5 w-5 animate-spin shrink-0 text-rose-500" />
            <div className="text-xs w-full">
              <div className="flex justify-between font-bold mb-1">
                <span>INTELIGÊNCIA ARTIFICIAL DETECTANDO PADRÕES...</span>
                <span>STATUS: PROCESSANDO</span>
              </div>
              <div className="w-full bg-[#111] h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 animate-[loading_1.5s_ease-in-out_infinite]" style={{ width: '40%' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* METADATA SPECIFIC SECTION: THE BENTO GRID */}
        <section id="results-bento-grid" className="bento-container grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Contextual Success Alert Banner */}
          {showSuccessToast && (
            <div 
              id="contextual-success-alert"
              className="col-span-12 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center justify-between gap-3 animate-pulse"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
                <span className="font-bold">✓ RESULTADOS ATUALIZADOS:</span>
                <span className="text-zinc-300">{toastMessage}</span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 px-2.5 py-1 rounded font-mono uppercase font-bold text-emerald-300">
                Pronto para Estudo
              </span>
            </div>
          )}

          {/* Rompimento Alert (col-span-12) */}
          {activeAnalysis.rompimentoDetectado && (() => {
            const isUpBreakout = activeAnalysis.tendencia?.includes("Alta") || activeAnalysis.tendencia?.includes("up") || activeAnalysis.tendencia?.toLowerCase().includes("sub");
            const isDownBreakout = activeAnalysis.tendencia?.includes("Baixa") || activeAnalysis.tendencia?.includes("down") || activeAnalysis.tendencia?.toLowerCase().includes("cai");
            
            const variant = isUpBreakout 
              ? {
                  bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:border-emerald-500/50",
                  iconBg: "bg-emerald-500/20 text-emerald-400",
                  badge: "Rompimento do Teto (Resistência)",
                  badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
                  title: "🔥 ALERTA DE ROMPIMENTO: VOLATILIDADE ALTA COMPRADORA!",
                  icon: <TrendingUp className="h-5 w-5 animate-bounce" />
                }
              : isDownBreakout
              ? {
                  bg: "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:border-rose-500/50",
                  iconBg: "bg-rose-500/20 text-rose-400",
                  badge: "Rompimento do Piso (Suporte)",
                  badgeBg: "bg-rose-500/20 text-rose-300 border-rose-500/30",
                  title: "⚠️ ALERTA DE ROMPIMENTO: VOLATILIDADE ALTA VENDEDORA!",
                  icon: <TrendingDown className="h-5 w-5 animate-bounce" />
                }
              : {
                  bg: "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:border-amber-500/50",
                  iconBg: "bg-amber-500/20 text-amber-400",
                  badge: "Tendência Acelerada",
                  badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/30",
                  title: "⚠️ ALERTA DE ROMPIMENTO DETECTADO!",
                  icon: <Sparkles className="h-5 w-5 animate-pulse" />
                };

            return (
              <div 
                id="breakout-alert-card"
                className={`card col-span-12 p-5 border-2 rounded-xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between text-left transition-all duration-300 ${variant.bg}`}
              >
                <div className="flex gap-4 items-start">
                  <div className={`p-3 rounded-xl shrink-0 ${variant.iconBg}`}>
                    {variant.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-black tracking-wider uppercase flex items-center gap-2">
                      {variant.title}
                    </h3>
                    <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                      {activeAnalysis.rompimentoComentario || "O preço cruzou e fechou fora de uma barreira de preço chave, indicando aceleração dramática e força extrema da nova tendência."}
                    </p>
                  </div>
                </div>
                <div className={`text-[10px] font-mono font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-lg border shrink-0 ${variant.badgeBg}`}>
                  {variant.badge}
                </div>
              </div>
            );
          })()}
          
          {/* Bento Cell 1: Asset Information and Simulated Graph Representation (grid-col: span 8, row: span 3) */}
          <div className="card md:col-span-8 p-5 bg-[#18181b] border border-[#27272a] rounded-xl flex flex-col justify-between focus-within:ring-1 focus-within:ring-rose-500 transition-all">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
              <div>
                <span className="card-title text-xs font-semibold uppercase tracking-wider text-zinc-500 block mb-1">
                  Ativo Lido & Tempo de Cada Vela
                </span>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-2xl font-bold tracking-tight text-white font-mono">
                    {activeAnalysis.ativoCooptado || "Velas"}
                  </h2>
                  <span className="bg-[#111] px-2 py-0.5 rounded text-xs font-mono text-[#a1a1aa] border border-zinc-800">
                    {activeAnalysis.tempoGrafico || "Consulte um gráfico"}
                  </span>
                </div>
              </div>

              {/* Status Indicator */}
              <motion.div 
                key={`status-ind-${activeAnalysis.tendencia || 'lateral'}`}
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="flex items-center gap-2 rounded bg-zinc-900 px-4 py-1.5 border border-zinc-800 text-xs w-md-fit"
              >
                <span className="font-medium text-zinc-400">Direção do Preço:</span>
                <motion.span 
                  initial={{ scale: 0.8 }}
                  animate={{ scale: [0.8, 1.1, 1] }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className={`font-bold px-2 py-0.5 rounded uppercase tracking-wide text-[10.5px] ${
                    activeAnalysis.tendencia?.includes("Alta") || activeAnalysis.tendencia?.includes("up") || activeAnalysis.tendencia?.includes("Subindo") ? "bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.1)]" :
                    activeAnalysis.tendencia?.includes("Baixa") || activeAnalysis.tendencia?.includes("down") || activeAnalysis.tendencia?.includes("Caindo") ? "bg-rose-500/15 border border-rose-500/20 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.1)]" :
                    "bg-amber-500/15 border border-amber-500/20 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.1)]"
                  }`}
                >
                  {activeAnalysis.tendencia || "Andando de Lado"}
                </motion.span>
              </motion.div>
            </div>

            {/* Candle illustration representing selected preset style graph */}
            <div className="mt-2 text-xs text-zinc-500 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#fafafa] tracking-wide flex items-center gap-1.5">
                  <Sliders className="h-3 w-3 text-rose-500" />
                  Módulo de Força do Preço (Mais Velas de Alta vs Queda)
                </span>
                <span className="text-[10px] text-zinc-500">Visualização de Força</span>
              </div>
              
              {/* Dynamic visual graph mock */}
              <div id="price-levels-guide-graph" className="h-28 bg-gradient-to-t from-zinc-950 to-zinc-900/60 border border-zinc-800/80 rounded-lg p-3 relative overflow-hidden group/graph select-none">
                {/* Horizontal guidlines mapping for price boundaries */}
                {activeAnalysis.resistencia !== "Não identificada" && activeAnalysis.resistencia && (
                  <motion.div 
                    key={`res-line-${activeAnalysis.resistencia}`}
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: "100%", opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="absolute left-0 right-0 top-[25%] border-t border-dashed border-rose-500/40 pointer-events-none z-10 transition-colors"
                  >
                    <motion.span 
                      initial={{ scale: 0, x: -10 }}
                      animate={{ scale: 1, x: 0 }}
                      transition={{ type: "spring", delay: 0.3, stiffness: 280, damping: 18 }}
                      className="absolute left-2 -translate-y-1/2 bg-rose-950/80 border border-rose-500/30 text-rose-300 px-2 py-0.5 rounded-md text-[8px] font-mono whitespace-nowrap tracking-wider flex items-center gap-1 shadow-lg backdrop-blur-xs select-none pointer-events-auto"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block animate-pulse"></span>
                      RESISTÊNCIA (TETO): {getCleanLabel(activeAnalysis.resistencia)}
                    </motion.span>
                  </motion.div>
                )}

                {activeAnalysis.suporte !== "Não identificado" && activeAnalysis.suporte && (
                  <motion.div 
                    key={`sup-line-${activeAnalysis.suporte}`}
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: "100%", opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="absolute left-0 right-0 bottom-[28%] border-t border-dashed border-emerald-500/40 pointer-events-none z-10 transition-colors"
                  >
                    <motion.span 
                      initial={{ scale: 0, x: -10 }}
                      animate={{ scale: 1, x: 0 }}
                      transition={{ type: "spring", delay: 0.3, stiffness: 280, damping: 18 }}
                      className="absolute left-2 -translate-y-1/2 bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-md text-[8px] font-mono whitespace-nowrap tracking-wider flex items-center gap-1 shadow-lg backdrop-blur-xs select-none pointer-events-auto"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                      SUPORTE (PISO): {getCleanLabel(activeAnalysis.suporte)}
                    </motion.span>
                  </motion.div>
                )}

                <div className="absolute top-2 right-2 flex items-center gap-1.5 select-none z-20">
                  <div className="flex items-center gap-1 text-[9px] bg-emerald-950/60 border border-emerald-500/20 px-1.5 py-0.5 rounded-md text-emerald-400 font-bold">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse"></span>
                    ⚡ Vela de Força ({`>`}70% Corpo)
                  </div>
                  <div className="flex items-center gap-1 text-[9px] bg-black/60 border border-zinc-800 px-1.5 py-0.5 rounded-md text-zinc-400">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    Força Recente
                  </div>
                </div>
                {renderDummyGraph(activeAnalysis.tendencia)}
              </div>
              <p className="text-[11px] text-[#a1a1aa] leading-normal">
                *O gráfico acima mostra se o mercado está ganhando ou perdendo força recente. Quando a direção é de <strong>{activeAnalysis.tendencia}</strong>, fique sempre atento às barras de indecisão!
              </p>
            </div>

            {/* Termômetro de Intensidade & Força Visual (MELHORIA #2) */}
            {(() => {
              const intensity = getIntensityDetails(activeAnalysis);
              return (
                <div className="border-t border-zinc-800/60 pt-4 mt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-sans">
                      <span className="text-xs">🌡️</span>
                      <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest leading-none">
                        Termômetro de Energia de Vela & Volume
                      </span>
                    </div>
                    <span className={`text-[10px] uppercase font-mono font-black ${intensity.textColor}`}>
                      {intensity.statusText}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
                    {/* Visual intensity meter */}
                    <div className="md:col-span-5 space-y-1">
                      <div className="flex items-center gap-2">
                        {/* Thermometer Icon container */}
                        <div className="relative flex flex-col items-center justify-center p-1 bg-zinc-950 rounded-lg border border-zinc-850 h-9 w-9 shrink-0">
                          <Thermometer className={`h-5 w-5 ${intensity.textColor} transition-all`} />
                        </div>

                        {/* Interactive Segmented LED Bar */}
                        <div className="w-full space-y-1">
                          <div className="flex items-center justify-between text-[8px] text-zinc-500 font-mono leading-none">
                            <span>FRACA</span>
                            <span>MODERADA</span>
                            <span>FORTE</span>
                          </div>
                          
                          <div className="flex gap-0.5 h-3 items-center w-full">
                            {Array.from({ length: 14 }).map((_, i) => {
                              const tickThreshold = ((i + 1) / 14) * 100;
                              const isActive = intensity.score >= tickThreshold;
                              
                              let activeBg = "bg-zinc-850";
                              if (isActive) {
                                if (intensity.score >= 70) {
                                  activeBg = "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]";
                                } else if (intensity.score >= 40) {
                                  activeBg = "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]";
                                } else {
                                  activeBg = "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]";
                                }
                              } else {
                                activeBg = "bg-zinc-900/60"; // Off-LED color
                              }

                              return (
                                <div 
                                  key={i} 
                                  className={`h-full flex-1 rounded-xs transition-all duration-350 ${activeBg}`}
                                />
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description Analysis details */}
                    <div className="md:col-span-7 bg-zinc-950/60 border border-zinc-900 px-3 py-2 rounded-lg text-[11px] leading-relaxed">
                      <span className={`font-extrabold block text-[10px] uppercase tracking-wide mb-0.5 ${intensity.textColor}`}>
                        {intensity.levelLabel} ({intensity.score}% de Força)
                      </span>
                      <p className="text-zinc-400 text-[10.5px] leading-normal font-sans">
                        {intensity.description}
                      </p>
                    </div>

                  </div>
                </div>
              );
            })()}

          </div>

          {/* Bento Cell 2: Recommendation Box (grid-col: span 4, row: span 2) */}
          <motion.div 
            key={`rec-box-${activeAnalysis.acaoRecomendada}`}
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            whileHover={{ scale: 1.015, boxShadow: "0px 10px 30px rgba(0,0,0,0.4)" }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
            className={`card md:col-span-4 p-5 rounded-xl border flex flex-col justify-between transition-all ${actionCfg.bg} ${actionCfg.glow} border-2`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="card-title text-[10px] font-bold uppercase tracking-wider block opacity-85">
                  Recomendação Prática de Ação
                </span>
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${actionCfg.radar}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${actionCfg.radar}`}></span>
                </span>
              </div>
              
              <motion.div 
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 15, delay: 0.1 }}
                className="text-4xl md:text-5xl font-black tracking-tight font-sans leading-none my-3"
              >
                {actionCfg.label}
              </motion.div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold opacity-90">
                O que fazer agora de forma simples:
              </div>
              <p className="text-xs opacity-90 leading-relaxed bg-black/30 p-2.5 rounded-lg border border-white/5">
                No momento, o estado de força é de <strong className="underline decoration-dotted">{activeAnalysis.momento || "Dúvida"}</strong>. 
                Use sempre o Limite de Segurança automático para proteger seu dinheiro.
              </p>
            </div>
          </motion.div>

          {/* Bento Cell 3: Confidence Score & Verification Gauge (grid-col: span 4, row: span 2) */}
          <motion.div 
            key={`confidence-cell-${activeAnalysis.nivelConfianca}`}
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            whileHover={{ scale: 1.015 }}
            transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.04 }}
            className="card md:col-span-4 p-5 bg-[#18181b] border border-[#27272a] rounded-xl flex flex-col justify-between transition-all hover:border-zinc-700 hover:shadow-lg"
          >
            <div>
              <span className="card-title text-xs font-semibold uppercase tracking-wider text-[#a1a1aa] block mb-2">
                Segurança do Conselho (IA)
              </span>
              <div className="flex items-baseline gap-1.5">
                <motion.span 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-3xl font-black text-white"
                >
                  {activeAnalysis.nivelConfianca || "Médio"}
                </motion.span>
                <span className="text-xs text-zinc-500">
                  ({getConfidencePercentage(activeAnalysis.nivelConfianca)}% de certeza)
                </span>
              </div>
            </div>

            <div>
              {/* Confidence Meter Style widget */}
              <div className="confidence-meter w-full bg-zinc-800 h-2 rounded-full overflow-hidden relative mt-2 mb-4">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${getConfidencePercentage(activeAnalysis.nivelConfianca)}%` }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                  className="confidence-bar absolute left-0 top-0 h-full bg-gradient-to-r from-rose-500 to-rose-400 rounded-full"
                ></motion.div>
              </div>
              <p className="text-xs text-[#a1a1aa] leading-normal font-sans">
                Indica o quanto a nossa Inteligência Artificial está convicta dessa análise baseado nas estatísticas das imagens.
              </p>
            </div>
          </motion.div>

          {/* Bento Cell 4: Entry Strategy Targets & Stop parameters (grid-col: span 4, row: span 2) */}
          <motion.div 
            key={`targets-cell-${activeAnalysis.tipoEntrada}`}
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            whileHover={{ scale: 1.015 }}
            transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.08 }}
            className="card md:col-span-4 p-5 bg-[#18181b] border border-[#27272a] rounded-xl flex flex-col justify-between transition-all hover:border-zinc-700 hover:shadow-lg"
          >
            <div className="space-y-1">
              <span className="card-title text-xs font-semibold uppercase tracking-wider text-[#a1a1aa] block mb-1">
                Planejamento da Operação Simplificado
              </span>
              <motion.div 
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
                className="inline-block bg-[#111] px-2 py-0.5 rounded text-[10px] font-bold text-rose-400 tracking-wider uppercase border border-rose-500/10"
              >
                Como agir: {activeAnalysis.tipoEntrada || "Aguardar"}
              </motion.div>
            </div>

            <div className="grid grid-cols-2 gap-3.5 mt-3.5">
              
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, type: "spring" }}
                className="bg-[#111112] border border-zinc-800 p-2.5 rounded-lg text-left group hover:border-[#27272a] relative"
              >
                <span className="text-[10px] text-[#a1a1aa] uppercase font-semibold block mb-0.5">Preço recomendado</span>
                <div className="text-xs font-mono text-amber-400 font-bold tracking-tight">
                  {activeAnalysis.pontoEntrada || "---"}
                </div>
                <button 
                  onClick={() => triggerCopy(activeAnalysis.pontoEntrada, "pontoEntrada")}
                  className="absolute right-1.5 top-1.5 text-zinc-600 hover:text-[#fafafa] transition opacity-0 group-hover:opacity-100 p-0.5"
                  title="Copiar Entrada"
                >
                  {copiedField === "pontoEntrada" ? <span className="text-[9px] text-green-400">Copet!</span> : <Copy className="h-3 w-3" />}
                </button>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.26, type: "spring" }}
                className="bg-[#111112] border border-zinc-800 p-2.5 rounded-lg text-left group hover:border-red-900/30 relative"
              >
                <span className="text-[10px] text-rose-400 uppercase font-semibold block mb-0.5">Cinto de segurança</span>
                <div className="text-xs font-mono text-rose-500 font-bold tracking-tight">
                  {activeAnalysis.stopLoss || "---"}
                </div>
                <button 
                  onClick={() => triggerCopy(activeAnalysis.stopLoss, "stopLoss")}
                  className="absolute right-1.5 top-1.5 text-zinc-600 hover:text-rose-400 transition opacity-0 group-hover:opacity-100 p-0.5"
                  title="Copiar Stop Loss"
                >
                  {copiedField === "stopLoss" ? <span className="text-[9px] text-green-400">Copet!</span> : <Copy className="h-3 w-3" />}
                </button>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="bg-[#111112] border border-zinc-800 p-2.5 rounded-lg text-left col-span-2 group hover:border-emerald-900/30 relative flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] text-emerald-400 uppercase font-semibold block mb-0.5">Meta para colocar Lucro no Bolso</span>
                  <div className="text-xs font-mono text-emerald-400 font-bold tracking-tight">
                    {activeAnalysis.alvo || "---"}
                  </div>
                </div>
                <button 
                  onClick={() => triggerCopy(activeAnalysis.alvo, "alvo")}
                  className="text-zinc-650 hover:text-emerald-400 transition opacity-0 group-hover:opacity-100 p-1"
                  title="Copiar Alvo"
                >
                  {copiedField === "alvo" ? <span className="text-[9px] text-green-400">Copiou!</span> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </motion.div>

            </div>
          </motion.div>

          {/* Bento Cell 5: Support & Resistance Zones (grid-col: span 4, row: span 2) */}
          <motion.div 
            key={`supres-cell-${activeAnalysis.suporte}-${activeAnalysis.resistencia}`}
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            whileHover={{ scale: 1.015 }}
            transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.12 }}
            className="card md:col-span-4 p-5 bg-[#18181b] border border-[#27272a] rounded-xl flex flex-col justify-between transition-all hover:border-zinc-700 hover:shadow-lg"
          >
            <div>
              <span className="card-title text-xs font-semibold uppercase tracking-wider text-[#a1a1aa] block mb-2">
                Piso e Teto Protetores do Preço
              </span>
              
              <div className="space-y-3">
                <motion.div 
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex justify-between items-start border-b border-zinc-800/80 pb-2"
                >
                  <div>
                    <span className="text-[10px] text-[#a1a1aa] block uppercase font-semibold">Teto Caro (Resistência)</span>
                    <span className="text-white font-mono text-xs font-bold leading-none mt-1 inline-block">
                      {activeAnalysis.resistencia || "Não identificada"}
                    </span>
                  </div>
                  <button 
                    onClick={() => triggerCopy(activeAnalysis.resistencia, "resistencia")}
                    className="text-zinc-600 hover:text-white p-1 rounded hover:bg-[#111]"
                    title="Copiar Resistência"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.28 }}
                  className="flex justify-between items-start pt-1"
                >
                  <div>
                    <span className="text-[10px] text-[#a1a1aa] block uppercase font-semibold">Piso Barato (Suporte)</span>
                    <span className="text-white font-mono text-xs font-bold leading-none mt-1 inline-block">
                      {activeAnalysis.suporte || "Não identificado"}
                    </span>
                  </div>
                  <button 
                    onClick={() => triggerCopy(activeAnalysis.suporte, "suporte")}
                    className="text-zinc-600 hover:text-white p-1 rounded hover:bg-[#111]"
                    title="Copiar Suporte"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </motion.div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-800/80 text-[10px] text-zinc-500 leading-normal">
              Dica simples: O suporte funciona como o chão que impede o preço de cair mais de onde ele está, e a resistência funciona como o teto que impede o preço de subir mais do que aquilo!
            </div>
          </motion.div>

          {/* Bento Cell 6: Expert Candle Breakdown (grid-col: span 12, full-width) */}
          <div className="card md:col-span-12 p-5 md:p-6 bg-[#18181b] border border-[#27272a] rounded-xl flex flex-col space-y-4 transition-all">
            
            <div className="flex items-center justify-between border-b border-zinc-800/65 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-rose-500" />
                <h3 className="font-extrabold text-sm tracking-widest uppercase text-white">
                  Leitura das Velinhas (Candles) Simplificada
                </h3>
              </div>
              <span className="text-[10px] text-zinc-500">Desenho do Comportamento do Preço</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-sm">
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-rose-400 uppercase tracking-wide">
                  O que as velinhas estão desenhando no gráfico
                </h4>
                <p className="text-[#a1a1aa] leading-relaxed text-xs">
                  {activeAnalysis.leituraCandles || "Envie um gráfico para carregar a leitura explicada de cada velinha em português."}
                </p>
              </div>

              <div className="space-y-2 bg-[#111112] border border-zinc-800/80 p-4 rounded-xl">
                <h4 className="font-bold text-xs text-white uppercase tracking-wide flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-rose-500" />
                  O que tem mais chance de acontecer a seguir
                </h4>
                <p className="text-zinc-400 leading-relaxed text-xs">
                  {activeAnalysis.cenarioProvavel || "A rota de maior probabilidade do preço será mostrada aqui logo após o envio do print."}
                </p>
              </div>
            </div>

            {/* Analyst guidance block */}
            <div className="pt-3 border-t border-zinc-800 flex flex-col sm:flex-row items-start gap-3 bg-rose-950/5 p-4 rounded-xl border-l-4 border-l-rose-500">
              <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-xs text-white block uppercase tracking-wider mb-0.5">
                  Conselho do Mentor para Proteger seu Dinheiro
                </span>
                <p className="text-xs text-[#a1a1aa] leading-relaxed">
                  {activeAnalysis.comentarioAnalista || "Proteja seu bolso: nunca entre em uma operação de trade sem definir um cinto de segurança (Limite de Stop Loss)."}
                </p>
              </div>
            </div>

          </div>

        </section>
          </>
        )}
      </main>

      {/* FOOTER GENERAL */}
      <footer className="border-t border-[#27272a] bg-[#111112] text-xs text-zinc-500 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <div>
            <p className="font-semibold text-zinc-400">
              CandleScan PRO © 2026. Todos os direitos reservados.
            </p>
            <p className="text-[11px] text-zinc-650 mt-1 max-w-lg">
              Isenção de responsabilidade: A leitura automática de candles por inteligência artificial destina-se estritamente para propósitos de simulação didática de curto prazo. Todas as decisões financeiras são de sua responsabilidade exclusiva.
            </p>
          </div>
          <div className="flex gap-4 text-[11px] text-zinc-400">
            <span className="transition hover:text-[#fafafa] cursor-pointer">Termos de Uso</span>
            <span>•</span>
            <span className="transition hover:text-[#fafafa] cursor-pointer">Política de Risco</span>
            <span>•</span>
            <span className="transition hover:text-[#fafafa] cursor-pointer">Suporte ao Trader</span>
          </div>
        </div>
      </footer>

      {/* FULL PREVIEW MODAL FOR ZOOM-IN */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/95 z-55 flex flex-col items-center justify-center p-4">
          <div className="absolute top-4 right-4 flex items-center gap-4">
            <span className="text-xs text-zinc-400 font-mono">Modo de Inspeção Ampliada</span>
            <button 
              onClick={() => setPreviewImage(null)}
              className="bg-zinc-805 text-zinc-400 hover:text-white p-2 rounded-full hover:bg-zinc-800 transition text-sm cursor-pointer border border-zinc-800"
            >
              Fechar Visualização (ESC)
            </button>
          </div>
          <div className="max-w-full max-h-[85vh] overflow-auto flex items-center justify-center rounded-xl border border-zinc-800">
            <img 
              src={previewImage} 
              alt="Visualização Ampliada" 
              className="max-w-full max-h-[80vh] object-contain"
            />
          </div>
        </div>
      )}

      {/* SUCCESS FEEDBACK FLOAT TOAST */}
      {showSuccessToast && (
        <div 
          id="success-toast-feedback" 
          className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-[#121214]/95 border border-emerald-500/30 text-zinc-100 rounded-xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.8)] backdrop-blur-md flex items-start gap-3 transition-all duration-300 transform translate-y-0 scale-100 animate-pulse-subtle"
        >
          <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-400 shrink-0 border border-emerald-500/20">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest font-mono">
                {toastType === "analyze" ? "⚡ Análise Concluída" : toastType === "preset" ? "🎓 Exemplo Carregado" : "📂 Histórico Carregado"}
              </span>
              <button 
                onClick={() => setShowSuccessToast(false)} 
                className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed font-sans">
              {toastMessage}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
