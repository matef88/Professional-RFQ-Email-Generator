import type { EvaluationCriteria } from "@/lib/db/schema";

export interface QuoteForScoring {
  id: string;
  supplierId: string;
  totalAmount: string | null;
  deliveryDays: number | null;
  scores: Record<string, number> | null;
  totalScore: string | null;
  [key: string]: unknown;
}

export interface QuoteWithRank extends QuoteForScoring {
  rank: number;
  calculatedTotalScore: number;
}

export function calculatePriceScore(
  quoteAmount: string | null,
  allAmounts: (string | null)[],
): number {
  if (!quoteAmount) return 0;

  const numericAmounts = allAmounts
    .filter((a): a is string => a !== null)
    .map(Number)
    .filter((n) => n > 0);

  if (numericAmounts.length === 0) return 0;

  const amount = Number(quoteAmount);
  if (amount <= 0) return 0;

  const minAmount = Math.min(...numericAmounts);
  const maxAmount = Math.max(...numericAmounts);

  if (minAmount === maxAmount) return 100;

  return Math.round(((maxAmount - amount) / (maxAmount - minAmount)) * 100);
}

export function calculateDeliveryScore(
  deliveryDays: number | null,
  allDeliveryDays: (number | null)[],
): number {
  if (deliveryDays === null) return 0;

  const numericDays = allDeliveryDays.filter(
    (d): d is number => d !== null && d > 0,
  );

  if (numericDays.length === 0) return 0;

  if (deliveryDays <= 0) return 0;

  const minDays = Math.min(...numericDays);
  const maxDays = Math.max(...numericDays);

  if (minDays === maxDays) return 100;

  return Math.round(
    ((maxDays - deliveryDays) / (maxDays - minDays)) * 100,
  );
}

export function calculateWeightedTotal(
  scores: Record<string, number>,
  criteria: EvaluationCriteria[],
): number {
  if (criteria.length === 0) return 0;

  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight === 0) return 0;

  let weightedSum = 0;
  for (const criterion of criteria) {
    const score = scores[criterion.name] ?? 0;
    weightedSum += score * (criterion.weight / totalWeight);
  }

  return Math.round(weightedSum * 100) / 100;
}

export function rankQuotes(
  quotes: QuoteForScoring[],
  criteria: EvaluationCriteria[],
): QuoteWithRank[] {
  const withScores = quotes.map((q) => {
    const mergedScores = { ...(q.scores ?? {}) };
    const total = calculateWeightedTotal(mergedScores, criteria);

    return {
      ...q,
      calculatedTotalScore: total,
    };
  });

  withScores.sort((a, b) => b.calculatedTotalScore - a.calculatedTotalScore);

  let currentRank = 1;
  return withScores.map((q, idx) => {
    if (idx > 0 && q.calculatedTotalScore < withScores[idx - 1].calculatedTotalScore) {
      currentRank = idx + 1;
    }
    return { ...q, rank: currentRank };
  });
}

export function autoScoreQuotes(
  quotes: QuoteForScoring[],
  criteria: EvaluationCriteria[],
): Map<string, Record<string, number>> {
  const allAmounts = quotes.map((q) => q.totalAmount);
  const allDeliveryDays = quotes.map((q) => q.deliveryDays);

  const result = new Map<string, Record<string, number>>();

  for (const q of quotes) {
    const scores: Record<string, number> = { ...(q.scores ?? {}) };

    for (const criterion of criteria) {
      if (criterion.type === "price") {
        scores[criterion.name] = calculatePriceScore(q.totalAmount, allAmounts);
      } else if (criterion.type === "delivery") {
        scores[criterion.name] = calculateDeliveryScore(
          q.deliveryDays,
          allDeliveryDays,
        );
      }
    }

    result.set(q.id, scores);
  }

  return result;
}

export const DEFAULT_EVALUATION_CRITERIA: EvaluationCriteria[] = [
  { name: "Price", weight: 40, type: "price" },
  { name: "Delivery", weight: 20, type: "delivery" },
  { name: "Quality", weight: 20, type: "quality" },
  { name: "Technical Capability", weight: 20, type: "custom" },
];
