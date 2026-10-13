import { MixInput, TrainedModel } from './models';

export interface InverseMixRequirements {
  targetStrength: number; // MPa
  cement: number; // kg/m³
  coarseAggregate: number; // kg/m³
  fineAggregate: number; // kg/m³
  slag?: number; // optional, kg/m³
  flyAsh?: number; // optional, kg/m³
  age?: number; // default 28 days
}

export interface InverseMixSolution {
  recommendedWater: number; // kg/m³
  recommendedSuperplasticizer: number; // kg/m³
  spPercentageOfBinder: number; // % by weight of cementitious material
  achievedPredictedStrength: number; // MPa
  targetStrength: number; // MPa
  errorMargin: number; // |predicted - target|
  waterBinderRatio: number; // w/b
  totalBinder: number; // C + S + FA
  totalUnitWeight: number; // kg/m³
  volumetricYield: number; // m³ (expected ~1.00 m³)
  yieldDifferencePercent: number; // % deviation from 1 m³
  workabilitySlumpEstimate: string; // e.g., "120-150 mm (Medium-High Slump)"
  durabilityRating: 'Excellent' | 'Good' | 'Moderate' | 'Warning';
  durabilityNotes: string[];
  candidateAlternatives: Array<{
    water: number;
    superplasticizer: number;
    predictedStrength: number;
    wbRatio: number;
    label: string;
  }>;
}

/**
 * Perform inverse mix design optimization using the trained ML model
 */
export function solveInverseMixDesign(
  req: InverseMixRequirements,
  model: TrainedModel
): InverseMixSolution {
  const cement = Math.max(100, Math.min(600, req.cement));
  const coarseAgg = Math.max(700, Math.min(1300, req.coarseAggregate));
  const fineAgg = Math.max(500, Math.min(1100, req.fineAggregate));
  const slag = Math.max(0, req.slag ?? 0);
  const flyAsh = Math.max(0, req.flyAsh ?? 0);
  const age = Math.max(1, Math.min(365, req.age ?? 28));
  const target = Math.max(10, Math.min(85, req.targetStrength));

  const totalBinder = cement + slag + flyAsh;

  // Grid search search space
  // Water: 125 kg to 230 kg
  // SP: 0 to 22 kg
  let bestScore = Infinity;
  let bestWater = 175;
  let bestSp = 5;
  let bestPred = 35;

  const candidates: Array<{
    water: number;
    superplasticizer: number;
    pred: number;
    score: number;
    wb: number;
  }> = [];

  for (let w = 125; w <= 225; w += 3) {
    for (let sp = 0; sp <= 20; sp += 0.8) {
      const input: MixInput = {
        cement,
        slag,
        flyAsh,
        water: w,
        superplasticizer: sp,
        coarseAggregate: coarseAgg,
        fineAggregate: fineAgg,
        age,
      };

      const pred = model.predict(input);
      const strengthDiff = Math.abs(pred - target);
      const wb = w / (totalBinder || 1);

      // Penalties for unrealistic concrete physics
      let penalty = 0;
      if (wb > 0.65 && target > 35) penalty += 25; // High w/b cannot sustain high strength
      if (wb < 0.28) penalty += 35; // Too dry, impossible compaction without extreme compaction
      if (sp > 15 && totalBinder < 320) penalty += 15; // Excessive dosage risk of segregation
      if (sp === 0 && wb < 0.38) penalty += 25; // Need plasticizer for low w/b

      // Prefer cost-effective moderate SP dosage
      const costPenalty = sp * 0.2;

      const score = strengthDiff * 1.5 + penalty + costPenalty;

      candidates.push({
        water: w,
        superplasticizer: Math.round(sp * 10) / 10,
        pred,
        score,
        wb,
      });

      if (score < bestScore) {
        bestScore = score;
        bestWater = w;
        bestSp = Math.round(sp * 10) / 10;
        bestPred = pred;
      }
    }
  }

  const wbRatio = Math.round((bestWater / totalBinder) * 100) / 100;
  const spPercent = Math.round(((bestSp / totalBinder) * 100) * 100) / 100;

  // Volumetric yield calculation
  // Specific gravities (typical): Cement=3.15, Slag=2.90, FlyAsh=2.25, Agg=2.65, Water=1.00, SP=1.10
  const volBinder = cement / 3150 + slag / 2900 + flyAsh / 2250;
  const volWater = bestWater / 1000;
  const volAgg = coarseAgg / 2650 + fineAgg / 2650;
  const volSp = bestSp / 1100;
  const entrappedAir = 0.018; // ~1.8% entrapped air
  const volumetricYield = Math.round((volBinder + volWater + volAgg + volSp + entrappedAir) * 1000) / 1000;
  const yieldDiffPct = Math.round(((volumetricYield - 1.0) / 1.0) * 1000) / 10;
  const totalUnitWeight = Math.round(cement + slag + flyAsh + bestWater + bestSp + coarseAgg + fineAgg);

  // Slump classification estimate based on SP and water
  let slump = '80 - 120 mm (Normal Placed)';
  if (bestSp >= 8 || bestWater > 200) {
    slump = '150 - 200 mm (High Workability / Pumpable)';
  } else if (bestSp >= 4 && bestWater >= 165) {
    slump = '110 - 150 mm (Medium-High Slump for Columns & Beams)';
  } else if (bestWater < 150 && bestSp < 3) {
    slump = '25 - 50 mm (Low Slump / Pavement)';
  }

  // Durability evaluation
  const durabilityNotes: string[] = [];
  let durabilityRating: 'Excellent' | 'Good' | 'Moderate' | 'Warning' = 'Good';

  if (wbRatio <= 0.40) {
    durabilityRating = 'Excellent';
    durabilityNotes.push('Low permeability: Excellent resistance to chloride penetration and carbonation.');
  } else if (wbRatio <= 0.50) {
    durabilityRating = 'Good';
    durabilityNotes.push('Satisfies standard ACI 318 / EN 206 exposure classes for reinforced columns.');
  } else if (wbRatio <= 0.60) {
    durabilityRating = 'Moderate';
    durabilityNotes.push('Permissible for unexposed interior elements, but may increase drying shrinkage.');
  } else {
    durabilityRating = 'Warning';
    durabilityNotes.push('High w/b ratio (>0.60): Increased capillary porosity and reduced long-term durability.');
  }

  if (Math.abs(yieldDiffPct) > 8.0) {
    durabilityNotes.push(`Volumetric yield imbalance (${yieldDiffPct > 0 ? '+' : ''}${yieldDiffPct}%): Consider adjusting fine/coarse aggregate ratio to balance exactly 1 m³.`);
  }

  // Pick 3 diverse alternative trade-offs
  const candidateAlternatives = [
    {
      water: Math.max(130, bestWater - 12),
      superplasticizer: Math.min(18, Math.round((bestSp + 3.5) * 10) / 10),
      label: 'Lower Water / Higher Superplasticizer (High Early Strength)',
    },
    {
      water: bestWater,
      superplasticizer: bestSp,
      label: 'Balanced Optimization (Recommended)',
    },
    {
      water: Math.min(215, bestWater + 15),
      superplasticizer: Math.max(0, Math.round((bestSp - 2.5) * 10) / 10),
      label: 'Higher Water / Lower Admixture (Cost Economy)',
    },
  ].map(alt => {
    const p = model.predict({
      cement,
      slag,
      flyAsh,
      water: alt.water,
      superplasticizer: alt.superplasticizer,
      coarseAggregate: coarseAgg,
      fineAggregate: fineAgg,
      age,
    });
    return {
      water: alt.water,
      superplasticizer: alt.superplasticizer,
      predictedStrength: p,
      wbRatio: Math.round((alt.water / totalBinder) * 100) / 100,
      label: alt.label,
    };
  });

  return {
    recommendedWater: bestWater,
    recommendedSuperplasticizer: bestSp,
    spPercentageOfBinder: spPercent,
    achievedPredictedStrength: bestPred,
    targetStrength: target,
    errorMargin: Math.round(Math.abs(bestPred - target) * 10) / 10,
    waterBinderRatio: wbRatio,
    totalBinder,
    totalUnitWeight,
    volumetricYield,
    yieldDifferencePercent: yieldDiffPct,
    workabilitySlumpEstimate: slump,
    durabilityRating,
    durabilityNotes,
    candidateAlternatives,
  };
}

/**
 * Predict maturity development curve over standard civil curing intervals
 */
export function computeMaturityCurve(baseMix: Omit<MixInput, 'age'>, model: TrainedModel) {
  const testAges = [1, 3, 7, 14, 28, 56, 90, 180, 365];
  return testAges.map(age => {
    const strength = model.predict({ ...baseMix, age });
    return {
      age,
      strength,
      percentOf28Day: 0, // computed below
    };
  }).map((item, _, arr) => {
    const s28 = arr.find(x => x.age === 28)?.strength || 1;
    return {
      ...item,
      percentOf28Day: Math.round((item.strength / s28) * 100),
    };
  });
}
