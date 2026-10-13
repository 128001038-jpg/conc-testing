import React, { useState, useMemo } from 'react';
import { 
  CONCRETE_DATASET, 
  FEATURES_METADATA, 
  TARGET_METADATA, 
  DATASET_STATS, 
  computePearsonCorrelation, 
  computeStats,
  ConcreteSample
} from '../data/concreteDataset';
import { 
  BarChart3, 
  Layers, 
  TrendingUp, 
  Flame, 
  Sliders, 
  Info, 
  Sparkles,
  Maximize2
} from 'lucide-react';

export const Visualizations: React.FC = () => {
  const [activeVizTab, setActiveVizTab] = useState<'scatter' | 'histogram' | 'heatmap'>('scatter');

  // Scatter plot state
  const [xVar, setXVar] = useState<string>('cement');
  const [yVar, setYVar] = useState<string>('strength');
  const [colorVar, setColorVar] = useState<string>('age');
  const [hoveredPoint, setHoveredPoint] = useState<ConcreteSample | null>(null);

  // Histogram state
  const [histVar, setHistVar] = useState<string>('strength');
  const [binCount, setBinCount] = useState<number>(18);
  const [hoveredBin, setHoveredBin] = useState<{ range: string; count: number; pct: number } | null>(null);

  // Heatmap hover state
  const [hoveredCorr, setHoveredCorr] = useState<{ v1: string; v2: string; r: number } | null>(null);

  const allVars = useMemo(() => {
    return [
      ...FEATURES_METADATA.map(f => ({ key: f.key, label: f.label, unit: f.unit, shortLabel: f.shortLabel })),
      { key: 'strength', label: 'Compressive Strength', unit: 'MPa', shortLabel: 'Strength' },
    ];
  }, []);

  // Quick preset handlers for scatter
  const applyPreset = (x: string, y: string, c: string) => {
    setXVar(x);
    setYVar(y);
    setColorVar(c);
  };

  // Get raw values for scatter
  const scatterData = useMemo(() => {
    const rawX = CONCRETE_DATASET.map(d => (d as any)[xVar] as number);
    const rawY = CONCRETE_DATASET.map(d => (d as any)[yVar] as number);

    const minX = Math.min(...rawX);
    const maxX = Math.max(...rawX);
    const minY = Math.min(...rawY);
    const maxY = Math.max(...rawY);

    const r = computePearsonCorrelation(rawX, rawY);
    const r2 = Math.round(r * r * 1000) / 1000;

    // Linear regression y = mx + b
    const meanX = rawX.reduce((a, b) => a + b, 0) / rawX.length;
    const meanY = rawY.reduce((a, b) => a + b, 0) / rawY.length;
    let num = 0;
    let den = 0;
    for (let i = 0; i < rawX.length; i++) {
      num += (rawX[i] - meanX) * (rawY[i] - meanY);
      den += Math.pow(rawX[i] - meanX, 2);
    }
    const slope = den !== 0 ? num / den : 0;
    const intercept = meanY - slope * meanX;

    return {
      minX,
      maxX: maxX === minX ? minX + 1 : maxX,
      minY,
      maxY: maxY === minY ? minY + 1 : maxY,
      r,
      r2,
      slope,
      intercept,
    };
  }, [xVar, yVar]);

  // Histogram calculation
  const histData = useMemo(() => {
    const values = CONCRETE_DATASET.map(d => (d as any)[histVar] as number);
    const stats = computeStats(values);
    const min = stats.min;
    const max = stats.max;
    const range = max - min || 1;
    const binWidth = range / binCount;

    const bins = Array.from({ length: binCount }, (_, i) => {
      const bMin = min + i * binWidth;
      const bMax = bMin + binWidth;
      return {
        binIndex: i,
        min: bMin,
        max: bMax,
        label: `${bMin.toFixed(1)} - ${bMax.toFixed(1)}`,
        count: 0,
        pct: 0,
      };
    });

    values.forEach(v => {
      let idx = Math.floor((v - min) / binWidth);
      if (idx >= binCount) idx = binCount - 1;
      if (idx < 0) idx = 0;
      bins[idx].count++;
    });

    const maxCount = Math.max(...bins.map(b => b.count)) || 1;
    bins.forEach(b => {
      b.pct = Math.round((b.count / values.length) * 1000) / 10;
    });

    return { bins, stats, maxCount, binWidth, min, max };
  }, [histVar, binCount]);

  // Correlation matrix
  const correlationMatrix = useMemo(() => {
    const vars = [
      'cement',
      'slag',
      'flyAsh',
      'water',
      'superplasticizer',
      'coarseAggregate',
      'fineAggregate',
      'age',
      'strength',
    ];

    const matrix: Record<string, Record<string, number>> = {};
    vars.forEach(v1 => {
      matrix[v1] = {};
      const val1 = CONCRETE_DATASET.map(d => (d as any)[v1] as number);
      vars.forEach(v2 => {
        const val2 = CONCRETE_DATASET.map(d => (d as any)[v2] as number);
        matrix[v1][v2] = computePearsonCorrelation(val1, val2);
      });
    });

    return { vars, matrix };
  }, []);

  const getHeatmapColor = (r: number) => {
    if (r === 1) return 'bg-amber-500 text-slate-950 font-bold';
    if (r >= 0.4) return 'bg-emerald-600/90 text-white font-semibold';
    if (r >= 0.2) return 'bg-emerald-700/60 text-emerald-100';
    if (r > 0) return 'bg-slate-800 text-slate-300';
    if (r === 0) return 'bg-slate-900 text-slate-400';
    if (r > -0.2) return 'bg-slate-800/80 text-slate-300';
    if (r > -0.4) return 'bg-rose-900/60 text-rose-200';
    return 'bg-rose-700/90 text-white font-semibold';
  };

  const getCorrelationInterpretation = (v1: string, v2: string, r: number) => {
    if (v1 === v2) return 'Perfect auto-correlation (1.0). Same physical ingredient.';
    if (v1 === 'cement' && v2 === 'strength') return 'Strong positive correlation (+0.50). Cement paste volume and C-S-H formation directly increase compressive strength (Abrams’ Law).';
    if (v1 === 'water' && v2 === 'strength') return 'Moderate negative correlation (-0.29). Excess mixing water generates capillary porosity, weakening concrete mechanical structure.';
    if (v1 === 'superplasticizer' && v2 === 'water') return 'Strong negative correlation (-0.66). High-range water reducers disperse cement clusters, reducing water requirement by 15-30%.';
    if (v1 === 'age' && v2 === 'strength') return 'Positive correlation (+0.33). Continued cement hydration increases solid volume and density over curing time.';
    if (Math.abs(r) < 0.1) return `Negligible linear relationship (${r}). Indicates independent mix proportion design degrees of freedom.`;
    return `${r > 0 ? 'Positive' : 'Negative'} correlation (${r}). As ${v1} increases, ${v2} tends to ${r > 0 ? 'increase' : 'decrease'}.`;
  };

  return (
    <div className="space-y-6">
      {/* Visualizations Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            Interactive Civil Engineering Visual Analytics
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Explore multivariate distributions, nonlinear hydration trends, and correlation heatmaps
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveVizTab('scatter')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeVizTab === 'scatter'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Scatter Plots
          </button>
          <button
            onClick={() => setActiveVizTab('histogram')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeVizTab === 'histogram'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Feature Distributions
          </button>
          <button
            onClick={() => setActiveVizTab('heatmap')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeVizTab === 'heatmap'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Correlation Heatmap
          </button>
        </div>
      </div>

      {/* TAB 1: DYNAMIC SCATTER PLOT */}
      {activeVizTab === 'scatter' && (
        <div className="space-y-6">
          {/* Preset Buttons & Variable Selectors */}
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Civil Engineering Benchmark Presets:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => applyPreset('cement', 'strength', 'age')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                    xVar === 'cement' && yVar === 'strength'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                  }`}
                >
                  Cement vs. Strength
                </button>
                <button
                  onClick={() => applyPreset('water', 'strength', 'cement')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                    xVar === 'water' && yVar === 'strength'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                  }`}
                >
                  Water vs. Strength (Abrams)
                </button>
                <button
                  onClick={() => applyPreset('age', 'strength', 'cement')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                    xVar === 'age' && yVar === 'strength'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                  }`}
                >
                  Age vs. Strength (Maturity)
                </button>
                <button
                  onClick={() => applyPreset('superplasticizer', 'water', 'strength')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                    xVar === 'superplasticizer' && yVar === 'water'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                  }`}
                >
                  Superplasticizer vs. Water
                </button>
              </div>
            </div>

            {/* Variable Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80">
              <div>
                <label className="text-[11px] text-slate-400 font-medium block mb-1">
                  X-Axis Variable
                </label>
                <select
                  value={xVar}
                  onChange={e => setXVar(e.target.value)}
                  className="w-full py-1.5 px-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {allVars.map(v => (
                    <option key={v.key} value={v.key}>
                      {v.label} ({v.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-medium block mb-1">
                  Y-Axis Variable
                </label>
                <select
                  value={yVar}
                  onChange={e => setYVar(e.target.value)}
                  className="w-full py-1.5 px-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {allVars.map(v => (
                    <option key={v.key} value={v.key}>
                      {v.label} ({v.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-medium block mb-1">
                  Color Encoding (Z-Dimension)
                </label>
                <select
                  value={colorVar}
                  onChange={e => setColorVar(e.target.value)}
                  className="w-full py-1.5 px-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {allVars.map(v => (
                    <option key={v.key} value={v.key}>
                      {v.label} ({v.unit})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SVG Scatter Plot Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{allVars.find(v => v.key === xVar)?.label}</span>
                  <span className="text-slate-400 font-normal">vs.</span>
                  <span className="text-amber-400">{allVars.find(v => v.key === yVar)?.label}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Color mapped to {allVars.find(v => v.key === colorVar)?.label} • 1,030 samples
                </p>
              </div>

              {/* Correlation Stats Pill */}
              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                  Pearson r: <strong className={scatterData.r >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{scatterData.r}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                  R²: <strong className="text-amber-300">{scatterData.r2}</strong>
                </span>
              </div>
            </div>

            {/* Scatter SVG Area */}
            <div className="w-full h-[400px] relative bg-slate-950 rounded-xl border border-slate-800/80 p-2 overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 800 400" preserveAspectRatio="none">
                {/* Grid Lines */}
                {[0.2, 0.4, 0.6, 0.8].map((ratio, idx) => (
                  <g key={idx}>
                    <line
                      x1={50}
                      y1={350 - ratio * 300}
                      x2={770}
                      y2={350 - ratio * 300}
                      stroke="rgba(51, 65, 85, 0.3)"
                      strokeDasharray="4 4"
                    />
                    <line
                      x1={50 + ratio * 720}
                      y1={50}
                      x2={50 + ratio * 720}
                      y2={350}
                      stroke="rgba(51, 65, 85, 0.3)"
                      strokeDasharray="4 4"
                    />
                  </g>
                ))}

                {/* Regression Trend Line */}
                {(() => {
                  const x1 = scatterData.minX;
                  const y1 = scatterData.slope * x1 + scatterData.intercept;
                  const x2 = scatterData.maxX;
                  const y2 = scatterData.slope * x2 + scatterData.intercept;

                  const svgX1 = 50 + ((x1 - scatterData.minX) / (scatterData.maxX - scatterData.minX)) * 720;
                  const svgY1 = 350 - ((y1 - scatterData.minY) / (scatterData.maxY - scatterData.minY)) * 300;
                  const svgX2 = 50 + ((x2 - scatterData.minX) / (scatterData.maxX - scatterData.minX)) * 720;
                  const svgY2 = 350 - ((y2 - scatterData.minY) / (scatterData.maxY - scatterData.minY)) * 300;

                  return (
                    <line
                      x1={svgX1}
                      y1={svgY1}
                      x2={svgX2}
                      y2={svgY2}
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                      strokeDasharray="6 4"
                    />
                  );
                })()}

                {/* Scatter Points */}
                {CONCRETE_DATASET.map(sample => {
                  const xVal = (sample as any)[xVar] as number;
                  const yVal = (sample as any)[yVar] as number;
                  const cVal = (sample as any)[colorVar] as number;

                  const normX = (xVal - scatterData.minX) / (scatterData.maxX - scatterData.minX);
                  const normY = (yVal - scatterData.minY) / (scatterData.maxY - scatterData.minY);

                  const cx = 50 + normX * 720;
                  const cy = 350 - normY * 300;

                  // Dynamic color from cyan to amber to emerald
                  let fillColor = '#38bdf8';
                  if (colorVar === 'age') {
                    if (cVal <= 7) fillColor = '#f43f5e';
                    else if (cVal === 28) fillColor = '#10b981';
                    else if (cVal > 28) fillColor = '#f59e0b';
                  } else {
                    fillColor = cVal > 10 ? '#f59e0b' : '#38bdf8';
                  }

                  return (
                    <circle
                      key={sample.id}
                      cx={cx}
                      cy={cy}
                      r={3.2}
                      fill={fillColor}
                      opacity={0.65}
                      className="hover:r-5 hover:opacity-100 hover:stroke-white hover:stroke-2 cursor-pointer transition-all"
                      onMouseEnter={() => setHoveredPoint(sample)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  );
                })}
              </svg>

              {/* X and Y axis labels */}
              <div className="absolute left-14 bottom-2 text-[10px] font-mono text-slate-400">
                {scatterData.minX.toFixed(1)} {allVars.find(v => v.key === xVar)?.unit}
              </div>
              <div className="absolute right-6 bottom-2 text-[10px] font-mono text-slate-400">
                {scatterData.maxX.toFixed(1)} {allVars.find(v => v.key === xVar)?.unit}
              </div>
              <div className="absolute left-2 top-10 text-[10px] font-mono text-slate-400">
                {scatterData.maxY.toFixed(1)}
              </div>
              <div className="absolute left-2 bottom-10 text-[10px] font-mono text-slate-400">
                {scatterData.minY.toFixed(1)}
              </div>

              {/* Hover Tooltip Overlay */}
              {hoveredPoint && (
                <div className="absolute top-4 right-4 bg-slate-900/95 border border-amber-500/50 p-3 rounded-xl shadow-2xl text-xs font-mono pointer-events-none z-10 max-w-xs space-y-1">
                  <div className="font-bold text-amber-300 border-b border-slate-800 pb-1">
                    Specimen #{hoveredPoint.id}
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-slate-300 text-[11px] pt-1">
                    <div>Cement: <span className="text-white">{hoveredPoint.cement}</span></div>
                    <div>Water: <span className="text-blue-300">{hoveredPoint.water}</span></div>
                    <div>Superplast: <span className="text-purple-300">{hoveredPoint.superplasticizer}</span></div>
                    <div>Age: <span className="text-emerald-300">{hoveredPoint.age}d</span></div>
                    <div className="col-span-2 pt-1 border-t border-slate-800 font-bold text-amber-400">
                      Strength: {hoveredPoint.strength} MPa
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Regression Equation Formula Banner */}
            <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-slate-300 gap-2">
              <div>
                <span className="text-slate-400">Empirical Trend Fit: </span>
                <span className="text-amber-400 font-semibold">
                  {yVar} = {scatterData.slope.toFixed(4)} × ({xVar}) {scatterData.intercept >= 0 ? '+' : '-'} {Math.abs(scatterData.intercept).toFixed(2)}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-sans">
                {xVar === 'cement' && 'Strong positive correlation consistent with Abrams hydration theory.'}
                {xVar === 'water' && 'Negative trend confirms classical capillary pore volume reduction.'}
                {xVar === 'age' && 'Logarithmic maturity gain over standard hydration periods.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HISTOGRAM DISTRIBUTIONS */}
      {activeVizTab === 'histogram' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">
                Select Variable for Distribution Analysis
              </label>
              <select
                value={histVar}
                onChange={e => setHistVar(e.target.value)}
                className="py-1.5 px-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer w-64"
              >
                {allVars.map(v => (
                  <option key={v.key} value={v.key}>
                    {v.label} ({v.unit})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-medium">Bin Count:</span>
              <input
                type="range"
                min={8}
                max={32}
                value={binCount}
                onChange={e => setBinCount(parseInt(e.target.value, 10))}
                className="w-32 accent-amber-500 cursor-pointer"
              />
              <span className="font-mono text-xs text-amber-400 font-bold">{binCount}</span>
            </div>
          </div>

          {/* Histogram SVG Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Frequency Histogram: {allVars.find(v => v.key === histVar)?.label}
                </h3>
                <p className="text-xs text-slate-400">
                  Distribution shape across 1,030 specimens • Skewness: {histData.stats.skewness}
                </p>
              </div>

              {/* Statistics Pill */}
              <div className="flex flex-wrap gap-2 text-xs font-mono">
                <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">
                  Mean: <strong className="text-amber-400">{histData.stats.mean}</strong>
                </span>
                <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">
                  Median: <strong className="text-cyan-400">{histData.stats.median}</strong>
                </span>
                <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">
                  Std: <strong className="text-emerald-400">±{histData.stats.std}</strong>
                </span>
              </div>
            </div>

            {/* SVG Histogram */}
            <div className="w-full h-[360px] bg-slate-950 rounded-xl border border-slate-800/80 p-2 relative overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 800 360" preserveAspectRatio="none">
                {/* Horizontal reference lines */}
                {[0.25, 0.5, 0.75].map((pct, idx) => (
                  <line
                    key={idx}
                    x1={40}
                    y1={320 - pct * 280}
                    x2={780}
                    y2={320 - pct * 280}
                    stroke="rgba(51, 65, 85, 0.3)"
                    strokeDasharray="4 4"
                  />
                ))}

                {/* Bars */}
                {histData.bins.map((bin, i) => {
                  const barWidth = 720 / binCount - 2;
                  const barHeight = (bin.count / histData.maxCount) * 280;
                  const x = 50 + i * (720 / binCount);
                  const y = 320 - barHeight;

                  return (
                    <rect
                      key={i}
                      x={x}
                      y={y}
                      width={Math.max(2, barWidth)}
                      height={Math.max(1, barHeight)}
                      fill="#f59e0b"
                      opacity={0.8}
                      className="hover:opacity-100 hover:fill-amber-400 cursor-pointer transition-all"
                      onMouseEnter={() => setHoveredBin({ range: bin.label, count: bin.count, pct: bin.pct })}
                      onMouseLeave={() => setHoveredBin(null)}
                    />
                  );
                })}

                {/* Mean marker line */}
                {(() => {
                  const normMean = (histData.stats.mean - histData.min) / (histData.max - histData.min || 1);
                  const xMean = 50 + normMean * 720;
                  return (
                    <g>
                      <line
                        x1={xMean}
                        y1={30}
                        x2={xMean}
                        y2={320}
                        stroke="#06b6d4"
                        strokeWidth="2"
                        strokeDasharray="5 3"
                      />
                      <text x={xMean + 4} y={45} fill="#06b6d4" fontSize="11" fontFamily="monospace">
                        Mean ({histData.stats.mean})
                      </text>
                    </g>
                  );
                })()}
              </svg>

              {/* Tooltip on hover */}
              {hoveredBin && (
                <div className="absolute top-4 right-4 bg-slate-900 border border-amber-500/40 p-2.5 rounded-lg text-xs font-mono shadow-xl">
                  <div className="text-amber-300 font-bold">{hoveredBin.range}</div>
                  <div className="text-slate-300 mt-1">
                    Count: <strong>{hoveredBin.count}</strong> specimens ({hoveredBin.pct}%)
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CORRELATION HEATMAP */}
      {activeVizTab === 'heatmap' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Pearson Correlation Matrix (9 × 9)</span>
                  <span className="text-xs font-normal text-slate-400">
                    r ∈ [-1.0, +1.0]
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Measures linear dependency between concrete constituents, curing time, and compressive strength
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-rose-700 inline-block" /> Strong -r
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-slate-800 inline-block" /> Neutral (0)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-emerald-600 inline-block" /> Strong +r
                </span>
              </div>
            </div>

            {/* Matrix Grid */}
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse text-xs font-mono">
                <thead>
                  <tr>
                    <th className="p-2 text-left text-slate-400 text-[11px]">Feature</th>
                    {correlationMatrix.vars.map(v => (
                      <th key={v} className="p-2 text-[11px] text-slate-300 font-medium">
                        {allVars.find(x => x.key === v)?.shortLabel}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {correlationMatrix.vars.map(v1 => (
                    <tr key={v1} className="border-t border-slate-800/60">
                      <td className="p-2 text-left text-slate-300 font-semibold text-[11px]">
                        {allVars.find(x => x.key === v1)?.shortLabel}
                      </td>
                      {correlationMatrix.vars.map(v2 => {
                        const r = correlationMatrix.matrix[v1][v2];
                        const isTarget = v1 === 'strength' || v2 === 'strength';
                        return (
                          <td
                            key={v2}
                            onMouseEnter={() => setHoveredCorr({ v1, v2, r })}
                            onMouseLeave={() => setHoveredCorr(null)}
                            className={`p-2 transition-all cursor-pointer ${getHeatmapColor(r)} ${
                              isTarget ? 'ring-1 ring-amber-500/30' : ''
                            }`}
                          >
                            {r.toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Hover Explanation Card */}
            <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              {hoveredCorr ? (
                <div>
                  <div className="font-mono font-bold text-amber-400 flex items-center gap-2">
                    <span>{allVars.find(x => x.key === hoveredCorr.v1)?.label}</span>
                    <span className="text-slate-400">⟷</span>
                    <span>{allVars.find(x => x.key === hoveredCorr.v2)?.label}</span>
                    <span className="ml-2 text-white bg-slate-800 px-2 py-0.5 rounded">
                      r = {hoveredCorr.r}
                    </span>
                  </div>
                  <p className="text-slate-300 mt-1 font-sans">
                    {getCorrelationInterpretation(hoveredCorr.v1, hoveredCorr.v2, hoveredCorr.r)}
                  </p>
                </div>
              ) : (
                <div className="text-slate-400 flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-400" />
                  <span>Hover over any cell in the correlation matrix to see civil engineering interpretations.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
