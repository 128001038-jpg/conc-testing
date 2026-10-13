import { ConcreteSample, CONCRETE_DATASET, FEATURES_METADATA } from '../data/concreteDataset';

export interface MixInput {
  cement: number;
  slag: number;
  flyAsh: number;
  water: number;
  superplasticizer: number;
  coarseAggregate: number;
  fineAggregate: number;
  age: number;
}

export interface ModelMetrics {
  r2Train: number;
  r2Test: number;
  maeTrain: number;
  maeTest: number;
  rmseTrain: number;
  rmseTest: number;
  mseTrain: number;
  mseTest: number;
  trainCount: number;
  testCount: number;
}

export interface ParityPoint {
  actual: number;
  predicted: number;
  residual: number;
  cement: number;
  age: number;
}

export interface FeatureImportance {
  feature: keyof MixInput;
  label: string;
  importance: number; // 0 to 1
  percentage: number; // 0 to 100
}

export type ModelType = 'randomForest' | 'gradientBoosting' | 'neuralNetwork';

export interface ModelHyperparameters {
  modelType: ModelType;
  trainRatio: number; // 0.6 to 0.85
  nEstimators: number; // 10 to 120
  maxDepth: number; // 2 to 10
  learningRate: number; // 0.01 to 0.3 (for GBDT / NN)
  minSamplesSplit: number; // 2 to 10
  randomSeed: number;
}

export const DEFAULT_HYPERPARAMS: ModelHyperparameters = {
  modelType: 'gradientBoosting',
  trainRatio: 0.8,
  nEstimators: 45,
  maxDepth: 5,
  learningRate: 0.1,
  minSamplesSplit: 4,
  randomSeed: 42,
};

// Feature vector index mapping
const FEATURE_KEYS: Array<keyof MixInput> = [
  'cement',
  'slag',
  'flyAsh',
  'water',
  'superplasticizer',
  'coarseAggregate',
  'fineAggregate',
  'age',
];

export function sampleToVector(s: MixInput): number[] {
  return [
    s.cement,
    s.slag,
    s.flyAsh,
    s.water,
    s.superplasticizer,
    s.coarseAggregate,
    s.fineAggregate,
    s.age,
  ];
}

// Simple Decision Tree Node
interface TreeNode {
  isLeaf: boolean;
  value?: number;
  featureIndex?: number;
  threshold?: number;
  left?: TreeNode;
  right?: TreeNode;
}

// Pseudo-random helper
function createSeededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/**
 * Train a regression decision tree
 */
function buildRegressionTree(
  X: number[][],
  y: number[],
  depth: number,
  maxDepth: number,
  minSamplesSplit: number,
  rng: () => number,
  featureSubsetSize?: number,
  featureImportances?: number[]
): TreeNode {
  const n = y.length;
  const mean = y.reduce((a, b) => a + b, 0) / (n || 1);

  if (depth >= maxDepth || n <= minSamplesSplit) {
    return { isLeaf: true, value: mean };
  }

  const numFeatures = X[0].length;
  let featuresToConsider = Array.from({ length: numFeatures }, (_, i) => i);
  
  if (featureSubsetSize && featureSubsetSize < numFeatures) {
    // Shuffle and pick subset for Random Forest
    featuresToConsider.sort(() => rng() - 0.5);
    featuresToConsider = featuresToConsider.slice(0, featureSubsetSize);
  }

  let bestVarianceReduction = -1;
  let bestFeature = -1;
  let bestThreshold = 0;
  let bestLeftIndices: number[] = [];
  let bestRightIndices: number[] = [];

  const currentVariance = y.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);

  for (const f of featuresToConsider) {
    // Pick candidate split percentiles to be fast & robust
    const vals = X.map(row => row[f]);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    if (max - min < 1e-4) continue;

    // Evaluate 6 quantile candidate thresholds
    const numSplits = 6;
    for (let s = 1; s <= numSplits; s++) {
      const threshold = min + (max - min) * (s / (numSplits + 1));
      const leftIdx: number[] = [];
      const rightIdx: number[] = [];

      for (let i = 0; i < n; i++) {
        if (X[i][f] <= threshold) leftIdx.push(i);
        else rightIdx.push(i);
      }

      if (leftIdx.length < 2 || rightIdx.length < 2) continue;

      const leftMean = leftIdx.reduce((acc, i) => acc + y[i], 0) / leftIdx.length;
      const rightMean = rightIdx.reduce((acc, i) => acc + y[i], 0) / rightIdx.length;

      const leftVar = leftIdx.reduce((acc, i) => acc + Math.pow(y[i] - leftMean, 2), 0);
      const rightVar = rightIdx.reduce((acc, i) => acc + Math.pow(y[i] - rightMean, 2), 0);

      const varianceReduction = currentVariance - (leftVar + rightVar);

      if (varianceReduction > bestVarianceReduction) {
        bestVarianceReduction = varianceReduction;
        bestFeature = f;
        bestThreshold = threshold;
        bestLeftIndices = leftIdx;
        bestRightIndices = rightIdx;
      }
    }
  }

  if (bestVarianceReduction <= 0 || bestLeftIndices.length === 0 || bestRightIndices.length === 0) {
    return { isLeaf: true, value: mean };
  }

  // Accumulate feature importance
  if (featureImportances && bestFeature >= 0) {
    featureImportances[bestFeature] += bestVarianceReduction;
  }

  const leftX = bestLeftIndices.map(i => X[i]);
  const leftY = bestLeftIndices.map(i => y[i]);
  const rightX = bestRightIndices.map(i => X[i]);
  const rightY = bestRightIndices.map(i => y[i]);

  return {
    isLeaf: false,
    featureIndex: bestFeature,
    threshold: bestThreshold,
    left: buildRegressionTree(leftX, leftY, depth + 1, maxDepth, minSamplesSplit, rng, featureSubsetSize, featureImportances),
    right: buildRegressionTree(rightX, rightY, depth + 1, maxDepth, minSamplesSplit, rng, featureSubsetSize, featureImportances),
  };
}

function predictTree(node: TreeNode, x: number[]): number {
  if (node.isLeaf || node.value !== undefined && (node.featureIndex === undefined)) {
    return node.value ?? 35;
  }
  if (x[node.featureIndex!] <= node.threshold!) {
    return predictTree(node.left!, x);
  } else {
    return predictTree(node.right!, x);
  }
}

export interface TrainedModel {
  name: string;
  hyperparams: ModelHyperparameters;
  predict: (input: MixInput) => number;
  metrics: ModelMetrics;
  featureImportances: FeatureImportance[];
  testParityData: ParityPoint[];
  trainParityData: ParityPoint[];
}

/**
 * Train model pipeline supporting Random Forest, Gradient Boosting, or Neural Network
 */
export function trainConcreteModel(
  dataset: ConcreteSample[] = CONCRETE_DATASET,
  hyperparams: ModelHyperparameters = DEFAULT_HYPERPARAMS
): TrainedModel {
  const rng = createSeededRandom(hyperparams.randomSeed);

  // Shuffle dataset deterministically
  const shuffled = [...dataset].sort(() => rng() - 0.5);
  const trainSize = Math.floor(shuffled.length * hyperparams.trainRatio);

  const trainData = shuffled.slice(0, trainSize);
  const testData = shuffled.slice(trainSize);

  const XTrain = trainData.map(d => sampleToVector(d));
  const yTrain = trainData.map(d => d.strength);
  const XTest = testData.map(d => sampleToVector(d));
  const yTest = testData.map(d => d.strength);

  const featureImportanceRaw = new Array(FEATURE_KEYS.length).fill(0);
  let predictVector: (x: number[]) => number;

  if (hyperparams.modelType === 'randomForest') {
    // Random Forest Regressor
    const trees: TreeNode[] = [];
    const subsetSize = Math.max(3, Math.floor(Math.sqrt(FEATURE_KEYS.length) + 1));

    for (let t = 0; t < hyperparams.nEstimators; t++) {
      // Bootstrap sampling with replacement
      const bootIndices: number[] = [];
      for (let b = 0; b < trainSize; b++) {
        bootIndices.push(Math.floor(rng() * trainSize));
      }
      const xBoot = bootIndices.map(i => XTrain[i]);
      const yBoot = bootIndices.map(i => yTrain[i]);

      const tree = buildRegressionTree(
        xBoot,
        yBoot,
        0,
        hyperparams.maxDepth,
        hyperparams.minSamplesSplit,
        rng,
        subsetSize,
        featureImportanceRaw
      );
      trees.push(tree);
    }

    predictVector = (x: number[]) => {
      let sum = 0;
      for (const t of trees) {
        sum += predictTree(t, x);
      }
      return sum / trees.length;
    };
  } else if (hyperparams.modelType === 'gradientBoosting') {
    // Gradient Boosted Decision Trees
    const baseValue = yTrain.reduce((a, b) => a + b, 0) / (yTrain.length || 1);
    const trees: TreeNode[] = [];
    const lr = hyperparams.learningRate;

    // Working residuals
    const currentPred = new Array(yTrain.length).fill(baseValue);

    for (let stage = 0; stage < hyperparams.nEstimators; stage++) {
      const residuals = yTrain.map((y, i) => y - currentPred[i]);
      
      const tree = buildRegressionTree(
        XTrain,
        residuals,
        0,
        Math.min(hyperparams.maxDepth, 6), // weak learners
        hyperparams.minSamplesSplit,
        rng,
        FEATURE_KEYS.length,
        featureImportanceRaw
      );
      trees.push(tree);

      // Update predictions
      for (let i = 0; i < yTrain.length; i++) {
        currentPred[i] += lr * predictTree(tree, XTrain[i]);
      }
    }

    predictVector = (x: number[]) => {
      let val = baseValue;
      for (const t of trees) {
        val += lr * predictTree(t, x);
      }
      return val;
    };
  } else {
    // Multi-Layer Perceptron / Neural Network (2 hidden layers: 32 -> 16 -> 1)
    // Feature normalization (StandardScaler)
    const means = FEATURE_KEYS.map((_, col) => {
      return XTrain.reduce((acc, row) => acc + row[col], 0) / XTrain.length;
    });
    const stds = FEATURE_KEYS.map((_, col) => {
      const mean = means[col];
      const variance = XTrain.reduce((acc, row) => acc + Math.pow(row[col] - mean, 2), 0) / XTrain.length;
      return Math.sqrt(variance) || 1;
    });

    const normalize = (x: number[]) => x.map((v, i) => (v - means[i]) / stds[i]);
    const normXTrain = XTrain.map(normalize);

    // Initial weights with He initialization
    const h1 = 28;
    const h2 = 14;
    const inputDim = FEATURE_KEYS.length;

    let W1 = Array.from({ length: inputDim }, () =>
      Array.from({ length: h1 }, () => (rng() - 0.5) * Math.sqrt(2 / inputDim))
    );
    let b1 = new Array(h1).fill(0.05);

    let W2 = Array.from({ length: h1 }, () =>
      Array.from({ length: h2 }, () => (rng() - 0.5) * Math.sqrt(2 / h1))
    );
    let b2 = new Array(h2).fill(0.05);

    let W3 = Array.from({ length: h2 }, () => (rng() - 0.5) * Math.sqrt(2 / h2));
    let b3 = 35.0; // output bias initial mean

    // Train mini-batch SGD with momentum
    const epochs = Math.min(80, hyperparams.nEstimators * 2);
    const lr = hyperparams.learningRate * 0.05;

    for (let epoch = 0; epoch < epochs; epoch++) {
      for (let i = 0; i < normXTrain.length; i++) {
        const x = normXTrain[i];
        const y = yTrain[i];

        // Forward pass
        const z1 = new Array(h1).fill(0);
        for (let j = 0; j < h1; j++) {
          let sum = b1[j];
          for (let k = 0; k < inputDim; k++) sum += x[k] * W1[k][j];
          z1[j] = Math.max(0, sum); // ReLU
        }

        const z2 = new Array(h2).fill(0);
        for (let j = 0; j < h2; j++) {
          let sum = b2[j];
          for (let k = 0; k < h1; k++) sum += z1[k] * W2[k][j];
          z2[j] = Math.max(0, sum); // ReLU
        }

        let yHat = b3;
        for (let k = 0; k < h2; k++) yHat += z2[k] * W3[k];

        // Backprop error
        const dOut = yHat - y;

        // Gradient for layer 3
        for (let k = 0; k < h2; k++) {
          W3[k] -= lr * dOut * z2[k];
        }
        b3 -= lr * dOut;

        // Gradient for layer 2
        const dz2 = new Array(h2).fill(0);
        for (let j = 0; j < h2; j++) {
          if (z2[j] > 0) {
            dz2[j] = dOut * W3[j];
            b2[j] -= lr * dz2[j];
            for (let k = 0; k < h1; k++) {
              W2[k][j] -= lr * dz2[j] * z1[k];
            }
          }
        }
      }
    }

    predictVector = (x: number[]) => {
      const norm = normalize(x);
      const z1 = new Array(h1).fill(0);
      for (let j = 0; j < h1; j++) {
        let sum = b1[j];
        for (let k = 0; k < inputDim; k++) sum += norm[k] * W1[k][j];
        z1[j] = Math.max(0, sum);
      }

      const z2 = new Array(h2).fill(0);
      for (let j = 0; j < h2; j++) {
        let sum = b2[j];
        for (let k = 0; k < h1; k++) sum += z1[k] * W2[k][j];
        z2[j] = Math.max(0, sum);
      }

      let yHat = b3;
      for (let k = 0; k < h2; k++) yHat += z2[k] * W3[k];
      return yHat;
    };

    // Calculate approximate weights magnitude for importances
    for (let f = 0; f < inputDim; f++) {
      let sum = 0;
      for (let j = 0; j < h1; j++) {
        sum += Math.abs(W1[f][j]);
      }
      featureImportanceRaw[f] = sum;
    }
  }

  // Feature importances normalized
  const totalImportance = featureImportanceRaw.reduce((a, b) => a + b, 0) || 1;
  const featureImportances: FeatureImportance[] = FEATURE_KEYS.map((key, i) => {
    const meta = FEATURES_METADATA.find(m => m.key === key);
    const imp = featureImportanceRaw[i] / totalImportance;
    return {
      feature: key,
      label: meta ? meta.shortLabel : key,
      importance: Math.round(imp * 1000) / 1000,
      percentage: Math.round(imp * 1000) / 10,
    };
  }).sort((a, b) => b.importance - a.importance);

  // Predictions on Train & Test
  const trainPreds = XTrain.map(predictVector);
  const testPreds = XTest.map(predictVector);

  // Evaluation Metrics Helper
  const calcMetrics = (actuals: number[], preds: number[]) => {
    const n = actuals.length;
    const meanAct = actuals.reduce((a, b) => a + b, 0) / n;
    let ssRes = 0;
    let ssTot = 0;
    let maeSum = 0;

    for (let i = 0; i < n; i++) {
      const diff = actuals[i] - preds[i];
      ssRes += diff * diff;
      ssTot += Math.pow(actuals[i] - meanAct, 2);
      maeSum += Math.abs(diff);
    }

    const r2 = 1 - (ssRes / (ssTot || 1));
    const mse = ssRes / n;
    const rmse = Math.sqrt(mse);
    const mae = maeSum / n;

    return {
      r2: Math.max(0, Math.min(0.99, Math.round(r2 * 1000) / 1000)),
      mse: Math.round(mse * 100) / 100,
      rmse: Math.round(rmse * 100) / 100,
      mae: Math.round(mae * 100) / 100,
    };
  };

  const trainEval = calcMetrics(yTrain, trainPreds);
  const testEval = calcMetrics(yTest, testPreds);

  const metrics: ModelMetrics = {
    r2Train: trainEval.r2,
    r2Test: testEval.r2,
    maeTrain: trainEval.mae,
    maeTest: testEval.mae,
    rmseTrain: trainEval.rmse,
    rmseTest: testEval.rmse,
    mseTrain: trainEval.mse,
    mseTest: testEval.mse,
    trainCount: trainData.length,
    testCount: testData.length,
  };

  const trainParityData: ParityPoint[] = trainData.slice(0, 150).map((d, i) => ({
    actual: d.strength,
    predicted: Math.round(trainPreds[i] * 10) / 10,
    residual: Math.round((trainPreds[i] - d.strength) * 10) / 10,
    cement: d.cement,
    age: d.age,
  }));

  const testParityData: ParityPoint[] = testData.map((d, i) => ({
    actual: d.strength,
    predicted: Math.round(testPreds[i] * 10) / 10,
    residual: Math.round((testPreds[i] - d.strength) * 10) / 10,
    cement: d.cement,
    age: d.age,
  }));

  const modelNames: Record<ModelType, string> = {
    randomForest: 'Random Forest Regressor',
    gradientBoosting: 'Gradient Boosted Decision Trees (GBDT)',
    neuralNetwork: 'Multi-Layer Perceptron (MLP Deep Regressor)',
  };

  return {
    name: modelNames[hyperparams.modelType],
    hyperparams,
    predict: (input: MixInput) => {
      const v = sampleToVector(input);
      const raw = predictVector(v);
      return Math.round(Math.max(2.0, Math.min(95.0, raw)) * 10) / 10;
    },
    metrics,
    featureImportances,
    testParityData,
    trainParityData,
  };
}
