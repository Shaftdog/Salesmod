/**
 * P2.2 Template: Bid Comparison
 * Creates comparison tables for competing bids/quotes
 */

import type { FileReference } from '../types';

interface BidComparisonParams {
  bids: BidInput[];
  comparisonCriteria?: string[];
  weightings?: Record<string, number>;
  includeRecommendation?: boolean;
  currencySymbol?: string;
}

interface BidInput {
  vendorName: string;
  bidAmount: number;
  turnaroundDays?: number;
  qualityScore?: number;
  features?: Record<string, boolean | string | number>;
  notes?: string;
  submittedDate?: string;
}

interface BidAnalysis {
  vendor: string;
  amount: number;
  amountRank: number;
  turnaroundDays?: number;
  turnaroundRank?: number;
  qualityScore?: number;
  qualityRank?: number;
  overallScore: number;
  overallRank: number;
  pros: string[];
  cons: string[];
}

interface BidComparisonResult {
  summary: {
    totalBids: number;
    lowestBid: { vendor: string; amount: number };
    highestBid: { vendor: string; amount: number };
    averageBid: number;
    fastestTurnaround?: { vendor: string; days: number };
    highestQuality?: { vendor: string; score: number };
  };
  analysis: BidAnalysis[];
  comparisonTable: {
    headers: string[];
    rows: (string | number)[][];
  };
  recommendation?: {
    recommended: string;
    reason: string;
    alternativeChoice?: string;
    alternativeReason?: string;
  };
}

/**
 * Execute bid comparison template
 */
export async function executeBidComparison(
  inputParams: Record<string, unknown>,
  inputFileRefs: FileReference[]
): Promise<{
  outputData: Record<string, unknown>;
  outputFileRefs?: FileReference[];
  memoryUsedMb?: number;
}> {
  // Validate bids are provided
  const bids = inputParams.bids as BidInput[] | undefined;
  if (!bids || bids.length === 0) {
    throw new Error('No bids provided for comparison');
  }

  const params: BidComparisonParams = {
    bids,
    includeRecommendation: true,
    currencySymbol: '$',
    weightings: {
      price: 0.4,
      turnaround: 0.3,
      quality: 0.3,
    },
    ...inputParams,
  };

  if (params.bids.length < 2) {
    throw new Error('Need at least 2 bids for comparison');
  }

  const result = compareBids(params);

  return {
    outputData: {
      success: true,
      result,
      processingTime: Date.now(),
    },
    memoryUsedMb: 1,
  };
}

/**
 * Compare bids and generate analysis
 */
function compareBids(params: BidComparisonParams): BidComparisonResult {
  const bids = params.bids;
  const weightings = params.weightings || { price: 0.4, turnaround: 0.3, quality: 0.3 };

  // Calculate summary stats
  const amounts = bids.map((b) => b.bidAmount);
  const lowestAmount = Math.min(...amounts);
  const highestAmount = Math.max(...amounts);
  const averageBid = amounts.reduce((a, b) => a + b, 0) / amounts.length;

  const lowestBid = bids.find((b) => b.bidAmount === lowestAmount)!;
  const highestBid = bids.find((b) => b.bidAmount === highestAmount)!;

  // Find fastest turnaround
  const turnaroundBids = bids.filter((b) => b.turnaroundDays !== undefined);
  let fastestTurnaround: { vendor: string; days: number } | undefined;
  if (turnaroundBids.length > 0) {
    const fastest = turnaroundBids.reduce((min, b) =>
      b.turnaroundDays! < min.turnaroundDays! ? b : min
    );
    fastestTurnaround = { vendor: fastest.vendorName, days: fastest.turnaroundDays! };
  }

  // Find highest quality
  const qualityBids = bids.filter((b) => b.qualityScore !== undefined);
  let highestQuality: { vendor: string; score: number } | undefined;
  if (qualityBids.length > 0) {
    const highest = qualityBids.reduce((max, b) =>
      b.qualityScore! > max.qualityScore! ? b : max
    );
    highestQuality = { vendor: highest.vendorName, score: highest.qualityScore! };
  }

  // Rank bids
  const amountRanks = rankBy(bids, (b) => b.bidAmount, 'asc');
  const turnaroundRanks = rankBy(bids, (b) => b.turnaroundDays || 999, 'asc');
  const qualityRanks = rankBy(bids, (b) => b.qualityScore || 0, 'desc');

  // Calculate overall scores
  const analysis: BidAnalysis[] = bids.map((bid, i) => {
    // Normalize scores (0-1 scale)
    const priceScore = 1 - (bid.bidAmount - lowestAmount) / (highestAmount - lowestAmount || 1);

    let turnaroundScore = 0.5;
    if (turnaroundBids.length > 0 && bid.turnaroundDays !== undefined) {
      const minDays = Math.min(...turnaroundBids.map((b) => b.turnaroundDays!));
      const maxDays = Math.max(...turnaroundBids.map((b) => b.turnaroundDays!));
      turnaroundScore = 1 - (bid.turnaroundDays - minDays) / (maxDays - minDays || 1);
    }

    let qualityScore = 0.5;
    if (qualityBids.length > 0 && bid.qualityScore !== undefined) {
      const minQuality = Math.min(...qualityBids.map((b) => b.qualityScore!));
      const maxQuality = Math.max(...qualityBids.map((b) => b.qualityScore!));
      qualityScore = (bid.qualityScore - minQuality) / (maxQuality - minQuality || 1);
    }

    const overallScore =
      priceScore * weightings.price +
      turnaroundScore * weightings.turnaround +
      qualityScore * weightings.quality;

    // Generate pros/cons
    const pros: string[] = [];
    const cons: string[] = [];

    if (bid.bidAmount === lowestAmount) pros.push('Lowest price');
    if (bid.bidAmount === highestAmount) cons.push('Highest price');
    if (bid.turnaroundDays === fastestTurnaround?.days) pros.push('Fastest turnaround');
    if (bid.qualityScore === highestQuality?.score) pros.push('Highest quality');

    return {
      vendor: bid.vendorName,
      amount: bid.bidAmount,
      amountRank: amountRanks[i],
      turnaroundDays: bid.turnaroundDays,
      turnaroundRank: bid.turnaroundDays !== undefined ? turnaroundRanks[i] : undefined,
      qualityScore: bid.qualityScore,
      qualityRank: bid.qualityScore !== undefined ? qualityRanks[i] : undefined,
      overallScore,
      overallRank: 0, // Will be set below
      pros,
      cons,
    };
  });

  // Rank overall scores
  const overallRanks = rankBy(analysis, (a) => a.overallScore, 'desc');
  analysis.forEach((a, i) => {
    a.overallRank = overallRanks[i];
  });

  // Sort by overall rank
  analysis.sort((a, b) => a.overallRank - b.overallRank);

  // Build comparison table
  const headers = ['Vendor', 'Amount', 'Turnaround', 'Quality', 'Overall Rank'];
  const rows = analysis.map((a) => [
    a.vendor,
    `${params.currencySymbol}${a.amount.toLocaleString()}`,
    a.turnaroundDays !== undefined ? `${a.turnaroundDays} days` : 'N/A',
    a.qualityScore !== undefined ? `${a.qualityScore}/10` : 'N/A',
    `#${a.overallRank}`,
  ]);

  // Generate recommendation
  let recommendation: BidComparisonResult['recommendation'];
  if (params.includeRecommendation && analysis.length >= 2) {
    const recommended = analysis[0];
    const alternative = analysis[1];

    recommendation = {
      recommended: recommended.vendor,
      reason: generateRecommendationReason(recommended),
      alternativeChoice: alternative.vendor,
      alternativeReason: generateRecommendationReason(alternative),
    };
  }

  return {
    summary: {
      totalBids: bids.length,
      lowestBid: { vendor: lowestBid.vendorName, amount: lowestBid.bidAmount },
      highestBid: { vendor: highestBid.vendorName, amount: highestBid.bidAmount },
      averageBid: Math.round(averageBid * 100) / 100,
      fastestTurnaround,
      highestQuality,
    },
    analysis,
    comparisonTable: { headers, rows },
    recommendation,
  };
}

/**
 * Rank items by a value
 */
function rankBy<T>(
  items: T[],
  getValue: (item: T) => number,
  order: 'asc' | 'desc'
): number[] {
  const indexed = items.map((item, i) => ({ value: getValue(item), index: i }));
  indexed.sort((a, b) => (order === 'asc' ? a.value - b.value : b.value - a.value));

  const ranks = new Array(items.length);
  indexed.forEach((item, rank) => {
    ranks[item.index] = rank + 1;
  });

  return ranks;
}

/**
 * Generate recommendation reason
 */
function generateRecommendationReason(analysis: BidAnalysis): string {
  const reasons: string[] = [];

  if (analysis.amountRank === 1) reasons.push('best price');
  if (analysis.turnaroundRank === 1) reasons.push('fastest delivery');
  if (analysis.qualityRank === 1) reasons.push('highest quality');

  if (reasons.length > 0) {
    return `Offers ${reasons.join(', ')}`;
  }

  return `Best overall value (ranked #${analysis.overallRank})`;
}
