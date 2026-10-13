import React from 'react';
import { 
  Building2, 
  BarChart3, 
  Cpu, 
  Calculator, 
  Bot, 
  Database, 
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { ModelMetrics } from '../ml/models';

export type ActiveTab = 'overview' | 'trainer' | 'visualizations' | 'calculator' | 'assistant';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  activeModelName: string;
  metrics: ModelMetrics;
  onOpenQuickMix?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeModelName,
  metrics,
}) => {
  const tabs: Array<{ id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }> = [
    { id: 'overview', label: 'Dataset Explorer', icon: <Database className="w-4 h-4" />, badge: '1,030' },
    { id: 'trainer', label: 'ML Model Training', icon: <Cpu className="w-4 h-4" />, badge: `R² ${metrics.r2Test}` },
    { id: 'visualizations', label: 'Data Visualizations', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'calculator', label: 'Mix Design Calculator', icon: <Calculator className="w-4 h-4" />, badge: 'Inverse ML' },
    { id: 'assistant', label: 'AI Engineering Assistant', icon: <Bot className="w-4 h-4" />, badge: 'Civil AI' },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                ConcreteAI
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-medium border border-amber-500/30">
                  Civil Engineering Suite
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Predictive Compressive Strength Analytics • UCI Dataset • Inverse Mix Optimizer • Gemini AI
            </p>
          </div>
        </div>

        {/* Model Status & Stats badge */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300 font-mono">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">Active Model:</span>
            <span className="text-amber-300 font-semibold truncate max-w-[170px] sm:max-w-none">
              {activeModelName}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono">
            <span className="text-slate-400">Test R²:</span>
            <span className="text-emerald-400 font-bold">{metrics.r2Test}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">RMSE:</span>
            <span className="text-amber-400 font-bold">{metrics.rmseTest} MPa</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-300 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>ACI 211 / IS 10262</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60 overflow-x-auto scrollbar-none">
        <nav className="flex space-x-1 sm:space-x-2 py-1.5" aria-label="Tabs">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-slate-950 text-amber-300 font-bold'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
