import React, { useState } from 'react';
import { 
  TrainedModel, 
  ModelHyperparameters, 
  ModelType, 
  trainConcreteModel 
} from '../ml/models';
import { 
  Cpu, 
  Sliders, 
  TrendingUp, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  BarChart2,
  Award,
  Layers,
  HelpCircle
} from 'lucide-react';

interface ModelTrainerProps {
  currentModel: TrainedModel;
  onModelUpdated: (newModel: TrainedModel) => void;
}

export const ModelTrainer: React.FC<ModelTrainerProps> = ({
  currentModel,
  onModelUpdated,
}) => {
  const [params, setParams] = useState<ModelHyperparameters>(currentModel.hyperparams);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainingSuccessMsg, setTrainingSuccessMsg] = useState<string | null>(null);

  const handleTrain = () => {
    setIsTraining(true);
    setTrainingSuccessMsg(null);

    // Simulate async compute / train to give interactive responsiveness
    setTimeout(() => {
      const updated = trainConcreteModel(undefined, params);
      onModelUpdated(updated);
      setIsTraining(false);
      setTrainingSuccessMsg(`Model successfully trained! Achieved Test R² = ${updated.metrics.r2Test} and RMSE = ${updated.metrics.rmseTest} MPa.`);
      setTimeout(() => setTrainingSuccessMsg(null), 5000);
    }, 400);
  };

  const getR2Badge = (r2: number) => {
    if (r2 >= 0.88) return { label: 'Excellent Generalization', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    if (r2 >= 0.80) return { label: 'Strong Predictive Fit', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' };
    if (r2 >= 0.70) return { label: 'Moderate Fit', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    return { label: 'Underfitting Detected', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
  };

  const badge = getR2Badge(currentModel.metrics.r2Test);
  const overfittingGap = Math.round(Math.abs(currentModel.metrics.r2Train - currentModel.metrics.r2Test) * 1000) / 1000;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-white">
                Machine Learning Regression Model & Hyperparameter Tuning
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Train nonlinear regression algorithms to predict 28-day concrete compressive strength based on the 1,030-specimen UCI benchmark.
              Tune estimators, tree depth, and learning rates to optimize R², MAE, and RMSE.
            </p>
          </div>

          <button
            onClick={handleTrain}
            disabled={isTraining}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <RotateCw className={`w-4 h-4 ${isTraining ? 'animate-spin' : ''}`} />
            <span>{isTraining ? 'Training in Progress...' : 'Train & Evaluate Model'}</span>
          </button>
        </div>

        {trainingSuccessMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn font-mono">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{trainingSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Main Grid: Controls vs Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Hyperparameter Controls (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              Hyperparameter Tuning
            </h3>
            <span className="text-[11px] font-mono text-slate-400">UCI Concrete (1,030)</span>
          </div>

          {/* Model Type Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 block">
              Regression Algorithm
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'gradientBoosting', label: 'Gradient Boosting (GBDT)', desc: 'Sequential residual boosting' },
                { id: 'randomForest', label: 'Random Forest', desc: 'Bootstrap aggregation ensemble' },
                { id: 'neuralNetwork', label: 'Neural Network (MLP)', desc: '2-Layer deep regressor' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setParams({ ...params, modelType: opt.id as ModelType })}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    params.modelType === opt.id
                      ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs font-semibold">{opt.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-4 pt-2">
            {/* Estimators / Trees */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">
                  {params.modelType === 'neuralNetwork' ? 'Training Epochs' : 'Number of Estimators (Trees)'}
                </span>
                <span className="font-mono text-amber-400 font-bold">{params.nEstimators}</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={params.nEstimators}
                onChange={e => setParams({ ...params, nEstimators: parseInt(e.target.value, 10) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block">
                Higher counts reduce variance but increase computation time.
              </span>
            </div>

            {/* Max Depth */}
            {params.modelType !== 'neuralNetwork' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Max Tree Depth</span>
                  <span className="font-mono text-amber-400 font-bold">{params.maxDepth}</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={9}
                  step={1}
                  value={params.maxDepth}
                  onChange={e => setParams({ ...params, maxDepth: parseInt(e.target.value, 10) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 block">
                  Controls individual tree complexity (depth &gt; 7 risks overfitting).
                </span>
              </div>
            )}

            {/* Learning Rate */}
            {(params.modelType === 'gradientBoosting' || params.modelType === 'neuralNetwork') && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Learning Rate (Shrinkage η)</span>
                  <span className="font-mono text-amber-400 font-bold">{params.learningRate}</span>
                </div>
                <input
                  type="range"
                  min={0.02}
                  max={0.3}
                  step={0.02}
                  value={params.learningRate}
                  onChange={e => setParams({ ...params, learningRate: parseFloat(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 block">
                  Step size shrinkage applied to each sequential boosting update.
                </span>
              </div>
            )}

            {/* Train/Test Split */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Train / Test Split Ratio</span>
                <span className="font-mono text-cyan-400 font-bold">
                  {Math.round(params.trainRatio * 100)}% / {Math.round((1 - params.trainRatio) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.6}
                max={0.85}
                step={0.05}
                value={params.trainRatio}
                onChange={e => setParams({ ...params, trainRatio: parseFloat(e.target.value) })}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block">
                Standard cross-validation split (typically 80/20 for civil materials data).
              </span>
            </div>

            {/* Min samples split */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Min Samples per Split</span>
                <span className="font-mono text-slate-300 font-bold">{params.minSamplesSplit}</span>
              </div>
              <input
                type="range"
                min={2}
                max={8}
                step={1}
                value={params.minSamplesSplit}
                onChange={e => setParams({ ...params, minSamplesSplit: parseInt(e.target.value, 10) })}
                className="w-full accent-slate-400 cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800">
            <button
              onClick={handleTrain}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isTraining ? 'animate-spin' : ''}`} />
              <span>Apply Parameters & Retrain</span>
            </button>
          </div>
        </div>

        {/* Right Column: Model Evaluation Cards & Parity Plot (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Metrics Scorecard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* R2 Card */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl relative overflow-hidden">
              <div className="text-[11px] text-slate-400 font-medium">R² (Test Set)</div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {currentModel.metrics.r2Test}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-1">
                Train R²: {currentModel.metrics.r2Train}
              </div>
              <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, currentModel.metrics.r2Test * 100)}%` }}
                />
              </div>
            </div>

            {/* RMSE Card */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-[11px] text-slate-400 font-medium">RMSE (Test)</div>
              <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                {currentModel.metrics.rmseTest} <span className="text-xs text-slate-400">MPa</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-1">
                Train RMSE: {currentModel.metrics.rmseTrain} MPa
              </div>
              <div className="text-[10px] text-emerald-400 mt-2 font-medium">
                Root Mean Sq. Error
              </div>
            </div>

            {/* MAE Card */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-[11px] text-slate-400 font-medium">MAE (Test)</div>
              <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
                {currentModel.metrics.maeTest} <span className="text-xs text-slate-400">MPa</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-1">
                Train MAE: {currentModel.metrics.maeTrain} MPa
              </div>
              <div className="text-[10px] text-slate-400 mt-2 font-medium">
                Mean Absolute Error
              </div>
            </div>

            {/* Generalization Assessment */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-[11px] text-slate-400 font-medium">Fit Assessment</div>
              <div className="text-sm font-bold text-white mt-1 leading-snug">
                {badge.label}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-1">
                Δ(Train - Test): {overfittingGap}
              </div>
              <div className="mt-2 text-[10px] text-emerald-400 font-medium">
                {overfittingGap < 0.08 ? 'Low Overfitting' : 'Moderate Variance'}
              </div>
            </div>
          </div>

          {/* Parity Plot: Actual vs Predicted Strength */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Model Parity Plot (Actual vs. Predicted Compressive Strength)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Ideal 45° line indicates perfect prediction on holdout test set ({currentModel.metrics.testCount} specimens)
                </p>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-950 text-amber-300 border border-slate-800">
                ±15% Error Envelope
              </span>
            </div>

            {/* Parity SVG */}
            <div className="w-full h-[280px] bg-slate-950 rounded-xl border border-slate-800/80 p-2 relative overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 600 280" preserveAspectRatio="none">
                {/* 45 degree ideal line */}
                <line
                  x1={40}
                  y1={250}
                  x2={560}
                  y2={30}
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />

                {/* +15% and -15% tolerance bands */}
                <line
                  x1={40}
                  y1={250 - 25}
                  x2={560}
                  y2={30 - 25}
                  stroke="rgba(245, 158, 11, 0.35)"
                  strokeDasharray="3 3"
                />
                <line
                  x1={40}
                  y1={250 + 25}
                  x2={560}
                  y2={30 + 25}
                  stroke="rgba(245, 158, 11, 0.35)"
                  strokeDasharray="3 3"
                />

                {/* Test data points */}
                {currentModel.testParityData.map((pt, i) => {
                  const maxRange = 85;
                  const cx = 40 + (pt.actual / maxRange) * 520;
                  const cy = 250 - (pt.predicted / maxRange) * 220;

                  return (
                    <circle
                      key={i}
                      cx={cx}
                      cy={cy}
                      r={3}
                      fill="#38bdf8"
                      opacity={0.7}
                      className="hover:r-5 hover:opacity-100 hover:fill-amber-400 cursor-pointer transition-all"
                    >
                      <title>Actual: {pt.actual} MPa, Pred: {pt.predicted} MPa, Residual: {pt.residual} MPa</title>
                    </circle>
                  );
                })}
              </svg>

              <div className="absolute left-8 bottom-1 text-[10px] font-mono text-slate-400">
                Actual Strength: 0 MPa
              </div>
              <div className="absolute right-6 bottom-1 text-[10px] font-mono text-slate-400">
                85 MPa
              </div>
              <div className="absolute left-1 top-6 text-[10px] font-mono text-slate-400">
                Pred: 85 MPa
              </div>
            </div>
          </div>

          {/* Feature Importances Ranking */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Feature Importances (Variance Reduction)</h3>
                <p className="text-xs text-slate-400">Relative quantitative influence on 28-day concrete strength</p>
              </div>
              <Award className="w-4 h-4 text-amber-400" />
            </div>

            <div className="space-y-2 pt-1">
              {currentModel.featureImportances.map(item => (
                <div key={item.feature} className="space-y-0.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-300 font-semibold">{item.label}</span>
                    <span className="text-amber-400 font-bold">{item.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-700"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
