import React, { useState, useMemo } from 'react';
import { 
  CONCRETE_DATASET, 
  FEATURES_METADATA, 
  TARGET_METADATA, 
  DATASET_STATS, 
  BENCHMARK_MIXES,
  ConcreteSample
} from '../data/concreteDataset';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Download, 
  Sparkles, 
  Layers, 
  Flame, 
  Wind, 
  Droplets, 
  Beaker, 
  Boxes, 
  Grid, 
  CalendarClock,
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface DatasetExplorerProps {
  onLoadMixToCalculator?: (mix: any) => void;
  onNavigateToCalculator?: () => void;
  onNavigateToVisualizations?: () => void;
}

export const DatasetExplorer: React.FC<DatasetExplorerProps> = ({
  onLoadMixToCalculator,
  onNavigateToCalculator,
  onNavigateToVisualizations,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgeFilter, setSelectedAgeFilter] = useState<string>('all');
  const [selectedStrengthFilter, setSelectedStrengthFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof ConcreteSample>('strength');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Filter & sort samples
  const filteredSamples = useMemo(() => {
    return CONCRETE_DATASET.filter(sample => {
      // Age filter
      if (selectedAgeFilter === 'early' && sample.age > 7) return false;
      if (selectedAgeFilter === 'standard' && sample.age !== 28) return false;
      if (selectedAgeFilter === 'mature' && sample.age <= 28) return false;

      // Strength filter
      if (selectedStrengthFilter === 'low' && sample.strength >= 25) return false;
      if (selectedStrengthFilter === 'normal' && (sample.strength < 25 || sample.strength > 40)) return false;
      if (selectedStrengthFilter === 'high' && (sample.strength < 40 || sample.strength > 60)) return false;
      if (selectedStrengthFilter === 'ultra' && sample.strength <= 60) return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const idMatch = sample.id.toString().includes(query);
        const cementMatch = sample.cement.toString().includes(query);
        const strengthMatch = sample.strength.toString().includes(query);
        return idMatch || cementMatch || strengthMatch;
      }

      return true;
    }).sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (sortOrder === 'asc') return valA > valB ? 1 : -1;
      return valA < valB ? 1 : -1;
    });
  }, [searchTerm, selectedAgeFilter, selectedStrengthFilter, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredSamples.length / pageSize) || 1;
  const pagedSamples = filteredSamples.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (field: keyof ConcreteSample) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const exportCsv = () => {
    const headers = ['Specimen ID,Cement (kg/m3),Slag (kg/m3),Fly Ash (kg/m3),Water (kg/m3),Superplasticizer (kg/m3),Coarse Aggregate (kg/m3),Fine Aggregate (kg/m3),Age (days),Compressive Strength (MPa)'];
    const rows = CONCRETE_DATASET.map(s => 
      `${s.id},${s.cement},${s.slag},${s.flyAsh},${s.water},${s.superplasticizer},${s.coarseAggregate},${s.fineAggregate},${s.age},${s.strength}`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'uci_concrete_compressive_strength_1030_samples.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFeatureIcon = (name: string) => {
    switch (name) {
      case 'cement': return <Layers className="w-4 h-4 text-amber-400" />;
      case 'slag': return <Flame className="w-4 h-4 text-orange-400" />;
      case 'flyAsh': return <Wind className="w-4 h-4 text-cyan-400" />;
      case 'water': return <Droplets className="w-4 h-4 text-blue-400" />;
      case 'superplasticizer': return <Beaker className="w-4 h-4 text-purple-400" />;
      case 'coarseAggregate': return <Boxes className="w-4 h-4 text-emerald-400" />;
      case 'fineAggregate': return <Grid className="w-4 h-4 text-yellow-400" />;
      case 'age': return <CalendarClock className="w-4 h-4 text-indigo-400" />;
      default: return <Sparkles className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Overview */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono font-medium">
              <span>UCI Machine Learning Repository Benchmark</span>
              <span>•</span>
              <span>Prof. I-Cheng Yeh (1998)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              High-Performance Concrete Compressive Strength Dataset
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Explore 1,030 experimental concrete batches tested under standard laboratory conditions.
              Each specimen records 8 quantitative mixture ingredients and curing age, targeting 28-day uniaxial compressive strength in MegaPascals (MPa).
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3">
            <button
              onClick={exportCsv}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-semibold transition-all shadow cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Export CSV (1,030)</span>
            </button>
            <button
              onClick={onNavigateToVisualizations}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-bold transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <span>Explore Visualizations</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Highlight KPI counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/60">
            <div className="text-xs text-slate-400 font-medium">Total Specimens</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">1,030</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Laboratory cured batches</div>
          </div>
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/60">
            <div className="text-xs text-slate-400 font-medium">Input Features</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400 mt-1">8 Ingredients</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Binder, water, agg, age</div>
          </div>
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/60">
            <div className="text-xs text-slate-400 font-medium">Strength Range</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-1">2.3 – 82.6</div>
            <div className="text-[11px] text-slate-400 mt-0.5">MPa (ASTM C39 / Cube)</div>
          </div>
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/60">
            <div className="text-xs text-slate-400 font-medium">Mean Strength</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-cyan-400 mt-1">{DATASET_STATS.strength.mean} MPa</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Std dev: {DATASET_STATS.strength.std} MPa</div>
          </div>
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/60 col-span-2 sm:col-span-1">
            <div className="text-xs text-slate-400 font-medium">Average w/c Ratio</div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-purple-400 mt-1">0.51</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Standard structural band</div>
          </div>
        </div>
      </div>

      {/* Benchmark Reference Mixes Showcase */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white">Engineering Benchmark Mixes</h3>
            <span className="text-xs text-slate-400">Pre-calibrated civil reference designs</span>
          </div>
          <span className="text-xs text-slate-400">Click to load into calculator</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {BENCHMARK_MIXES.map((bench, idx) => (
            <div
              key={idx}
              className="bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/40 rounded-xl p-4 transition-all duration-200 group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                    {bench.targetStrength} MPa Target
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{bench.mix.age} Days</span>
                </div>
                <h4 className="text-sm font-bold text-white mt-2 group-hover:text-amber-300 transition-colors">
                  {bench.name}
                </h4>
                <p className="text-xs text-slate-400 mt-1">{bench.category}</p>

                <div className="mt-3 pt-3 border-t border-slate-800/60 grid grid-cols-2 gap-2 text-xs font-mono text-slate-300">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Cement:</span>
                    <span>{bench.mix.cement} kg/m³</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Water:</span>
                    <span>{bench.mix.water} kg/m³</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Superplast:</span>
                    <span>{bench.mix.superplasticizer} kg/m³</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Aggregates:</span>
                    <span>{bench.mix.coarseAggregate + bench.mix.fineAggregate} kg</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  if (onLoadMixToCalculator) onLoadMixToCalculator(bench.mix);
                  if (onNavigateToCalculator) onNavigateToCalculator();
                }}
                className="mt-4 w-full py-1.5 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Load Mix in Calculator</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Summary Statistics Cards */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-white">Statistical Distributions & Parameters (8 Features + Target)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FEATURES_METADATA.map(meta => {
            const stat = DATASET_STATS[meta.key];
            return (
              <div
                key={meta.key}
                className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center">
                      {getFeatureIcon(meta.key)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{meta.label}</h4>
                      <span className="text-[10px] text-slate-400">{meta.unit}</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    Mean: {stat.mean}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2 line-clamp-1">{meta.description}</p>
                <div className="mt-3 grid grid-cols-4 gap-1 text-[11px] font-mono bg-slate-950/50 p-2 rounded-lg border border-slate-800/60 text-slate-300">
                  <div>
                    <span className="text-[9px] text-slate-400 block">Min</span>
                    {stat.min}
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block">Median</span>
                    {stat.median}
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block">Max</span>
                    {stat.max}
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block">Std Dev</span>
                    ±{stat.std}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Target: Compressive Strength Card */}
          <div className="bg-gradient-to-br from-amber-950/20 to-slate-900/80 border border-amber-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-300">{TARGET_METADATA.label}</h4>
                  <span className="text-[10px] text-slate-400">{TARGET_METADATA.unit} (Target)</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">
                Mean: {DATASET_STATS.strength.mean}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 line-clamp-1">{TARGET_METADATA.description}</p>
            <div className="mt-3 grid grid-cols-4 gap-1 text-[11px] font-mono bg-slate-950/50 p-2 rounded-lg border border-amber-500/20 text-slate-300">
              <div>
                <span className="text-[9px] text-slate-400 block">Min</span>
                {DATASET_STATS.strength.min}
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block">Median</span>
                {DATASET_STATS.strength.median}
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block">Max</span>
                {DATASET_STATS.strength.max}
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block">Std Dev</span>
                ±{DATASET_STATS.strength.std}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Data Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Specimen Registry & Mix Proportions</span>
              <span className="text-xs font-normal text-slate-400">
                ({filteredSamples.length} matching rows)
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Interactive laboratory batch records with column sorting and multi-criteria filters
            </p>
          </div>

          {/* Search bar & filter controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ID, cement, strength..."
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-amber-500 w-48 sm:w-56"
              />
            </div>

            {/* Age Filter */}
            <select
              value={selectedAgeFilter}
              onChange={e => {
                setSelectedAgeFilter(e.target.value);
                setPage(1);
              }}
              className="py-1.5 px-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">All Ages</option>
              <option value="early">Early (≤ 7 Days)</option>
              <option value="standard">Standard (28 Days)</option>
              <option value="mature">Mature (&gt; 28 Days)</option>
            </select>

            {/* Strength Filter */}
            <select
              value={selectedStrengthFilter}
              onChange={e => {
                setSelectedStrengthFilter(e.target.value);
                setPage(1);
              }}
              className="py-1.5 px-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">All Strengths</option>
              <option value="low">Low (&lt; 25 MPa)</option>
              <option value="normal">Normal (25 – 40 MPa)</option>
              <option value="high">High (40 – 60 MPa)</option>
              <option value="ultra">Ultra-High (&gt; 60 MPa)</option>
            </select>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th 
                  onClick={() => handleSort('id')}
                  className="py-3 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    ID
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('cement')}
                  className="py-3 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    Cement
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('slag')}
                  className="py-3 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    Slag
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('flyAsh')}
                  className="py-3 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    Fly Ash
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('water')}
                  className="py-3 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    Water
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('superplasticizer')}
                  className="py-3 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    Superpl.
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('coarseAggregate')}
                  className="py-3 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    Coarse Agg.
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('fineAggregate')}
                  className="py-3 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    Fine Agg.
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('age')}
                  className="py-3 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    Age (d)
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('strength')}
                  className="py-3 px-3 cursor-pointer text-amber-400 hover:text-amber-300 bg-amber-500/5"
                >
                  <div className="flex items-center gap-1">
                    Strength (MPa)
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-300">
              {pagedSamples.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400 font-sans">
                    No concrete specimens match your selected criteria. Try adjusting the search or filter filters.
                  </td>
                </tr>
              ) : (
                pagedSamples.map(sample => {
                  const isHighStrength = sample.strength >= 50;
                  const isUltraHigh = sample.strength >= 65;
                  return (
                    <tr 
                      key={sample.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2.5 px-3 text-slate-400 font-medium">#{sample.id}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-200">{sample.cement}</td>
                      <td className="py-2.5 px-3 text-slate-400">{sample.slag || '0'}</td>
                      <td className="py-2.5 px-3 text-slate-400">{sample.flyAsh || '0'}</td>
                      <td className="py-2.5 px-3 text-blue-300">{sample.water}</td>
                      <td className="py-2.5 px-3 text-purple-300">{sample.superplasticizer || '0.0'}</td>
                      <td className="py-2.5 px-3 text-slate-400">{sample.coarseAggregate}</td>
                      <td className="py-2.5 px-3 text-slate-400">{sample.fineAggregate}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          sample.age === 28 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {sample.age} d
                        </span>
                      </td>
                      <td className="py-2.5 px-3 bg-amber-500/5">
                        <span className={`font-bold ${
                          isUltraHigh 
                            ? 'text-amber-400' 
                            : isHighStrength 
                            ? 'text-emerald-400' 
                            : 'text-slate-200'
                        }`}>
                          {sample.strength.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => {
                            if (onLoadMixToCalculator) onLoadMixToCalculator(sample);
                            if (onNavigateToCalculator) onNavigateToCalculator();
                          }}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 text-[10px] font-sans font-semibold transition-colors cursor-pointer"
                        >
                          Use Mix
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredSamples.length)} of {filteredSamples.length} specimens
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 text-slate-300 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-slate-200 px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 text-slate-300 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
