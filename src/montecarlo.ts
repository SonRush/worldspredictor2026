import type { Overrides, Team, TournamentFile } from './types.ts';
import { mulberry32 } from './rng.ts';
import type { Ratings } from './simulator.ts';
import { resolveTournament } from './tournament.ts';

export interface TeamOdds {
  team: string;
  /** Reached the Swiss Stage (100% for direct seeds). */
  swiss: number;
  /** Qualified for the Knockout Stage (= Playoffs). */
  playoffs: number;
  semis: number;
  final: number;
  champion: number;
  /** Probability of each final Swiss record, e.g. {"3-0": 0.12}. */
  records: Record<string, number>;
}

export interface MonteCarloResult {
  iterations: number;
  seed: number;
  odds: Record<string, TeamOdds>;
  elapsedMs: number;
  usedOverrides: boolean;
}

export interface MonteCarloInput {
  teams: Team[];
  tournament: TournamentFile;
  ratings: Ratings;
  iterations: number;
  seed?: number;
  /** User what-ifs to respect during simulation (optional). */
  overrides?: Overrides;
}

/** Simulates the remainder of the event N times from the current real state. */
export function runMonteCarlo(input: MonteCarloInput): MonteCarloResult {
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const seed = input.seed ?? Math.floor(Math.random() * 2 ** 31);
  const rng = mulberry32(seed);
  const n = Math.max(1, Math.floor(input.iterations));
  const odds: Record<string, TeamOdds> = {};
  for (const t of input.teams) {
    odds[t.id] = { team: t.id, swiss: 0, playoffs: 0, semis: 0, final: 0, champion: 0, records: {} };
  }
  for (let i = 0; i < n; i++) {
    const r = resolveTournament(input.teams, input.tournament, {
      ratings: input.ratings,
      overrides: input.overrides,
      mode: 'random',
      rng,
    });
    for (const id of r.swissTeams) {
      const o = odds[id];
      if (!o) continue;
      o.swiss++;
      const rec = r.swissRecords[id];
      if (rec && (rec.wins === 3 || rec.losses === 3)) {
        const key = `${rec.wins}-${rec.losses}`;
        o.records[key] = (o.records[key] ?? 0) + 1;
      }
      if (rec?.wins === 3) o.playoffs++;
    }
    for (const m of r.knockout) {
      if (!m.winner) continue;
      if (m.id.startsWith('QF')) odds[m.winner].semis++;
      if (m.id.startsWith('SF')) odds[m.winner].final++;
      if (m.id === 'F') odds[m.winner].champion++;
    }
  }
  for (const o of Object.values(odds)) {
    o.swiss /= n;
    o.playoffs /= n;
    o.semis /= n;
    o.final /= n;
    o.champion /= n;
    for (const k of Object.keys(o.records)) o.records[k] /= n;
  }
  const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  return {
    iterations: n,
    seed,
    odds,
    elapsedMs: t1 - t0,
    usedOverrides: !!input.overrides && Object.keys(input.overrides).length > 0,
  };
}
