import React, { useState } from 'react';
import { TrainedModel, MixInput } from '../ml/models';
import { 
  solveInverseMixDesign, 
  computeMaturityCurve, 
  InverseMixSolution 
} from '../ml/mixOptimizer';
import { 
  Calculator, 
  Droplets, 
  Beaker, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Boxes, 
  Grid, 
  Sparkles, 
  ShieldAlert, 
  ArrowRight, 
  Sliders, 
  TrendingUp, 
  HelpCircle,
  Clock,
  Check
} from 'lucide-react';

interface MixCalculatorProps {
  currentModel: TrainedModel;
  initialMix?: Partial<MixInput>;
  onAskAiAboutMix?: (mixContext: any) => void;
}

export const MixCalculator: React.FC<MixCalculatorProps> = ({
  currentModel,
  initialMix,
  onAskAiAboutMix,
}) => {
  const [calculatorMode, setCalculatorMode] = useState<'inverse' | 'forward'>('inverse');

  // Inverse optimizer inputs (Requirement 4)
  const [targetStrength, setTargetStrength] = useState<number>(40.0);
  const [cementInput, setCementInput] = useState<number>(initialMix?.cement ?? 300);
  const [coarseAggInput, setCoarseAggInput] = useState<number>(initialMix?.coarseAggregate ?? 800);
  const [fineAggInput, setFineAggInput] = useState<number>(initialMix?.fineAggregate ?? 600);
  const [slagInput, setSlagInput] = useState<number>(initialMix?.slag ?? 0);
  const [flyAshInput, setFlyAshInput] = useState<number>(initialMix?.flyAsh ?? 0);
  const [ageInput, setAgeInput] = useState<number>(initialMix?.age ?? 28);

  // Active solution
  const [solution, setSolution] = useState<InverseMixSolution>(() => {
    return solveInverseMixDesign(
      {
        targetStrength: 40.0,
        cement: initialMix?.cement ?? 300,
        coarseAggregate: initialMix?.coarseAggregate ?? 800,
        fineAggregate: initialMix?.fineAggregate ?? 600,
        slag: initialMix?.slag ?? 0,
        flyAsh: initialMix?.flyAsh ?? 0,
        age: initialMix?.age ?? 28,
      },
      currentModel
    );
  });

  // Forward predictor inputs
  const [forwardMix, setForwardMix] = useState<MixInput>({
    cement: 350,
    slag: 0,
    flyAsh: 0,
    water: 165,
    superplasticizer: 6.0,
    coarseAggregate: 950,
    fineAggregate: 750,
    age: 28,
  });

  const handleSolveInverse = (
    target = targetStrength,
    c = cementInput,
    ca = coarseAggInput,
    fa = fineAggInput,
    s = slagInput,
    faSh = flyAshInput,
    a = ageInput
  ) => {
    const sol = solveInverseMixDesign(
      {
        targetStrength: target,
        cement: c,
        coarseAggregate: ca,
        fineAggregate: fa,
        slag: s,
        flyAsh: faSh,
        age: a,
      },
      currentModel
    );
    setSolution(sol);
  };

  // Presets
  const loadPreset = (target: number, c: number, ca: number, fa: number, s = 0, f = 0, a = 28) => {
    setTargetStrength(target);
    setCementInput(c);
    setCoarseAggInput(ca);
    setFineAggInput(fa);
    setSlagInput(s);
    setFlyAshInput(f);
    setAgeInput(a);
    handleSolveInverse(target, c, ca, fa, s, f, a);
  };

  // Forward predictions
  const forwardPredictedMpa = currentModel.predict(forwardMix);
  const forwardMaturityCurve = computeMaturityCurve(forwardMix, currentModel);
  const forwardWbRatio = Math.round((forwardMix.water / (forwardMix.cement + forwardMix.slag + forwardMix.flyAsh || 1)) * 100) / 100;

  const getStrengthClass = (mpa: number) => {
    if (mpa >= 60) return { code: 'C60/75', label: 'Ultra-High Strength (Skyscrapers & Long-Span Bridges)', color: 'text-amber-400' };
    if (mpa >= 50) return { code: 'C50/60', label: 'High-Strength Concrete (Columns & Shear Walls)', color: 'text-emerald-400' };
    if (mpa >= 40) return { code: 'C40/50', label: 'Commercial Structural Grade (Heavy Columns & Beams)', color: 'text-cyan-400' };
    if (mpa >= 30) return { code: 'C30/37', label: 'Standard Reinforced Concrete (Slabs & Foundations)', color: 'text-blue-400' };
    return { code: 'C20/25', label: 'Plain / Low-Grade Concrete', color: 'text-slate-400' };
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Mode Toggle */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">
              Concrete Mix Design Calculator & Inverse Optimization
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Input target compressive strength and aggregate proportions to solve required water content and superplasticizer dosage using the trained machine learning model.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 self-start md:self-auto">
          <button
            onClick={() => setCalculatorMode('inverse')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              calculatorMode === 'inverse'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Inverse Mix Solver (Requirement 4)
          </button>
          <button
            onClick={() => setCalculatorMode('forward')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              calculatorMode === 'forward'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Forward Strength Predictor
          </button>
        </div>
      </div>

      {/* MODE 1: INVERSE OPTIMIZER */}
      {calculatorMode === 'inverse' && (
        <div className="space-y-6">
          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Quick Benchmarks:</span>
            <button
              onClick={() => loadPreset(40.0, 300, 800, 600, 0, 0, 28)}
              className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-mono font-semibold transition-colors cursor-pointer"
            >
              ★ Prompt Benchmark: 40 MPa Column (300 C, 800 CA, 600 FA)
            </button>
            <button
              onClick={() => loadPreset(35.0, 350, 980, 750, 0, 0, 28)}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono transition-colors cursor-pointer"
            >
              C30/37 Foundation (350 C, 980 CA, 750 FA)
            </button>
            <button
              onClick={() => loadPreset(55.0, 450, 920, 680, 80, 0, 28)}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono transition-colors cursor-pointer"
            >
              High-Strength Column C50/60 (450 C + 80 Slag)
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Form: Inputs (5 cols) */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  Mix Requirements
                </h3>
                <span className="text-[11px] font-mono text-emerald-400">Target & Constituents</span>
              </div>

              {/* Target Strength Input */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Target Compressive Strength
                  </label>
                  <span className="text-lg font-bold font-mono text-amber-400">
                    {targetStrength} MPa
                  </span>
                </div>
                <input
                  type="range"
                  min={15}
                  max={75}
                  step={0.5}
                  value={targetStrength}
                  onChange={e => {
                    const val = parseFloat(e.target.value);
                    setTargetStrength(val);
                    handleSolveInverse(val);
                  }}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>15 MPa (Lean)</span>
                  <span>40 MPa (Column)</span>
                  <span>75 MPa (Ultra-High)</span>
                </div>
              </div>

              {/* Cement Content Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    Cement Content (kg/m³)
                  </span>
                  <span className="font-mono text-amber-400 font-bold">{cementInput} kg</span>
                </div>
                <input
                  type="range"
                  min={150}
                  max={540}
                  step={5}
                  value={cementInput}
                  onChange={e => {
                    const val = parseInt(e.target.value, 10);
                    setCementInput(val);
                    handleSolveInverse(targetStrength, val);
                  }}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Coarse Aggregate Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5 text-emerald-400" />
                    Coarse Aggregate (kg/m³)
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">{coarseAggInput} kg</span>
                </div>
                <input
                  type="range"
                  min={700}
                  max={1200}
                  step={10}
                  value={coarseAggInput}
                  onChange={e => {
                    const val = parseInt(e.target.value, 10);
                    setCoarseAggInput(val);
                    handleSolveInverse(targetStrength, cementInput, val);
                  }}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Fine Aggregate Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <Grid className="w-3.5 h-3.5 text-yellow-400" />
                    Fine Aggregate (kg/m³)
                  </span>
                  <span className="font-mono text-yellow-400 font-bold">{fineAggInput} kg</span>
                </div>
                <input
                  type="range"
                  min={500}
                  max={1000}
                  step={10}
                  value={fineAggInput}
                  onChange={e => {
                    const val = parseInt(e.target.value, 10);
                    setFineAggInput(val);
                    handleSolveInverse(targetStrength, cementInput, coarseAggInput, val);
                  }}
                  className="w-full accent-yellow-500 cursor-pointer"
                />
              </div>

              {/* Optional SCMs and Age */}
              <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400 block">Slag (GGBS, kg/m³)</span>
                  <input
                    type="number"
                    min={0}
                    max={300}
                    value={slagInput}
                    onChange={e => {
                      const val = parseInt(e.target.value || '0', 10);
                      setSlagInput(val);
                      handleSolveInverse(targetStrength, cementInput, coarseAggInput, fineAggInput, val);
                    }}
                    className="w-full py-1.5 px-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400 block">Fly Ash (kg/m³)</span>
                  <input
                    type="number"
                    min={0}
                    max={200}
                    value={flyAshInput}
                    onChange={e => {
                      const val = parseInt(e.target.value || '0', 10);
                      setFlyAshInput(val);
                      handleSolveInverse(targetStrength, cementInput, coarseAggInput, fineAggInput, slagInput, val);
                    }}
                    className="w-full py-1.5 px-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    Target Curing Age (Days)
                  </span>
                  <span className="font-mono text-indigo-400 font-bold">{ageInput} Days</span>
                </div>
                <div className="flex gap-2">
                  {[7, 14, 28, 56, 90].map(a => (
                    <button
                      key={a}
                      onClick={() => {
                        setAgeInput(a);
                        handleSolveInverse(targetStrength, cementInput, coarseAggInput, fineAggInput, slagInput, flyAshInput, a);
                      }}
                      className={`flex-1 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                        ageInput === a
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-950 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {a}d
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleSolveInverse()}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow"
              >
                <Calculator className="w-4 h-4" />
                <span>Re-Optimize Water & Superplasticizer</span>
              </button>
            </div>

            {/* Right Results: Solved Quantities & Engineering Evaluation (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* Solved Results Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Predicted Water Content Card */}
                <div className="bg-gradient-to-br from-blue-950/40 to-slate-900 border border-blue-500/40 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Droplets className="w-4 h-4 text-blue-400" />
                      Required Water Content
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      w/b = {solution.waterBinderRatio}
                    </span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white mt-3">
                    {solution.recommendedWater} <span className="text-lg font-normal text-blue-300">kg/m³</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-2">
                    Calibrated by Abrams' Law to control capillary pore volume and hydration gel density.
                  </p>
                </div>

                {/* Predicted Superplasticizer Dosage Card */}
                <div className="bg-gradient-to-br from-purple-950/40 to-slate-900 border border-purple-500/40 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Beaker className="w-4 h-4 text-purple-400" />
                      Required Superplasticizer
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {solution.spPercentageOfBinder}% of binder
                    </span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white mt-3">
                    {solution.recommendedSuperplasticizer} <span className="text-lg font-normal text-purple-300">kg/m³</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-2">
                    High-Range Water Reducer (HRWR / Polycarboxylate Ether) provides dispersion and workability.
                  </p>
                </div>
              </div>

              {/* Verification & Physics Analysis Scorecard */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Model Verification & Structural Rheology
                  </h4>
                  <div className="flex items-center gap-1 text-xs font-mono text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Target Met: {solution.achievedPredictedStrength} MPa (Δ {solution.errorMargin} MPa)</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">w/b Ratio</span>
                    <span className="text-base font-bold text-amber-400">{solution.waterBinderRatio}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5 font-sans">ACI &lt;0.50</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">Total Unit Weight</span>
                    <span className="text-base font-bold text-cyan-400">{solution.totalUnitWeight} kg</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5 font-sans">Fresh density</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">Volumetric Yield</span>
                    <span className={`text-base font-bold ${Math.abs(solution.yieldDifferencePercent) > 6 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {solution.volumetricYield} m³
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5 font-sans">
                      {solution.yieldDifferencePercent > 0 ? '+' : ''}{solution.yieldDifferencePercent}% diff
                    </span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">Durability Index</span>
                    <span className="text-base font-bold text-emerald-400">{solution.durabilityRating}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5 font-sans">Chloride & CO₂</span>
                  </div>
                </div>

                {/* Workability & Slump */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400">Estimated Workability Slump: </span>
                    <span className="text-amber-300 font-bold">{solution.workabilitySlumpEstimate}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">ASTM C143 / IS 1199</span>
                </div>

                {/* Volumetric Yield Caution Banner if aggregates not summing to 1m³ */}
                {Math.abs(solution.yieldDifferencePercent) > 6 && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Volumetric Yield Correction Notice:</div>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Your input solid ingredients ({cementInput} kg cement + {coarseAggInput} kg CA + {fineAggInput} kg FA) yield approx {solution.volumetricYield} m³ ({solution.yieldDifferencePercent}% deviation). 
                        To achieve an exact 1.0 m³ batch, standard mix proportioning (ACI 211.1) scales aggregate quantities proportionally up to ~2350 kg total unit weight.
                      </p>
                    </div>
                  </div>
                )}

                {/* Alternative Trade-offs */}
                <div className="space-y-2 pt-1">
                  <span className="text-xs text-slate-400 font-medium block">
                    Alternative Workability & Cost Trade-Offs:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {solution.candidateAlternatives.map((alt, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs font-mono space-y-1 hover:border-slate-700"
                      >
                        <div className="text-[10px] text-slate-400 font-sans line-clamp-1">{alt.label}</div>
                        <div className="text-white font-bold">{alt.predictedStrength} MPa</div>
                        <div className="text-[11px] text-slate-300">
                          Water: {alt.water} kg • SP: {alt.superplasticizer} kg
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ask AI button for this mix */}
                {onAskAiAboutMix && (
                  <button
                    onClick={() => {
                      onAskAiAboutMix({
                        targetStrength,
                        cement: cementInput,
                        coarseAgg: coarseAggInput,
                        fineAgg: fineAggInput,
                        solvedWater: solution.recommendedWater,
                        solvedSP: solution.recommendedSuperplasticizer,
                        wbRatio: solution.waterBinderRatio,
                        yield: solution.volumetricYield,
                      });
                    }}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Consult AI Engineering Assistant on This Column Mix</span>
                  </button>
                )}
              </div>

              {/* CRITICAL ENGINEERING DISCLAIMER (Requirement 4 & 5) */}
              <div className="bg-rose-950/30 border-2 border-rose-600/40 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2.5 text-rose-400">
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  <h4 className="text-sm font-bold uppercase tracking-wider">
                    Civil Engineering Compliance & Laboratory Testing Disclaimer
                  </h4>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  <strong>CAN WE POUR CONCRETE BASED PURELY ON AI? NO.</strong> In accordance with building code regulations (ACI 318, Eurocode 2, IS 456, and ASTM C94), machine learning predictions are mathematical approximations intended strictly for initial proportioning guidance.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300 font-sans pt-1">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <span>Mandatory laboratory trial batching</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <span>Fresh slump & air content tests (ASTM C143)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <span>7 & 28-day cylinder compression (ASTM C39)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <span>Licensed Professional Engineer (PE) sign-off</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: FORWARD PREDICTOR */}
      {calculatorMode === 'forward' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sliders Form (6 cols) */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                Specify Mix Ingredients
              </h3>
              <span className="text-[11px] font-mono text-cyan-400">Forward Inference</span>
            </div>

            {/* Sliders for all 8 parameters */}
            {[
              { key: 'cement', label: 'Cement (OPC)', unit: 'kg/m³', min: 100, max: 540, step: 5, color: 'accent-amber-500' },
              { key: 'water', label: 'Water Content', unit: 'kg/m³', min: 120, max: 240, step: 2, color: 'accent-blue-500' },
              { key: 'superplasticizer', label: 'Superplasticizer', unit: 'kg/m³', min: 0, max: 30, step: 0.5, color: 'accent-purple-500' },
              { key: 'coarseAggregate', label: 'Coarse Aggregate', unit: 'kg/m³', min: 800, max: 1150, step: 10, color: 'accent-emerald-500' },
              { key: 'fineAggregate', label: 'Fine Aggregate (Sand)', unit: 'kg/m³', min: 600, max: 1000, step: 10, color: 'accent-yellow-500' },
              { key: 'slag', label: 'Blast Furnace Slag', unit: 'kg/m³', min: 0, max: 350, step: 5, color: 'accent-orange-500' },
              { key: 'flyAsh', label: 'Fly Ash (Pozzolan)', unit: 'kg/m³', min: 0, max: 200, step: 5, color: 'accent-cyan-500' },
              { key: 'age', label: 'Curing Age', unit: 'days', min: 1, max: 365, step: 1, color: 'accent-indigo-500' },
            ].map(item => (
              <div key={item.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">{item.label}</span>
                  <span className="font-mono text-amber-400 font-bold">
                    {(forwardMix as any)[item.key]} {item.unit}
                  </span>
                </div>
                <input
                  type="range"
                  min={item.min}
                  max={item.max}
                  step={item.step}
                  value={(forwardMix as any)[item.key]}
                  onChange={e => {
                    setForwardMix({
                      ...forwardMix,
                      [item.key]: parseFloat(e.target.value),
                    });
                  }}
                  className={`w-full ${item.color} cursor-pointer`}
                />
              </div>
            ))}
          </div>

          {/* Forward Results & Maturity Development Curve (6 cols) */}
          <div className="lg:col-span-6 space-y-5">
            {/* Predicted Strength Card */}
            <div className="bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-950 border border-amber-500/40 rounded-2xl p-6 shadow-xl text-center space-y-2">
              <span className="text-xs uppercase font-mono font-bold tracking-wider text-amber-400">
                Model Predicted Compressive Strength
              </span>
              <div className="text-5xl font-black font-mono text-white tracking-tight">
                {forwardPredictedMpa} <span className="text-2xl font-bold text-amber-400">MPa</span>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2 text-xs font-mono">
                <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  w/b Ratio: <strong>{forwardWbRatio}</strong>
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Age: <strong>{forwardMix.age} Days</strong>
                </span>
              </div>

              {/* Classification Tag */}
              {(() => {
                const grade = getStrengthClass(forwardPredictedMpa);
                return (
                  <div className="pt-3 border-t border-slate-800/80">
                    <span className={`text-sm font-bold ${grade.color}`}>
                      Grade {grade.code}
                    </span>
                    <p className="text-xs text-slate-400 mt-0.5">{grade.label}</p>
                  </div>
                );
              })()}
            </div>

            {/* Maturity Development Curve SVG */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Strength Growth Maturity Curve (1 to 365 Days)</h4>
                  <p className="text-xs text-slate-400">Hydration kinetics and pozzolanic gain over curing time</p>
                </div>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>

              {/* Curve Chart */}
              <div className="w-full h-[220px] bg-slate-950 rounded-xl border border-slate-800/80 p-2 relative overflow-hidden">
                <svg className="w-full h-full" viewBox="0 0 500 220" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  {[0.25, 0.5, 0.75].map((pct, i) => (
                    <line
                      key={i}
                      x1={30}
                      y1={190 - pct * 160}
                      x2={480}
                      y2={190 - pct * 160}
                      stroke="rgba(51, 65, 85, 0.3)"
                      strokeDasharray="4 4"
                    />
                  ))}

                  {/* Polyline */}
                  {(() => {
                    const maxMpa = Math.max(70, ...forwardMaturityCurve.map(c => c.strength));
                    const points = forwardMaturityCurve.map((c, i) => {
                      const x = 40 + i * (430 / (forwardMaturityCurve.length - 1));
                      const y = 190 - (c.strength / maxMpa) * 160;
                      return `${x},${y}`;
                    }).join(' ');

                    return (
                      <g>
                        <polyline
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="3"
                          points={points}
                        />
                        {forwardMaturityCurve.map((c, i) => {
                          const x = 40 + i * (430 / (forwardMaturityCurve.length - 1));
                          const y = 190 - (c.strength / maxMpa) * 160;
                          return (
                            <circle
                              key={i}
                              cx={x}
                              cy={y}
                              r={4}
                              fill="#10b981"
                              stroke="#0f172a"
                              strokeWidth="2"
                            >
                              <title>{c.age}d: {c.strength} MPa ({c.percentOf28Day}% of 28d)</title>
                            </circle>
                          );
                        })}
                      </g>
                    );
                  })()}
                </svg>

                {/* Age labels */}
                <div className="flex justify-between px-3 text-[10px] font-mono text-slate-400">
                  {forwardMaturityCurve.map(c => (
                    <span key={c.age}>{c.age}d</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
