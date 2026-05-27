import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client lazily
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY") {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// AI Consulting Endpoint
app.post("/api/gemini/guidance", async (req, res) => {
  const { leaderName, teamName, sdrStats, assessorStats, month, thermometer } = req.body;

  const thermText = thermometer ? `
    AVANÇO REAL (REALIZADO): ${thermometer.realizedProgress}%
    AVANÇO ESPERADO (ONDE DEVERIA ESTAR): ${thermometer.expectedProgress}%
    GAP LINEAR: ${thermometer.progressGap > 0 ? '+' : ''}${thermometer.progressGap}%
    STATUS DO TERMÔMETRO: ${thermometer.temperature}
    DIAS ELAPSADOS NO MÊS: ${thermometer.currentDaysElapsed} de ${thermometer.totalDaysInMonth} dias
    REALIZADO / META: ${thermometer.totalRealized} de ${thermometer.totalTarget} agendamentos
    FALTAM PARA META: ${thermometer.remainingToGoal}
    RITMO ATUAL: ${thermometer.currentDailyPace} agendamentos/dia
    RITMO NECESSARIO: ${thermometer.requiredDailyPace} agendamentos/dia
    PROJECAO NO FECHAMENTO: ${thermometer.projectedTotal} agendamentos
  ` : "";

  const prompt = `
    Você é o Consultor Executivo de Vendas e CO-PILOTO de IA do time comercial. Suas orientações devem ser diretas, acionáveis e sem enrolação, adotando um tom sofisticado, pragmático e focado em alta performance.
    
    Líder atual: ${leaderName || "Líder Especialista"}
    Equipe supervisionada: ${teamName || "Geral"}
    Mês de Referência: ${month || "Mês Corrente"}
    
    TERMÔMETRO DE METAS DA EQUIPE (Progresso vs Tempo Elapsado):${thermText}
    
    Métricas da Equipe:
    SDRs Ativos: ${JSON.stringify(sdrStats)}
    Assessores Ativos: ${JSON.stringify(assessorStats)}
    
    Por favor, crie uma análise dinâmica dividida em:
    1. **Termômetro de Performance**: Analise o avanço real do time em relação ao esperado para o tempo decorrido do mês. Se estamos atrasados ou adiantados, qual o ritmo de vendas necessário para cobrir a diferença?
    2. **Gargalos Críticos**: Quem na equipe está puxando o avanço para baixo ou com desvio na taxa de conversão esperada?
    3. **Benchmarks**: Quem atingiu ou superou o termômetro hoje?
    4. **Plano de Ação de Resgate**: Descreva um roteiro de 3 passos práticos para elevar o termômetro. Inclua um script altamente persuasivo para abordagem de leads frio no WhatsApp, ajudando os SDRs do time a aumentarem a taxa imediata de conversão.
    
    Escreva de forma sucinta, elegante e extremamente profissional em Português. Use Markdown para formatar. Indique metas de forma clara.
  `;

  try {
    const ai = getGeminiClient();
    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });
      return res.json({ text: response.text });
    } else {
      // Elegant, high-fidelity dynamic fallback insights with realistic team diagnostics if key is missing!
      const elapsedStr = thermometer ? `${thermometer.currentDaysElapsed}/${thermometer.totalDaysInMonth} dias elapsados (${thermometer.expectedProgress}% esperado)` : "";
      const gapSign = thermometer && thermometer.progressGap > 0 ? "+" : "";
      const gapStr = thermometer ? `${gapSign}${thermometer.progressGap}% de gap` : "";
      const tempStr = thermometer ? thermometer.temperature : "ESTÁVEL";
      const totalRel = thermometer ? thermometer.realizedProgress : 0;
      const requiredDailyPace = thermometer?.requiredDailyPace ?? 0;
      const currentDailyPace = thermometer?.currentDailyPace ?? 0;
      const remainingToGoal = thermometer?.remainingToGoal ?? 0;

      const lowPerformers = sdrStats.filter((s: any) => s.agendamentosCount < (s.expectedAgendamentosToday ?? s.metaAgendamentos) || (s.agendamentosCount > 0 && (s.efetivacoesCount / s.agendamentosCount * 100) < s.metaEfetivacaoRate));
      const highPerformers = sdrStats.filter((s: any) => s.agendamentosCount >= s.metaAgendamentos && (s.agendamentosCount > 0 && (s.efetivacoesCount / s.agendamentosCount * 100) >= s.metaEfetivacaoRate));

      let insights = `### 📋 Relatório de Consultoria Operacional (IA Analítica)
      
*Nota: Chave de API indisponível, gerando diagnóstico analítico interno com base nos dados do período.*

#### 1. **🌡️ Termômetro de Performance: ${tempStr}**
- **Progresso Realizado**: **${totalRel}%** vs **${thermometer ? thermometer.expectedProgress : 0}%** esperado para o dia do mês (${elapsedStr}).
- **Diagnostico Temporal**: O time comercial esta com **${gapStr}** em relacao ao ritmo linear ideal. Restam **${remainingToGoal} agendamentos**. O ritmo atual e **${currentDailyPace}/dia** e o ritmo necessario para fechar a meta e **${requiredDailyPace}/dia**.

#### 2. **📉 Gargalos Críticos & Alinhamento**
`;
      if (lowPerformers.length > 0) {
        lowPerformers.forEach((s: any) => {
          const rate = s.agendamentosCount > 0 ? Math.round((s.efetivacoesCount / s.agendamentosCount) * 100) : 0;
          insights += `- **${s.name}**: Está operando abaixo da cota linear (Feito: ${s.agendamentosCount}/${s.expectedAgendamentosToday ?? s.metaAgendamentos} agendamentos esperados hoje, Conversão: ${rate}% vs meta de ${s.metaEfetivacaoRate}%). Seu foco deve ser a blindagem de reuniões antes do fechamento semanal.\n`;
        });
      } else {
        insights += `- Excelente! Todo o time comercial está correspondendo ao avanço cronológico estendido do mês.\n`;
      }

      insights += `
#### 3. **🏆 Benchmarks Internos**
`;
      if (highPerformers.length > 0) {
        highPerformers.forEach((s: any) => {
          insights += `- **${s.name}**: Líder supremo com **${s.agendamentosCount}** reuniões agendadas. Seus métodos de contorno de objeções de assessores devem ser compartilhados via playbook.\n`;
        });
      } else {
        insights += `- Sem benchmarks com meta cheia batida no presente momento. O principal foco agora é alinhamento coletivo.\n`;
      }

      insights += `
#### 4. **⚡ Plano de Resgate & Script Comercial Avançado**
- **Repescagem Diária**: Cruzar contatos que enviaram 'não tenho interesse' na semana anterior.
- **Script para Reaquecer Leads Frios (WhatsApp)**:
  > *"Olá, [Nome do Cliente]! Tudo bem? Entendo que sua rotina de negócios esteja super corrida. Nosso Assessor Sênior acabou de desenhar uma análise curta (15 minutos) do impacto das últimas mudanças tributárias sobre carteiras de investimentos corporativas. Liberei um único horário exclusivo na agenda dele amanhã às 14h ou 16:30h. Qual destes momentos faz mais sentido para proteger seu fluxo?"*
`;
      return res.json({ text: insights });
    }
  } catch (error: any) {
    console.error("AI Generation error:", error);
    return res.status(500).json({ error: "Falha na consultoria de IA.", details: error.message });
  }
});

// Configure Vite middleware / Serve client
async function init() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Full-Stack Server] Running on http://localhost:${PORT}`);
  });
}

init();
