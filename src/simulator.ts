/**
 * Probability & rating engine. Pure functions, no DOM: shared by the UI,
 * the Monte Carlo worker, the unit tests and the Node sync script.
 */
import type { BestOf, Match, Region, Team } from './types.ts';
import type { Rng } from './rng.ts';

/** International strength adjustment added on top of each team's Elo. */
export const REGION_WEIGHT: Record<Region, number> = {
  LCK: 15,
  LPL: 10,
  LEC: 0,
  LCS: -10,
  LTA: -10,
  LCP: -10,
  CBLOL: -20,
};

/** Elo points per net win over the last 5 Worlds maps (momentum). */
export const FORM_WEIGHT = 4;
/** K-factor for per-map Elo updates from official results. */
export const K_FACTOR = 24;

export interface RatingInfo {
  team: string;
  base: number;
  /** Elo after applying official Worlds 2026 map results. */
  elo: number;
  regionBonus: number;
  formBonus: number;
  /** Rating actually used for predictions. */
  effective: number;
  /** Last results (most recent last), one entry per map. */
  form: ('W' | 'L')[];
  mapsWon: number;
  mapsLost: number;
  seriesWon: number;
  seriesLost: number;
}
export type Ratings = Record<string, RatingInfo>;

/** P(A wins one map) = 1 / (1 + 10^((R_B − R_A) / 400)) */
export function mapWinProb(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

function binom(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return r;
}

export interface Scoreline {
  scoreA: number;
  scoreB: number;
  prob: number;
}

/**
 * Exact distribution of final scorelines for a best-of-N series where each map
 * is an independent Bernoulli(p). A wins w-k when it takes the last map after
 * going (w−1)-k: C(w−1+k, k) · p^w · (1−p)^k  (negative binomial).
 */
export function seriesDistribution(p: number, bestOf: BestOf): Scoreline[] {
  const w = Math.ceil(bestOf / 2);
  const out: Scoreline[] = [];
  for (let k = 0; k < w; k++) {
    out.push({ scoreA: w, scoreB: k, prob: binom(w - 1 + k, k) * p ** w * (1 - p) ** k });
  }
  for (let k = 0; k < w; k++) {
    out.push({ scoreA: k, scoreB: w, prob: binom(w - 1 + k, k) * (1 - p) ** w * p ** k });
  }
  return out;
}

/**
 * P(A wins the series) via the cumulative binomial: A wins a Bo(2w−1) iff it
 * wins at least w of 2w−1 maps if all were played.
 */
export function seriesWinProb(p: number, bestOf: BestOf): number {
  const n = bestOf;
  const w = Math.ceil(n / 2);
  let s = 0;
  for (let k = w; k <= n; k++) s += binom(n, k) * p ** k * (1 - p) ** (n - k);
  return s;
}

export function mostLikelyScore(p: number, bestOf: BestOf): Scoreline {
  return seriesDistribution(p, bestOf).reduce((a, b) => (b.prob > a.prob ? b : a));
}

/** Most likely scoreline conditioned on a given winner. */
export function mostLikelyScoreFor(p: number, bestOf: BestOf, aWins: boolean): Scoreline {
  return seriesDistribution(p, bestOf)
    .filter((s) => (aWins ? s.scoreA > s.scoreB : s.scoreB > s.scoreA))
    .reduce((a, b) => (b.prob > a.prob ? b : a));
}

/** Simulates a series map by map, optionally continuing from a live score. */
export function simulateSeries(
  p: number,
  bestOf: BestOf,
  rng: Rng,
  fromA = 0,
  fromB = 0,
): { scoreA: number; scoreB: number } {
  const w = Math.ceil(bestOf / 2);
  let a = fromA;
  let b = fromB;
  while (a < w && b < w) {
    if (rng() < p) a++;
    else b++;
  }
  return { scoreA: a, scoreB: b };
}

/** Elo update for a single map. */
export function eloUpdate(ra: number, rb: number, aWon: boolean, k = K_FACTOR): [number, number] {
  const e = mapWinProb(ra, rb);
  const delta = k * ((aWon ? 1 : 0) - e);
  return [ra + delta, rb - delta];
}

/**
 * Builds current ratings from base Elo + official finished results.
 * Each map is treated as an Elo game.
 */
export function computeRatings(teams: Team[], finished: Match[]): Ratings {
  const r: Ratings = {};
  for (const t of teams) {
    r[t.id] = {
      team: t.id,
      base: t.baseElo,
      elo: t.baseElo,
      regionBonus: REGION_WEIGHT[t.region] ?? 0,
      formBonus: 0,
      effective: t.baseElo,
      form: [],
      mapsWon: 0,
      mapsLost: 0,
      seriesWon: 0,
      seriesLost: 0,
    };
  }
  const ordered = finished
    .filter((m) => m.status === 'FINISHED' && m.teamA && m.teamB && r[m.teamA] && r[m.teamB])
    .slice()
    .sort((x, y) => (x.startTime ?? '').localeCompare(y.startTime ?? ''));
  for (const m of ordered) {
    const A = r[m.teamA!];
    const B = r[m.teamB!];
    const aWonSeries = m.winner === m.teamA;
    const winnerMaps = Math.max(1, aWonSeries ? m.scoreA : m.scoreB);
    let w = winnerMaps - 1;
    let l = aWonSeries ? m.scoreB : m.scoreA;
    // Map order isn't stored: alternate loser/winner maps, winner takes the last.
    const maps: boolean[] = [];
    while (w > 0 || l > 0) {
      if (l-- > 0) maps.push(!aWonSeries);
      if (w-- > 0) maps.push(aWonSeries);
    }
    maps.push(aWonSeries);
    for (const aWon of maps) {
      [A.elo, B.elo] = eloUpdate(A.elo, B.elo, aWon);
      A.form.push(aWon ? 'W' : 'L');
      B.form.push(aWon ? 'L' : 'W');
      if (aWon) {
        A.mapsWon++;
        B.mapsLost++;
      } else {
        B.mapsWon++;
        A.mapsLost++;
      }
    }
    if (aWonSeries) {
      A.seriesWon++;
      B.seriesLost++;
    } else {
      B.seriesWon++;
      A.seriesLost++;
    }
  }
  for (const info of Object.values(r)) {
    const last = info.form.slice(-5);
    const net = last.filter((x) => x === 'W').length - last.filter((x) => x === 'L').length;
    info.formBonus = net * FORM_WEIGHT;
    info.effective = info.elo + info.regionBonus + info.formBonus;
  }
  return r;
}

export function pMap(ratings: Ratings, a: string, b: string): number {
  return mapWinProb(ratings[a].effective, ratings[b].effective);
}

export interface Factor {
  label: string;
  /** Rating points in favour of team A (negative = favours B). */
  value: number;
}

export interface MatchupAnalysis {
  a: string;
  b: string;
  bestOf: BestOf;
  pMap: number;
  pSeries: number;
  distribution: Scoreline[];
  mostLikely: Scoreline;
  factors: Factor[];
}

export function analyzeMatchup(ratings: Ratings, a: string, b: string, bestOf: BestOf): MatchupAnalysis {
  const A = ratings[a];
  const B = ratings[b];
  const p = pMap(ratings, a, b);
  return {
    a,
    b,
    bestOf,
    pMap: p,
    pSeries: seriesWinProb(p, bestOf),
    distribution: seriesDistribution(p, bestOf),
    mostLikely: mostLikelyScore(p, bestOf),
    factors: [
      { label: 'Base Elo', value: A.base - B.base },
      { label: 'Worlds 2026 results', value: A.elo - A.base - (B.elo - B.base) },
      { label: 'Region strength', value: A.regionBonus - B.regionBonus },
      { label: 'Recent form', value: A.formBonus - B.formBonus },
    ],
  };
}
