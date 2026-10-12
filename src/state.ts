import type { Overrides, ResolvedTournament, Team, TeamsFile, TournamentFile } from './types.ts';
import { computeRatings, type Ratings } from './simulator.ts';
import { officialMatches, resolveTournament } from './tournament.ts';
import { mulberry32 } from './rng.ts';
import type { MonteCarloResult } from './montecarlo.ts';

const OVERRIDES_KEY = 'wp26:overrides';
const PREFS_KEY = 'wp26:prefs';
/** Fixed seed so projected draws stay stable between renders. */
export const PROJECTION_SEED = 2026;

export interface Prefs {
  showProjection: boolean;
  mcIterations: number;
  mcUseOverrides: boolean;
  h2h: { a: string; b: string; bestOf: 1 | 3 | 5 };
}

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}
function writeLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: keep in-memory state only */
  }
}

type Listener = () => void;

class Store {
  teamsFile!: TeamsFile;
  tournament!: TournamentFile;
  teams: Team[] = [];
  teamsById = new Map<string, Team>();
  ratings: Ratings = {};
  overrides: Overrides = readLocal<Overrides>(OVERRIDES_KEY, {});
  prefs: Prefs = readLocal<Prefs>(PREFS_KEY, {
    showProjection: true,
    mcIterations: 1000,
    mcUseOverrides: false,
    h2h: { a: 'GEN', b: 'BLG', bestOf: 5 },
  });
  mc: MonteCarloResult | null = null;
  mcRunning = false;
  private listeners: Listener[] = [];
  private cache = new Map<string, ResolvedTournament>();

  setData(teams: TeamsFile, tournament: TournamentFile) {
    this.teamsFile = teams;
    this.tournament = tournament;
    this.teams = teams.teams;
    this.teamsById = new Map(this.teams.map((t) => [t.id, t]));
    this.ratings = computeRatings(this.teams, officialMatches(tournament));
    this.cache.clear();
    this.emit();
  }

  /** Official + overrides, optionally completed with the favourites projection. */
  resolved(projection: boolean): ResolvedTournament {
    const key = projection ? 'favorite' : 'none';
    let r = this.cache.get(key);
    if (!r) {
      r = resolveTournament(this.teams, this.tournament, {
        ratings: this.ratings,
        overrides: this.overrides,
        mode: projection ? 'favorite' : 'none',
        rng: mulberry32(PROJECTION_SEED),
      });
      this.cache.set(key, r);
    }
    return r;
  }

  /** Toggles a user pick: same winner again clears it. */
  togglePick(matchId: string, winner: string) {
    if (this.overrides[matchId]?.winner === winner) delete this.overrides[matchId];
    else this.overrides[matchId] = { winner };
    writeLocal(OVERRIDES_KEY, this.overrides);
    this.cache.clear();
    this.emit();
  }

  /** Sets the exact scoreline of an existing pick (winner implied by the score). */
  setPickScore(matchId: string, winner: string, scoreA: number, scoreB: number) {
    this.overrides[matchId] = { winner, scoreA, scoreB };
    writeLocal(OVERRIDES_KEY, this.overrides);
    this.cache.clear();
    this.emit();
  }

  clearPicks(prefix?: string) {
    for (const id of Object.keys(this.overrides)) {
      if (!prefix || id.startsWith(prefix)) delete this.overrides[id];
    }
    writeLocal(OVERRIDES_KEY, this.overrides);
    this.cache.clear();
    this.emit();
  }

  setPrefs(patch: Partial<Prefs>) {
    this.prefs = { ...this.prefs, ...patch };
    writeLocal(PREFS_KEY, this.prefs);
    this.emit();
  }

  setMc(result: MonteCarloResult | null, running: boolean) {
    this.mc = result;
    this.mcRunning = running;
    this.emit();
  }

  subscribe(fn: Listener) {
    this.listeners.push(fn);
  }
  private emit() {
    for (const fn of this.listeners) fn();
  }
}

export const store = new Store();
