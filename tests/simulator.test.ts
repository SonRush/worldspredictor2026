import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import type { Match, TeamsFile, TournamentFile } from '../src/types.ts';
import {
  analyzeMatchup,
  computeRatings,
  mapWinProb,
  mostLikelyScore,
  seriesDistribution,
  seriesWinProb,
  simulateSeries,
} from '../src/simulator.ts';
import { mulberry32 } from '../src/rng.ts';
import { drawQuarterfinals, pairPool, resolveTournament, swissBestOf } from '../src/tournament.ts';
import { runMonteCarlo } from '../src/montecarlo.ts';

const teamsFile: TeamsFile = JSON.parse(fs.readFileSync('public/data/teams.json', 'utf8'));
const tournament: TournamentFile = JSON.parse(fs.readFileSync('public/data/tournament.json', 'utf8'));
const teams = teamsFile.teams;
const ratings = computeRatings(teams, []);
const byId = new Map(teams.map((t) => [t.id, t]));

describe('map & series probabilities', () => {
  it('follows the Elo logistic formula', () => {
    expect(mapWinProb(1500, 1500)).toBeCloseTo(0.5, 10);
    expect(mapWinProb(1900, 1500)).toBeCloseTo(10 / 11, 6);
    expect(mapWinProb(1500, 1600) + mapWinProb(1600, 1500)).toBeCloseTo(1, 10);
  });

  it('scoreline distributions sum to 1 and match the cumulative binomial', () => {
    for (const p of [0.1, 0.35, 0.5, 0.62, 0.9]) {
      for (const bo of [1, 3, 5] as const) {
        const dist = seriesDistribution(p, bo);
        expect(dist.reduce((s, x) => s + x.prob, 0)).toBeCloseTo(1, 10);
        const aWins = dist.filter((x) => x.scoreA > x.scoreB).reduce((s, x) => s + x.prob, 0);
        expect(aWins).toBeCloseTo(seriesWinProb(p, bo), 10);
      }
    }
  });

  it('longer series amplify the favourite', () => {
    const p = 0.6;
    expect(seriesWinProb(p, 1)).toBeCloseTo(0.6, 10);
    expect(seriesWinProb(p, 3)).toBeGreaterThan(0.6);
    expect(seriesWinProb(p, 5)).toBeGreaterThan(seriesWinProb(p, 3));
    expect(seriesWinProb(0.5, 5)).toBeCloseTo(0.5, 10);
  });

  it('reports a sensible most likely score', () => {
    expect(mostLikelyScore(0.9, 5)).toMatchObject({ scoreA: 3, scoreB: 0 });
    expect(mostLikelyScore(0.1, 3)).toMatchObject({ scoreA: 0, scoreB: 2 });
  });

  it('simulated series converge to the analytic probability', () => {
    const rng = mulberry32(7);
    let wins = 0;
    const n = 20000;
    for (let i = 0; i < n; i++) if (simulateSeries(0.58, 5, rng).scoreA === 3) wins++;
    expect(wins / n).toBeCloseTo(seriesWinProb(0.58, 5), 1);
  });

  it('analyzeMatchup exposes factors that explain the rating gap', () => {
    const a = analyzeMatchup(ratings, 'GEN', 'FUR', 5);
    expect(a.pSeries).toBeGreaterThan(0.9);
    const sum = a.factors.reduce((s, f) => s + f.value, 0);
    expect(sum).toBeCloseTo(ratings.GEN.effective - ratings.FUR.effective, 6);
  });
});

describe('ratings', () => {
  it('updates Elo symmetrically from official results', () => {
    const m: Match = {
      id: 'X', stage: 'PLAY_IN', round: 1, teamA: 'FUR', teamB: 'MVK', bestOf: 5,
      status: 'FINISHED', scoreA: 3, scoreB: 1, winner: 'FUR', startTime: '2026-10-15T20:00:00Z',
    };
    const r = computeRatings(teams, [m]);
    expect(r.FUR.elo).toBeGreaterThan(r.FUR.base);
    expect(r.FUR.elo - r.FUR.base).toBeCloseTo(r.MVK.base - r.MVK.elo, 8);
    expect(r.FUR.form).toHaveLength(4);
    expect(r.FUR.form.at(-1)).toBe('W');
    expect(r.FUR.seriesWon).toBe(1);
  });
});

describe('Swiss format', () => {
  it('uses Bo3 only for qualification/elimination matches', () => {
    expect(swissBestOf({ wins: 0, losses: 0 })).toBe(1);
    expect(swissBestOf({ wins: 1, losses: 1 })).toBe(1);
    expect(swissBestOf({ wins: 2, losses: 0 })).toBe(3);
    expect(swissBestOf({ wins: 0, losses: 2 })).toBe(3);
    expect(swissBestOf({ wins: 2, losses: 2 })).toBe(3);
  });

  it('pairPool avoids rematches whenever possible', () => {
    const rng = mulberry32(1);
    const pool = ['A', 'B', 'C', 'D'];
    const played = new Set(['A|B', 'C|D']);
    for (let i = 0; i < 50; i++) {
      const pairs = pairPool(pool, rng, (a, b) => (played.has([a, b].sort().join('|')) ? 2 : 0));
      for (const [a, b] of pairs) expect(played.has([a, b].sort().join('|'))).toBe(false);
    }
  });

  it('every simulated event is structurally valid (1000 runs)', () => {
    const rng = mulberry32(2026);
    for (let i = 0; i < 1000; i++) {
      const r = resolveTournament(teams, tournament, { ratings, mode: 'random', rng });
      expect(r.playInQualifier).toBeTruthy();
      expect(r.swissTeams).toHaveLength(16);
      const recs = Object.values(r.swissRecords);
      expect(recs.filter((x) => x.wins === 3)).toHaveLength(8);
      expect(recs.filter((x) => x.losses === 3)).toHaveLength(8);
      const records = recs.map((x) => `${x.wins}-${x.losses}`);
      expect(records.filter((x) => x === '3-0')).toHaveLength(2);
      expect(records.filter((x) => x === '3-1')).toHaveLength(3);
      expect(records.filter((x) => x === '3-2')).toHaveLength(3);
      // No rematches inside the Swiss stage.
      for (const rec of recs) expect(new Set(rec.opponents).size).toBe(rec.opponents.length);
      // Round 1: tier 1 vs 4, tier 2 vs 3.
      for (const m of r.swissRounds[0].matches) {
        const tier = (id: string) => (id === r.playInQualifier ? 4 : byId.get(id)!.swissTier!);
        expect(tier(m.teamA!) + tier(m.teamB!)).toBe(5);
      }
      // Bo3 exactly for 2-win / 2-loss pools.
      for (const round of r.swissRounds) {
        for (const m of round.matches) {
          const [w, l] = m.pool!.split('-').map(Number);
          expect(m.bestOf).toBe(w === 2 || l === 2 ? 3 : 1);
        }
      }
      // Knockout: 3-0 teams in QF1/QF3 facing 3-2 teams.
      const rec = (id: string) => r.swissRecords[id];
      for (const id of ['QF1', 'QF3']) {
        const m = r.knockout.find((x) => x.id === id)!;
        expect(rec(m.teamA!).losses).toBe(0);
        expect(rec(m.teamB!).losses).toBe(2);
      }
      expect(r.knockout.every((m) => m.bestOf === 5 && m.winner)).toBe(true);
      expect(r.champion).toBeTruthy();
    }
  });

  it('respects official results and user overrides', () => {
    const t: TournamentFile = structuredClone(tournament);
    Object.assign(t.playIn.matches[0], { status: 'FINISHED', scoreA: 1, scoreB: 3, winner: 'MVK' });
    const r = resolveTournament(teams, t, {
      ratings, mode: 'favorite', rng: mulberry32(1), overrides: { 'PI-B': { winner: 'C9' } },
    });
    const c = r.playIn.find((m) => m.id === 'PI-C')!;
    expect([c.teamA, c.teamB]).toEqual(['MVK', 'C9']);
    expect(r.playIn[0].source).toBe('official');
    expect(r.playIn[1].source).toBe('manual');
    expect(r.playIn.find((m) => m.id === 'PI-D')).toMatchObject({ teamA: 'FUR', teamB: 'KC' });
  });

  it("mode 'none' only shows known data", () => {
    const r = resolveTournament(teams, tournament, { ratings, mode: 'none', rng: mulberry32(1) });
    expect(r.playInQualifier).toBeNull();
    expect(r.swissRounds.every((x) => x.matches.length === 0)).toBe(true);
    expect(r.knockout.every((m) => !m.teamA)).toBe(true);
  });

  it('quarterfinal draw keeps 3-0 teams on opposite halves', () => {
    const rng = mulberry32(5);
    const qf = drawQuarterfinals(
      { '3-0': ['GEN', 'BLG'], '3-1': ['T1', 'AL', 'G2'], '3-2': ['HLE', 'TES', 'TL'] },
      byId,
      rng,
    );
    expect(qf).toHaveLength(4);
    expect(new Set([qf[0][0], qf[2][0]])).toEqual(new Set(['GEN', 'BLG']));
    expect(new Set(qf.flat()).size).toBe(8);
  });
});

describe('Monte Carlo', () => {
  it('aggregates coherent probabilities', () => {
    const res = runMonteCarlo({ teams, tournament, ratings, iterations: 1000, seed: 42 });
    const odds = Object.values(res.odds);
    const sum = (k: 'champion' | 'final' | 'semis' | 'playoffs' | 'swiss') => odds.reduce((s, o) => s + o[k], 0);
    expect(sum('champion')).toBeCloseTo(1, 10);
    expect(sum('final')).toBeCloseTo(2, 10);
    expect(sum('semis')).toBeCloseTo(4, 10);
    expect(sum('playoffs')).toBeCloseTo(8, 10);
    expect(sum('swiss')).toBeCloseTo(16, 10);
    for (const o of odds) {
      expect(o.champion).toBeLessThanOrEqual(o.final);
      expect(o.final).toBeLessThanOrEqual(o.semis);
      expect(o.semis).toBeLessThanOrEqual(o.playoffs);
      expect(o.playoffs).toBeLessThanOrEqual(o.swiss);
    }
    expect(res.odds.GEN.champion).toBeGreaterThan(res.odds.FUR.champion);
    // Exactly one of the four Play-In teams reaches Swiss each run.
    const pi = ['FUR', 'MVK', 'C9', 'KC'].reduce((s, id) => s + res.odds[id].swiss, 0);
    expect(pi).toBeCloseTo(1, 10);
  });

  it('is reproducible with a seed', () => {
    const a = runMonteCarlo({ teams, tournament, ratings, iterations: 200, seed: 9 });
    const b = runMonteCarlo({ teams, tournament, ratings, iterations: 200, seed: 9 });
    expect(a.odds).toEqual(b.odds);
  });
});
