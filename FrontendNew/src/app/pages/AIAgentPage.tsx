import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Bot, Lightbulb, Lock, Mic, Send, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { Link } from 'react-router';
import { chatWithAIAgent, type ChatMessage } from '../../services/ai.service';
import { getOnboardingAccessProfile } from '../../services/onboarding.service';
import { getViolations } from '../../services/violations.service';
import { getZones } from '../../services/infrastructure.service';
import { FormattedMessage } from '../components/shared/FormattedMessage';
import { useAuth } from '../context/AuthContext';

type UiMessage = {
  role: 'user' | 'ai';
  content: string;
  loading?: boolean;
  suggestions?: string[];
};

const STARTER_SUGGESTIONS = [
  'Show top safety risks this week',
  'Which zones have highest violation density?',
  'Give me 5 actions to reduce critical incidents',
];

const RISK_COLORS: Record<string, string> = {
  Critical: '#DC2626',
  High: '#F59E0B',
  Medium: '#1D4ED8',
  Low: '#9CA3AF',
};

export function AIAgentPage() {
  const { subscriptionPlan, user, setSubscriptionPlan, canAccessModuleLabel } = useAuth();
  const [effectivePlan, setEffectivePlan] = useState(subscriptionPlan);
  const [activeTab, setActiveTab] = useState<'chat' | 'predictive' | 'whatif'>('chat');
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const [messages, setMessages] = useState<UiMessage[]>(() => {
    const orgLabel = user?.companyName?.trim() || user?.orgCode?.trim() || 'your organization';
    return [
      {
        role: 'ai',
        content: `Hello! I’m your HSE AI assistant for **${orgLabel}**. Ask me anything about incidents, compliance, violations, and risk controls.`,
        suggestions: STARTER_SUGGESTIONS,
      },
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const orgLabel = user?.companyName?.trim() || user?.orgCode?.trim() || 'your organization';
  const isLocked = Boolean(user?.onboardingScoped) && !canAccessModuleLabel("AI Agent");

  const predictiveCards = useMemo(
    () => [
      { zone: 'Highest Risk Zone', risk: 'Critical', predicted: 12, confidence: 94 },
      { zone: 'Second Risk Zone', risk: 'High', predicted: 8, confidence: 87 },
      { zone: 'Watchlist Zone', risk: 'Medium', predicted: 5, confidence: 79 },
    ],
    [],
  );

  const insightCards = useMemo(
    () => [
      { text: `Recent safety training in ${orgLabel} is correlated with fewer incidents`, metric: '67% reduction' },
      { text: 'Peak violation window is 10:00-11:00 AM', metric: '32% of daily total' },
      { text: 'One high-risk zone contributes the largest critical-violation share', metric: '38% concentration' },
    ],
    [orgLabel],
  );

  useEffect(() => {
    setEffectivePlan(subscriptionPlan);
  }, [subscriptionPlan]);

  useEffect(() => {
    if (!user?.email || !user?.onboardingScoped) return;

    let cancelled = false;
    const refreshPlan = async () => {
      try {
        let profile = await getOnboardingAccessProfile(user.email, user.orgCode);
        if (!profile?.found && user.orgCode) {
          profile = await getOnboardingAccessProfile(user.email);
        }

        const raw = String(profile?.subscription_plan || '').trim().toLowerCase();
        const normalized = raw.includes('pro')
          ? 'Pro'
          : raw.includes('enterprise')
            ? 'Enterprise'
            : raw.includes('free')
              ? 'Free'
              : null;

        if (!cancelled && normalized) {
          setEffectivePlan(normalized);
          if (normalized !== subscriptionPlan) {
            setSubscriptionPlan(normalized);
          }
        }
      } catch (error) {
        console.warn('Unable to refresh AI entitlement plan:', error);
      }
    };

    refreshPlan();
    return () => {
      cancelled = true;
    };
  }, [user?.email, user?.orgCode, user?.onboardingScoped, subscriptionPlan, setSubscriptionPlan]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event: any) => {
      setInput(event.results[0][0].transcript || '');
      setIsListening(false);
    };
    recognitionRef.current.onerror = () => setIsListening(false);
    recognitionRef.current.onend = () => setIsListening(false);

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const buildAiContextPrompt = async (question: string) => {
    try {
      const [violations, zones] = await Promise.all([getViolations(), getZones()]);
      return [
        'You are an HSE intelligence assistant. Use the context below to answer precisely.',
        `Organization: ${orgLabel}`,
        `Total Violations: ${violations.length}`,
        `Critical Violations: ${violations.filter((v: any) => v.Severity === 'Critical').length}`,
        `Total Zones: ${zones.length}`,
        `High Risk Zones: ${zones.filter((z: any) => z.Risk_Score > 70).length}`,
        `User Question: ${question}`,
      ].join('\n');
    } catch {
      return [
        'You are an HSE intelligence assistant.',
        `Organization: ${orgLabel}`,
        `User Question: ${question}`,
      ].join('\n');
    }
  };

  const askAi = async (question: string) => {
    if (!question.trim() || isProcessing) return;

    setIsProcessing(true);
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: question },
      { role: 'ai', content: '', loading: true },
    ]);

    try {
      const contextPrompt = await buildAiContextPrompt(question);
      const nextHistory: ChatMessage[] = [...conversationHistory, { role: 'user', content: contextPrompt }];
      const reply = await chatWithAIAgent(contextPrompt, conversationHistory);

      setConversationHistory([...nextHistory, { role: 'assistant', content: reply }]);
      setMessages((prev) => [
        ...prev.filter((m) => !m.loading),
        {
          role: 'ai',
          content: reply,
          suggestions: ['Show next best actions', 'Summarize in 5 bullet points', 'Create a compliance checklist'],
        },
      ]);
    } catch (error: any) {
      const message = error?.message || 'AI request failed';
      setMessages((prev) => [
        ...prev.filter((m) => !m.loading),
        {
          role: 'ai',
          content: `I couldn’t complete this request: **${message}**. Please try again in a moment.`,
        },
      ]);
    } finally {
      setIsProcessing(false);
      setInput('');
    }
  };

  const handleMicClick = () => {
    if (!recognitionRef.current || isProcessing) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    recognitionRef.current.start();
    setIsListening(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1>Access Intelligence</h1>
        <span
          className="px-2.5 py-1 rounded-full text-[11px] uppercase text-white"
          style={{ background: 'linear-gradient(135deg, #0B3D91, #1D4ED8)', fontWeight: 600 }}
        >
          Pro / Enterprise
        </span>
      </div>

      {isLocked ? (
        <div className="flex flex-col items-center justify-center h-[500px] bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center max-w-3xl mx-auto mt-10">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
            <Lock className="w-8 h-8 text-[#1D4ED8]" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Access Intelligence is available on Pro & Enterprise</h2>
          <p className="text-gray-500 mb-8 max-w-md">
            Upgrade your plan to unlock AI chat, predictive analysis, and what-if intelligence workflows.
          </p>
          <Link
            to="/subscription"
            className="px-6 py-3 rounded-lg text-white font-semibold transition-opacity hover:opacity-90 flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #0B3D91, #3B82F6)' }}
          >
            <Sparkles className="w-4 h-4" />
            View Subscription Plans
          </Link>
        </div>
      ) : (
        <>
          <div className="flex gap-1 overflow-x-auto border-b" style={{ borderColor: '#DBE7FF' }}>
            {[
              { id: 'chat', label: 'AI Chat' },
              { id: 'predictive', label: 'Predictive Analytics' },
              { id: 'whatif', label: 'What-If Analysis' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'chat' | 'predictive' | 'whatif')}
                className="px-4 py-2.5 text-[13px] transition-colors relative"
                style={{ color: activeTab === tab.id ? '#1D4ED8' : '#4A5568', fontWeight: activeTab === tab.id ? 600 : 400 }}
              >
                {tab.label}
                {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(135deg, #0B3D91, #1D4ED8)' }} />}
              </button>
            ))}
          </div>

          {activeTab === 'chat' && (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-10 xl:gap-6 xl:h-[calc(100vh-260px)]">
              <div className="space-y-4 xl:col-span-3 xl:overflow-y-auto xl:max-h-[calc(100vh-260px)]">
                <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#E6EEFF' }}>
                  <div className="px-4 py-3" style={{ background: 'linear-gradient(135deg, #0B3D91, #1D4ED8)' }}>
                    <div className="flex items-center gap-2 text-white">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-[13px]" style={{ fontWeight: 600 }}>Predicted High Risk</span>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    {predictiveCards.map((risk) => (
                      <div key={risk.zone} className="flex items-center justify-between py-2 border-b last:border-b-0" style={{ borderColor: '#E6EEFF' }}>
                        <div>
                          <div className="text-[13px]" style={{ color: '#0A0A0A', fontWeight: 500 }}>{risk.zone}</div>
                          <div className="text-[11px]" style={{ color: '#9CA3AF' }}>~{risk.predicted} predicted violations</div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] uppercase" style={{ background: `${RISK_COLORS[risk.risk]}20`, color: RISK_COLORS[risk.risk], fontWeight: 600 }}>
                          {risk.risk}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl border p-4" style={{ borderColor: '#E6EEFF' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-4 h-4" style={{ color: '#F59E0B' }} />
                    <span className="text-[13px]" style={{ color: '#0A0A0A', fontWeight: 600 }}>Insights</span>
                  </div>
                  <div className="space-y-3">
                    {insightCards.map((insight, idx) => (
                      <div key={idx} className="p-3 rounded-lg" style={{ background: '#F3F7FF' }}>
                        <div className="text-[12px] mb-1" style={{ color: '#0A0A0A' }}>{insight.text}</div>
                        <div className="text-[12px]" style={{ color: '#1D4ED8', fontWeight: 600 }}>{insight.metric}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border flex min-h-[520px] flex-col xl:col-span-7 xl:min-h-0" style={{ borderColor: '#E6EEFF' }}>
                <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: '#E6EEFF' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0B3D91, #1D4ED8)' }}>
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[14px]" style={{ color: '#0A0A0A', fontWeight: 600 }}>HSE AI Assistant</span>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[80%]">
                        <div
                          className="rounded-xl px-4 py-3 text-[13px]"
                          style={
                            msg.role === 'user'
                              ? { background: 'linear-gradient(135deg, #0B3D91, #1D4ED8)', color: '#fff' }
                              : { background: '#fff', border: '1px solid #DBE7FF', color: '#0A0A0A' }
                          }
                        >
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
                            {msg.suggestions.map((suggestion) => (
                              <button
                                key={suggestion}
                                onClick={() => askAi(suggestion)}
                                className="px-3 py-1.5 rounded-full text-[12px] border transition-colors hover:bg-[#EFF6FF]"
                                style={{ borderColor: '#DBE7FF', color: '#1D4ED8', fontWeight: 500 }}
                              >
                                {suggestion}
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
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && askAi(input)}
                      placeholder="Ask anything about safety, violations, and compliance..."
                      className="flex-1 h-11 px-4 rounded-lg border text-[13px] focus:outline-none"
                      style={{ borderColor: '#DBE7FF' }}
                    />
                    <button
                      onClick={handleMicClick}
                      disabled={isProcessing}
                      className="w-11 h-11 rounded-lg flex items-center justify-center border"
                      style={{ borderColor: isListening ? '#1D4ED8' : '#DBE7FF', background: isListening ? '#EFF6FF' : 'transparent' }}
                    >
                      <Mic className="w-4 h-4" style={{ color: isListening ? '#1D4ED8' : '#4A5568' }} />
                    </button>
                    <button
                      onClick={() => askAi(input)}
                      disabled={isProcessing || !input.trim()}
                      className="w-11 h-11 rounded-lg flex items-center justify-center text-white"
                      style={{ background: 'linear-gradient(135deg, #0B3D91, #1D4ED8)', opacity: isProcessing || !input.trim() ? 0.5 : 1 }}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'predictive' && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {predictiveCards.map((risk) => (
                <div key={risk.zone} className="bg-white rounded-xl border p-4" style={{ borderColor: '#E6EEFF' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ fontWeight: 600 }}>{risk.zone}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: `${RISK_COLORS[risk.risk]}20`, color: RISK_COLORS[risk.risk], fontWeight: 600 }}>
                      {risk.risk}
                    </span>
                  </div>
                  <div className="text-[12px] text-gray-600">Predicted events: {risk.predicted}</div>
                  <div className="text-[12px] text-gray-600">Confidence: {risk.confidence}%</div>
                  <div className="mt-2 h-1.5 rounded-full" style={{ background: '#F3F7FF' }}>
                    <div className="h-full rounded-full" style={{ width: `${risk.confidence}%`, background: RISK_COLORS[risk.risk] }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'whatif' && (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="bg-white rounded-xl border p-6" style={{ borderColor: '#E6EEFF' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5" style={{ color: '#F59E0B' }} />
                  <h2>What-If Scenario Builder</h2>
                </div>
                <p className="text-[13px] text-gray-600 mb-4">
                  Ask the assistant scenarios like workforce increase, shift change, or delayed corrective actions and get risk projections.
                </p>
                <button
                  className="px-4 py-2 rounded-lg text-white"
                  style={{ background: 'linear-gradient(135deg, #0B3D91, #1D4ED8)' }}
                  onClick={() => askAi('Simulate a 20% increase in workforce and show projected critical risks by zone.')}
                >
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
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => {
                        setActiveTab('chat');
                        askAi(prompt);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg border text-[13px] hover:bg-[#EFF6FF]"
                      style={{ borderColor: '#DBE7FF', color: '#1D4ED8' }}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}