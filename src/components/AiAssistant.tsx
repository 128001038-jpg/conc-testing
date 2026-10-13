import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  ShieldAlert, 
  Copy, 
  Check, 
  User, 
  RotateCcw, 
  BookOpen, 
  Building2, 
  HelpCircle,
  Calculator
} from 'lucide-react';
import { TrainedModel } from '../ml/models';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  source?: string;
}

interface AiAssistantProps {
  currentModel: TrainedModel;
  activeMixContext?: any;
  onLoadMixToCalculator?: (mix: any) => void;
  onNavigateToCalculator?: () => void;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({
  currentModel,
  activeMixContext,
  onLoadMixToCalculator,
  onNavigateToCalculator,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `### Welcome to ConcreteAI Engineering Assistant 👋

I am your technical civil engineering and materials science AI consultant. I can assist you with:
* **Concrete Mix Design:** Proportioning according to ACI 211.1, IS 10262, and EN 206 standards.
* **Empirical Laws:** Abrams' Water-Cement Ratio Law, Feret's rule, maturity theory, and pozzolanic reactions.
* **Machine Learning Analytics:** Random Forest, Gradient Boosted Trees, MLP deep regression, $R^2$, MAE, RMSE metrics, and feature importance analysis.
* **Inverse Mix Optimization:** Solving water and superplasticizer dosages for target compressive strengths.

> ⚠️ **Civil Engineering Protocol:** Note that while AI models provide rapid preliminary proportioning targets, real-world structural concrete must **always** be verified through physical laboratory trial batches and standard cylinder compression testing.

Select one of the prompt benchmarks below or ask any technical civil engineering question!`,
      timestamp: 'Just now',
      source: 'system',
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const prompt = (textToSend || inputPrompt).trim();
    if (!prompt || isLoading) return;

    const userMsg: Message = {
      id: 'user_' + Date.now(),
      sender: 'user',
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          context: {
            activeModel: currentModel.name,
            r2Test: currentModel.metrics.r2Test,
            rmseTest: currentModel.metrics.rmseTest,
            activeMixContext: activeMixContext || null,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      const assistantMsg: Message = {
        id: 'asst_' + Date.now(),
        sender: 'assistant',
        text: data.reply || 'No response received from engineering engine.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: data.source || 'gemini',
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: Message = {
        id: 'err_' + Date.now(),
        sender: 'assistant',
        text: `**Technical Note:** Failed to connect to AI server. Please verify your connection.\n\n${err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const promptPresets = [
    {
      title: '★ Prompt Case: 40 MPa Column Mix Design',
      query: 'I want to design a concrete mix for a column that needs 40 MPa strength at 28 days. I have 300 kg/m³ of cement, 800 kg of coarse aggregate, and 600 kg of fine aggregate. How much water and superplasticiser should I use based on your model? Can we pour this concrete based purely on AI?',
    },
    {
      title: 'Abrams’ Law vs. ML Non-linear Modeling',
      query: 'Explain Abrams\' Water-Cement Ratio Law and how machine learning regression models capture multi-variable interactions like superplasticizer dispersion and pozzolanic reactions beyond traditional empirical curves.',
    },
    {
      title: 'Model Overfitting in Civil Datasets',
      query: 'What are the main risks of overfitting when training Random Forest or GBDT models on concrete compressive strength datasets, and how do we use R², RMSE, and cross-validation to prevent it?',
    },
    {
      title: 'Slag vs. Fly Ash Pozzolanic Mechanics',
      query: 'How does replacing cement with Ground Granulated Blast Furnace Slag (GGBS) compare with Fly Ash in terms of early 7-day strength versus mature 90-day strength and durability against chemical attack?',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">
              Civil Engineering AI Assistant (Gemini Grounded)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Trained on concrete technology standards (ACI 211.1, IS 10262, EN 206), Abrams' hydration law, and civil engineering machine learning predictive models.
          </p>
        </div>

        <button
          onClick={() => {
            setMessages([messages[0]]);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-xs text-slate-300 font-mono transition-colors self-start md:self-auto cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Session</span>
        </button>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-400 block">
          Civil Engineering & Machine Learning Recommended Queries:
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {promptPresets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(preset.query)}
              disabled={isLoading}
              className="text-left p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 transition-all cursor-pointer group space-y-1"
            >
              <div className="text-xs font-bold text-amber-300 group-hover:text-amber-200 flex items-center justify-between">
                <span>{preset.title}</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400 opacity-60 group-hover:opacity-100" />
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2">
                "{preset.query}"
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-col h-[560px] overflow-hidden">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3 sm:gap-4 ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                  <Building2 className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none shadow-md'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none shadow'
                }`}
              >
                {/* Assistant formatted text */}
                {msg.sender === 'assistant' ? (
                  <div className="space-y-3 font-sans">
                    <div className="whitespace-pre-line prose prose-invert prose-xs max-w-none">
                      {msg.text}
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>{msg.timestamp} • {msg.source ? `Source: ${msg.source}` : 'AI Studio'}</span>
                      <button
                        onClick={() => copyToClipboard(msg.id, msg.text)}
                        className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Answer</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                    <div className="text-[10px] text-slate-900/70 font-mono text-right">
                      {msg.timestamp}
                    </div>
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center shrink-0 border border-slate-700">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 sm:gap-4 justify-start items-center">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                <Building2 className="w-4 h-4 animate-bounce" />
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-none p-3.5 text-xs text-slate-400 font-mono flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>AI Engineering Assistant computing proportioning response & standards check...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={e => setInputPrompt(e.target.value)}
              placeholder="Ask about concrete mix design, 40 MPa column proportions, Abrams' law, ML metrics..."
              disabled={isLoading}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Send Query</span>
            </button>
          </form>
          <div className="mt-2 text-[10px] text-slate-400 text-center font-sans">
            AI recommendations serve as preliminary design approximations. Concrete cannot be poured on-site without certified laboratory cylinder compressive testing (ASTM C39).
          </div>
        </div>
      </div>
    </div>
  );
};
