/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Header, ActiveTab } from './components/Header';
import { DatasetExplorer } from './components/DatasetExplorer';
import { ModelTrainer } from './components/ModelTrainer';
import { Visualizations } from './components/Visualizations';
import { MixCalculator } from './components/MixCalculator';
import { AiAssistant } from './components/AiAssistant';
import { trainConcreteModel, TrainedModel, DEFAULT_HYPERPARAMS } from './ml/models';
import { CONCRETE_DATASET } from './data/concreteDataset';
import { Building2, ShieldCheck, FileText, Database, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  
  // Active trained machine learning model
  const [currentModel, setCurrentModel] = useState<TrainedModel>(() => {
    return trainConcreteModel(CONCRETE_DATASET, DEFAULT_HYPERPARAMS);
  });

  // Active mix context shared between tabs
  const [activeMixContext, setActiveMixContext] = useState<any>({
    cement: 300,
    coarseAggregate: 800,
    fineAggregate: 600,
    targetStrength: 40.0,
    age: 28,
  });

  const handleLoadMixToCalculator = (mix: any) => {
    setActiveMixContext(mix);
    setActiveTab('calculator');
  };

  const handleAskAiAboutMix = (mixDetails: any) => {
    setActiveMixContext(mixDetails);
    setActiveTab('assistant');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Header with Navigation and Real-Time ML KPI Badges */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeModelName={currentModel.name}
        metrics={currentModel.metrics}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'overview' && (
          <DatasetExplorer
            onLoadMixToCalculator={handleLoadMixToCalculator}
            onNavigateToCalculator={() => setActiveTab('calculator')}
            onNavigateToVisualizations={() => setActiveTab('visualizations')}
          />
        )}

        {activeTab === 'trainer' && (
          <ModelTrainer
            currentModel={currentModel}
            onModelUpdated={model => setCurrentModel(model)}
          />
        )}

        {activeTab === 'visualizations' && (
          <Visualizations />
        )}

        {activeTab === 'calculator' && (
          <MixCalculator
            currentModel={currentModel}
            initialMix={activeMixContext}
            onAskAiAboutMix={handleAskAiAboutMix}
          />
        )}

        {activeTab === 'assistant' && (
          <AiAssistant
            currentModel={currentModel}
            activeMixContext={activeMixContext}
            onLoadMixToCalculator={handleLoadMixToCalculator}
            onNavigateToCalculator={() => setActiveTab('calculator')}
          />
        )}
      </main>

      {/* Engineering Compliance Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
              CA
            </div>
            <div>
              <span className="font-semibold text-slate-200">
                ConcreteAI • Civil Engineering Data Analytics Platform
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Benchmark: Prof. I-Cheng Yeh (1998) UCI Dataset • ACI 211.1 / IS 10262 / EN 206 Standards
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ASTM C39 & C143 Compliance Ready</span>
            </span>
            <span>•</span>
            <span className="text-slate-400">Laboratory Validation Mandatory</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
