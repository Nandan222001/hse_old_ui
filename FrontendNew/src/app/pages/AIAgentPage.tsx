import { useEffect, useRef, useState, useCallback } from 'react';
import { AlertTriangle, Bot, Lightbulb, Mic, Send, TrendingUp, Zap } from 'lucide-react';
import { chatWithAIAgent, type ChatMessage } from '../../services/ai.service';
import { getViolations } from '../../services/violations.service';
import { getZones } from '../../services/infrastructure.service';
import { FormattedMessage } from '../components/shared/FormattedMessage';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../../api/axiosInstance';

type UiMessage = {
  role: 'user' | 'ai';
  content: string;
  loading?: boolean;
  suggestions?: string[];
};

const STARTER_SUGGESTIONS = [
  'Show top safety risks this week',
  'Which zones have highest incident density?',
  'Give me 5 actions to reduce critical incidents',
];

const RISK_COLORS: Record<string, string> = {
  Critical: '#DC2626',
  High:     '#F59E0B',
  Medium:   '#1D4ED8',
  Low:      '#9CA3AF',
};

export function AIAgentPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'chat' | 'predictive' | 'whatif'>('chat');
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);

  // ── Live data from backend ──────────────────────────────────────────────
  const [riskData, setRiskData] = useState<{ zone: string; risk: string; predicted: number; confidence: number }[]>([]);
  const [insightData, setInsightData] = useState<{ text: string; metric: string }[]>([]);
  const [contextStats, setContextStats] = useState({ totalIncidents: 0, criticalIncidents: 0, totalZones: 0, highRiskZones: 0, openCapa: 0 });
  const [dataLoaded, setDataLoaded] = useState(false);

  const orgLabel = user?.companyName?.trim() || user?.orgCode?.trim() || 'your organization';

  const [messages, setMessages] = useState<UiMessage[]>([
    {
      role: 'ai',
      content: `Hello! I'm your HSE AI assistant for **${orgLabel}**. I have access to your live incident data, CAPA actions, and zone risk levels. Ask me anything about safety, compliance, or risk.`,
      suggestions: STARTER_SUGGESTIONS,
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // ── Fetch live data from backend ────────────────────────────────────────
  const loadLiveData = useCallback(async () => {
    try {
      const [violations, zones, dashStats, riskSummary] = await Promise.all([
        getViolations().catch(() => []),
        getZones().catch(() => []),
        axiosInstance.get('/dashboard/stats').then(r => r.data).catch(() => null),
        axiosInstance.get('/analytics/risk-summary').then(r => r.data).catch(() => null),
      ]);

      const totalIncidents = dashStats?.total_incidents ?? violations.length;
      const criticalIncidents = dashStats?.critical_incidents ?? 0;
      const openCapa = dashStats?.open_capa_actions ?? 0;
      const totalZones = zones.length;
      // Zone/working-station records have no Risk_Score field — derive "high risk"
      // from the real per-site incident counts already returned by risk-summary
      // (same data used to build the Risk panel below), instead of a field that
      // never existed and always evaluated to 0.
      const zoneRiskRows: { zone: string; value: number }[] = riskSummary?.zone_risk ?? [];
      const maxZoneVal = Math.max(...zoneRiskRows.map((z) => z.value), 1);
      const highRiskZones = zoneRiskRows.filter((z) => (z.value / maxZoneVal) * 100 >= 70).length;

      setContextStats({ totalIncidents, criticalIncidents, totalZones, highRiskZones, openCapa });

      // ── Risk cards from backend zone_risk ─────────────────────────────
      const zoneRisk: { zone: string; risk: string; predicted: number; confidence: number }[] = [];
      if (riskSummary?.zone_risk?.length > 0) {
        const maxVal = Math.max(...riskSummary.zone_risk.map((z: any) => z.value), 1);
        riskSummary.zone_risk.slice(0, 3).forEach((z: any) => {
          const pct = (z.value / maxVal) * 100;
          zoneRisk.push({
            zone: z.zone,
            risk: pct >= 70 ? 'Critical' : pct >= 40 ? 'High' : 'Medium',
            predicted: z.value,
            confidence: Math.min(99, 60 + Math.round(pct * 0.35)),
          });
        });
      }
      if (zoneRisk.length === 0) {
        zoneRisk.push(
          { zone: 'Incidents by Zone', risk: criticalIncidents > 3 ? 'Critical' : 'High', predicted: criticalIncidents, confidence: 90 },
          { zone: 'Open CAPA Actions', risk: openCapa > 10 ? 'High' : 'Medium', predicted: openCapa, confidence: 85 },
          { zone: 'Total Incidents', risk: totalIncidents > 20 ? 'High' : 'Medium', predicted: totalIncidents, confidence: 78 },
        );
      }
      setRiskData(zoneRisk);

      // ── Insights from real numbers ────────────────────────────────────
      const insights: { text: string; metric: string }[] = [];
      insights.push({
        text: `${openCapa} CAPA actions are currently open and require resolution`,
        metric: `${openCapa} open actions`,
      });
      if (criticalIncidents > 0) {
        insights.push({ text: 'Critical incidents detected — immediate investigation required', metric: `${criticalIncidents} critical` });
      } else {
        insights.push({ text: 'No critical incidents in the selected period — good standing', metric: '✓ Zero critical' });
      }
      const ratio = totalIncidents > 0 ? Math.round((criticalIncidents / totalIncidents) * 100) : 0;
      insights.push({ text: `${orgLabel}: critical-to-total incident ratio`, metric: `${ratio}% critical rate` });
      setInsightData(insights);
      setDataLoaded(true);
    } catch (err) {
      console.warn('AI page data load error:', err);
      setDataLoaded(true);
    }
  }, [orgLabel]);

  useEffect(() => { loadLiveData(); }, [loadLiveData]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SR();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.onresult = (e: any) => { setInput(e.results[0][0].transcript || ''); setIsListening(false); };
    recognitionRef.current.onerror = () => setIsListening(false);
    recognitionRef.current.onend = () => setIsListening(false);
    return () => { recognitionRef.current?.stop(); };
  }, []);

  const askAi = async (question: string) => {
    if (!question.trim() || isProcessing) return;
    setIsProcessing(true);
    setMessages(prev => [
      ...prev,
      { role: 'user', content: question },
      { role: 'ai', content: '', loading: true },
    ]);
    try {
      // The backend injects a fresh, real data snapshot on every call (see
      // app/controllers/ai.py:_build_project_briefing) — the question is sent as-is.
      const nextHistory: ChatMessage[] = [...conversationHistory, { role: 'user', content: question }];
      let streamStarted = false;
      const reply = await chatWithAIAgent(question, conversationHistory, (_delta, fullSoFar) => {
        // First chunk: replace the "..." bubble with a live-updating one.
        setMessages(prev => {
          const withoutLoading = streamStarted ? prev.slice(0, -1) : prev.filter(m => !m.loading);
          return [...withoutLoading, { role: 'ai', content: fullSoFar }];
        });
        streamStarted = true;
      });
      setConversationHistory([...nextHistory, { role: 'assistant', content: reply }]);
      setMessages(prev => [
        ...(streamStarted ? prev.slice(0, -1) : prev.filter(m => !m.loading)),
        {
          role: 'ai',
          content: reply,
          suggestions: ['Show next best actions', 'Summarize in 5 bullet points', 'Create a compliance checklist'],
        },
      ]);
    } catch (error: any) {
      setMessages(prev => [
        ...prev.filter(m => !m.loading),
        { role: 'ai', content: `I couldn't complete this request: **${error?.message || 'Unknown error'}**. Please try again.` },
      ]);
    } finally {
      setIsProcessing(false);
      setInput('');
    }
  };

  const handleMicClick = () => {
    if (!recognitionRef.current || isProcessing) return;
    if (isListening) { recognitionRef.current.stop(); setIsListening(false); return; }
    recognitionRef.current.start();
    setIsListening(true);
  };

  return (
    <div className="space-y-6">
      {/* Header — PRO/ENTERPRISE badge removed */}
      <div className="flex items-center gap-3">
        <h1>Access Intelligence</h1>
        <span className="px-2.5 py-1 rounded-full text-[11px] uppercase text-white"
          style={{ background: 'linear-gradient(135deg, #0B3D91, #1D4ED8)', fontWeight: 600 }}>
          AI Powered
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b" style={{ borderColor: '#DBE7FF' }}>
        {[
          { id: 'chat', label: 'AI Chat' },
          { id: 'predictive', label: 'Predictive Analytics' },
          { id: 'whatif', label: 'What-If Analysis' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className="px-4 py-2.5 text-[13px] transition-colors relative"
            style={{ color: activeTab === tab.id ? '#1D4ED8' : '#4A5568', fontWeight: activeTab === tab.id ? 600 : 400 }}>
            {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(135deg, #0B3D91, #1D4ED8)' }} />}
          </button>
        ))}
      </div>

      {/* ── AI Chat Tab ──────────────────────────────────────────────────── */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-10 xl:gap-6 xl:h-[calc(100vh-260px)]">

          {/* Left panel — live data */}
          <div className="space-y-4 xl:col-span-3 xl:overflow-y-auto xl:max-h-[calc(100vh-260px)]">

            {/* Risk panel */}
            <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#E6EEFF' }}>
              <div className="px-4 py-3" style={{ background: 'linear-gradient(135deg, #0B3D91, #1D4ED8)' }}>
                <div className="flex items-center gap-2 text-white">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-[13px] font-semibold">Live Risk Overview</span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {!dataLoaded ? (
                  <div className="text-[12px] text-gray-400 py-4 text-center">Loading live data…</div>
                ) : riskData.map(risk => (
                  <div key={risk.zone} className="flex items-center justify-between py-2 border-b last:border-b-0" style={{ borderColor: '#E6EEFF' }}>
                    <div>
                      <div className="text-[13px] font-medium" style={{ color: '#0A0A0A' }}>{risk.zone}</div>
                      <div className="text-[11px]" style={{ color: '#9CA3AF' }}>{risk.predicted} incidents / actions</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold"
                      style={{ background: `${RISK_COLORS[risk.risk]}20`, color: RISK_COLORS[risk.risk] }}>
                      {risk.risk}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Insights panel */}
            <div className="bg-white rounded-xl border p-4" style={{ borderColor: '#E6EEFF' }}>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4" style={{ color: '#F59E0B' }} />
                <span className="text-[13px] font-semibold" style={{ color: '#0A0A0A' }}>Live Insights</span>
              </div>
              <div className="space-y-3">
                {!dataLoaded ? (
                  <div className="text-[12px] text-gray-400 py-2 text-center">Loading…</div>
                ) : insightData.map((ins, idx) => (
                  <div key={idx} className="p-3 rounded-lg" style={{ background: '#F3F7FF' }}>
                    <div className="text-[12px] mb-1" style={{ color: '#0A0A0A' }}>{ins.text}</div>
                    <div className="text-[12px] font-semibold" style={{ color: '#1D4ED8' }}>{ins.metric}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Context stats */}
            <div className="bg-white rounded-xl border p-4" style={{ borderColor: '#E6EEFF' }}>
              <div className="text-[12px] font-semibold mb-2" style={{ color: '#4A5568' }}>Data sent to AI</div>
              <div className="space-y-1 text-[11px]" style={{ color: '#6B7280' }}>
                <div>📋 Total Incidents: <b style={{ color: '#111827' }}>{contextStats.totalIncidents}</b></div>
                <div>🔴 Critical Incidents: <b style={{ color: '#111827' }}>{contextStats.criticalIncidents}</b></div>
                <div>🏗️ Zones / Sites: <b style={{ color: '#111827' }}>{contextStats.totalZones}</b></div>
                <div>⚠️ Open CAPA: <b style={{ color: '#111827' }}>{contextStats.openCapa}</b></div>
              </div>
            </div>
          </div>

          {/* Chat panel */}
          <div className="bg-white rounded-xl border flex min-h-[520px] flex-col xl:col-span-7 xl:min-h-0" style={{ borderColor: '#E6EEFF' }}>
            <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: '#E6EEFF' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0B3D91, #1D4ED8)' }}>
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-[14px] font-semibold" style={{ color: '#0A0A0A' }}>HSE AI Assistant</span>
                <div className="text-[11px]" style={{ color: '#6B7280' }}>Connected to your live safety data</div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[80%]">
                    <div className="rounded-xl px-4 py-3 text-[13px]"
                      style={msg.role === 'user'
                        ? { background: 'linear-gradient(135deg, #0B3D91, #1D4ED8)', color: '#fff' }
                        : { background: '#fff', border: '1px solid #DBE7FF', color: '#0A0A0A' }}>
                      {msg.loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-[#1D4ED8] rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-[#1D4ED8] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-[#1D4ED8] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      ) : (
                        <FormattedMessage content={msg.content} isAI={msg.role === 'ai'} />
                      )}
                    </div>
                    {msg.suggestions && !msg.loading && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {msg.suggestions.map(s => (
                          <button key={s} onClick={() => askAi(s)}
                            className="px-3 py-1.5 rounded-full text-[12px] border transition-colors hover:bg-[#EFF6FF]"
                            style={{ borderColor: '#DBE7FF', color: '#1D4ED8', fontWeight: 500 }}>
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="px-6 py-4 border-t" style={{ borderColor: '#E6EEFF' }}>
              <div className="flex items-center gap-3">
                <input value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && askAi(input)}
                  placeholder="Ask anything about safety, incidents, and compliance..."
                  className="flex-1 h-11 px-4 rounded-lg border text-[13px] focus:outline-none"
                  style={{ borderColor: '#DBE7FF' }} />
                <button onClick={handleMicClick} disabled={isProcessing}
                  className="w-11 h-11 rounded-lg flex items-center justify-center border"
                  style={{ borderColor: isListening ? '#1D4ED8' : '#DBE7FF', background: isListening ? '#EFF6FF' : 'transparent' }}>
                  <Mic className="w-4 h-4" style={{ color: isListening ? '#1D4ED8' : '#4A5568' }} />
                </button>
                <button onClick={() => askAi(input)} disabled={isProcessing || !input.trim()}
                  className="w-11 h-11 rounded-lg flex items-center justify-center text-white"
                  style={{ background: 'linear-gradient(135deg, #0B3D91, #1D4ED8)', opacity: isProcessing || !input.trim() ? 0.5 : 1 }}>
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Predictive Analytics Tab ──────────────────────────────────── */}
      {activeTab === 'predictive' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {riskData.map(risk => (
            <div key={risk.zone} className="bg-white rounded-xl border p-4" style={{ borderColor: '#E6EEFF' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">{risk.zone}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: `${RISK_COLORS[risk.risk]}20`, color: RISK_COLORS[risk.risk] }}>
                  {risk.risk}
                </span>
              </div>
              <div className="text-[12px] text-gray-600">Incidents / Actions: {risk.predicted}</div>
              <div className="text-[12px] text-gray-600">Confidence: {risk.confidence}%</div>
              <div className="mt-2 h-1.5 rounded-full" style={{ background: '#F3F7FF' }}>
                <div className="h-full rounded-full" style={{ width: `${risk.confidence}%`, background: RISK_COLORS[risk.risk] }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── What-If Tab ───────────────────────────────────────────────── */}
      {activeTab === 'whatif' && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="bg-white rounded-xl border p-6" style={{ borderColor: '#E6EEFF' }}>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5" style={{ color: '#F59E0B' }} />
              <h2>What-If Scenario Builder</h2>
            </div>
            <p className="text-[13px] text-gray-600 mb-4">
              Simulate scenarios like workforce changes, shift modifications, or delayed corrective actions and get AI-powered risk projections.
            </p>
            <button className="px-4 py-2 rounded-lg text-white"
              style={{ background: 'linear-gradient(135deg, #0B3D91, #1D4ED8)' }}
              onClick={() => { setActiveTab('chat'); askAi('Simulate a 20% increase in workforce and show projected critical risks by zone.'); }}>
              Run Sample Simulation
            </button>
          </div>
          <div className="bg-white rounded-xl border p-6" style={{ borderColor: '#E6EEFF' }}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5" style={{ color: '#1D4ED8' }} />
              <h2>Suggested Prompts</h2>
            </div>
            <div className="space-y-2">
              {[
                'What if Zone A exposure hours rise by 25%?',
                'What if corrective action SLA slips by 48 hours?',
                'What if we add one extra safety supervisor to high-risk zones?',
              ].map(prompt => (
                <button key={prompt} onClick={() => { setActiveTab('chat'); askAi(prompt); }}
                  className="w-full text-left px-3 py-2 rounded-lg border text-[13px] hover:bg-[#EFF6FF]"
                  style={{ borderColor: '#DBE7FF', color: '#1D4ED8' }}>
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
