/**
 * Worlds 2026 format engine: Play-In (double-elimination, Bo5), Swiss Stage
 * (16 teams, 3W advance / 3L out, Bo1 except qualification/elimination Bo3,
 * no rematches) and Knockout (8 teams, Bo5, 3-0 seeds face 3-2 teams).
 *
 * `resolveTournament` merges official data + user overrides and, depending on
 * `mode`, fills the undecided remainder with favourites or random outcomes.
 */
import type {
  BestOf,
  Match,
  Overrides,
  ResolvedMatch,
  ResolvedTournament,
  SwissRecord,
  Team,
  TournamentFile,
} from './types.ts';
import { shuffle, type Rng } from './rng.ts';
import { mostLikelyScoreFor, pMap, simulateSeries, type Ratings } from './simulator.ts';

export type FillMode = 'none' | 'favorite' | 'random';

export interface ResolveOptions {
  ratings: Ratings;
  overrides?: Overrides;
  mode: FillMode;
  rng: Rng;
}

type Feed = [matchId: string, take: 'winner' | 'loser'];
/** Play-In double-elimination bracket wiring (single qualifier). */
export const PLAY_IN_FEEDS: Record<string, { A: Feed; B: Feed }> = {
  'PI-C': { A: ['PI-A', 'winner'], B: ['PI-B', 'winner'] },
  'PI-D': { A: ['PI-A', 'loser'], B: ['PI-B', 'loser'] },
  'PI-E': { A: ['PI-C', 'loser'], B: ['PI-D', 'winner'] },
  'PI-F': { A: ['PI-C', 'winner'], B: ['PI-E', 'winner'] },
};
export const PLAY_IN_FINAL = 'PI-F';

export const KNOCKOUT_FEEDS: Record<string, { A: string; B: string }> = {
  SF1: { A: 'QF1', B: 'QF2' },
  SF2: { A: 'QF3', B: 'QF4' },
  F: { A: 'SF1', B: 'SF2' },
};

export const SWISS_WINS = 3;
export const SWISS_LOSSES = 3;

export function poolLabel(r: Pick<SwissRecord, 'wins' | 'losses'>): string {
  return `${r.wins}-${r.losses}`;
}

/** Qualification (2 wins) and elimination (2 losses) matches are Bo3, the rest Bo1. */
export function swissBestOf(r: Pick<SwissRecord, 'wins' | 'losses'>): BestOf {
  return r.wins === SWISS_WINS - 1 || r.losses === SWISS_LOSSES - 1 ? 3 : 1;
}

export function swissMatchId(round: number, a: string, b: string): string {
  const [x, y] = [a, b].sort();
  return `SW-R${round}-${x}-${y}`;
}

function toResolved(m: Match): ResolvedMatch {
  return { ...m, source: m.status === 'FINISHED' && m.winner ? 'official' : null, projectedPairing: false };
}

export function loserOf(m: Match): string | null {
  if (!m.winner) return null;
  return m.winner === m.teamA ? m.teamB : m.teamA;
}

/** Decides a match in place according to official data > override > fill mode. */
export function decideMatch(m: ResolvedMatch, opts: ResolveOptions): void {
  if (!m.teamA || !m.teamB) return;
  if (m.status === 'FINISHED' && m.winner) {
    m.source = 'official';
    return;
  }
  const w = Math.ceil(m.bestOf / 2);
  const p = pMap(opts.ratings, m.teamA, m.teamB);
  const o = opts.overrides?.[m.id];
  if (o && (o.winner === m.teamA || o.winner === m.teamB)) {
    const aWins = o.winner === m.teamA;
    const valid =
      o.scoreA != null && o.scoreB != null && (aWins ? o.scoreA === w && o.scoreB < w : o.scoreB === w && o.scoreA < w);
    const s = valid ? { scoreA: o.scoreA!, scoreB: o.scoreB! } : mostLikelyScoreFor(p, m.bestOf, aWins);
    m.scoreA = s.scoreA;
    m.scoreB = s.scoreB;
    m.winner = o.winner;
    m.source = 'manual';
    return;
  }
  if (opts.mode === 'none') return;
  let s: { scoreA: number; scoreB: number };
  if (opts.mode === 'favorite') {
    s = mostLikelyScoreFor(p, m.bestOf, p >= 0.5);
  } else {
    // Live series continue from their current score.
    s = m.status === 'IN_PROGRESS'
      ? simulateSeries(p, m.bestOf, opts.rng, m.scoreA, m.scoreB)
      : simulateSeries(p, m.bestOf, opts.rng);
  }
  m.scoreA = s.scoreA;
  m.scoreB = s.scoreB;
  m.winner = s.scoreA > s.scoreB ? m.teamA : m.teamB;
  m.source = 'projected';
}

// ---------------------------------------------------------------- Play-In

export function resolvePlayIn(t: TournamentFile, opts: ResolveOptions) {
  const byId = new Map<string, ResolvedMatch>();
  const out: ResolvedMatch[] = [];
  for (const raw of t.playIn.matches) {
    const m = toResolved(raw);
    const feed = PLAY_IN_FEEDS[m.id];
    if (feed) {
      const pick = ([id, take]: Feed) => {
        const src = byId.get(id);
        if (!src) return null;
        return take === 'winner' ? src.winner : loserOf(src);
      };
      m.teamA ??= pick(feed.A);
      m.teamB ??= pick(feed.B);
    }
    decideMatch(m, opts);
    byId.set(m.id, m);
    out.push(m);
  }
  return { matches: out, qualifier: byId.get(PLAY_IN_FINAL)?.winner ?? null };
}

// ---------------------------------------------------------------- Swiss

/**
 * Random pairing of `pool` with no rematches (backtracking). `avoid(a, b)`
 * returns a penalty: 2 = forbidden rematch, 1 = soft constraint (same region in
 * round 1). Falls back to allowing soft, then hard violations if unavoidable.
 */
export function pairPool(
  pool: string[],
  rng: Rng,
  forbidden: (a: string, b: string) => number,
): [string, string][] {
  for (const tolerance of [0, 1, 2]) {
    for (let attempt = 0; attempt < 20; attempt++) {
      const result = backtrack(shuffle(pool, rng), forbidden, tolerance);
      if (result) return result;
    }
  }
  // Unreachable for even pools; keep a deterministic fallback.
  const s = pool.slice();
  const pairs: [string, string][] = [];
  while (s.length >= 2) pairs.push([s.shift()!, s.shift()!]);
  return pairs;
}

function backtrack(
  rest: string[],
  cost: (a: string, b: string) => number,
  tolerance: number,
): [string, string][] | null {
  if (rest.length === 0) return [];
  if (rest.length === 1) return null;
  const [first, ...others] = rest;
  for (let i = 0; i < others.length; i++) {
    if (cost(first, others[i]) > tolerance) continue;
    const remaining = others.slice(0, i).concat(others.slice(i + 1));
    const sub = backtrack(remaining, cost, tolerance);
    if (sub) return [[first, others[i]], ...sub];
  }
  return null;
}

/** Round 1 draw: Tier 1 vs Tier 4, Tier 2 vs Tier 3, avoiding same-region pairs. */
export function drawRoundOne(
  swissTeams: string[],
  teamsById: Map<string, Team>,
  rng: Rng,
  qualifier: string | null,
): [string, string][] {
  const tierOf = (id: string) => (id === qualifier ? 4 : teamsById.get(id)?.swissTier ?? 4);
  const region = (id: string) => teamsById.get(id)?.region;
  const pairs: [string, string][] = [];
  for (const [hi, lo] of [
    [1, 4],
    [2, 3],
  ]) {
    const H = shuffle(swissTeams.filter((t) => tierOf(t) === hi), rng);
    const L = swissTeams.filter((t) => tierOf(t) === lo);
    let best: string[] | null = null;
    for (let attempt = 0; attempt < 60 && !best; attempt++) {
      const perm = shuffle(L, rng);
      if (perm.length === H.length && H.every((h, i) => region(h) !== region(perm[i]))) best = perm;
    }
    best ??= shuffle(L, rng);
    H.forEach((h, i) => best![i] && pairs.push([h, best![i]]));
  }
  return pairs;
}

function emptyRecord(team: string): SwissRecord {
  return { team, wins: 0, losses: 0, opponents: [], finishedRound: null };
}

export function resolveSwiss(
  t: TournamentFile,
  teams: Team[],
  qualifier: string | null,
  opts: ResolveOptions,
) {
  const teamsById = new Map(teams.map((x) => [x.id, x]));
  const direct = teams.filter((x) => x.stageEntry === 'SWISS').map((x) => x.id);
  // Teams appearing in official Swiss matches count too (e.g. qualifier known only upstream).
  const officialSwiss = t.swiss.rounds.flatMap((r) => r.matches.flatMap((m) => [m.teamA, m.teamB]));
  const swissTeams = Array.from(
    new Set([...direct, ...(qualifier ? [qualifier] : []), ...(officialSwiss.filter(Boolean) as string[])]),
  );
  const records: Record<string, SwissRecord> = Object.fromEntries(swissTeams.map((id) => [id, emptyRecord(id)]));
  const rounds: { round: number; matches: ResolvedMatch[] }[] = [];
  let blocked = false;

  for (let round = 1; round <= 5; round++) {
    const official = t.swiss.rounds.find((r) => r.round === round)?.matches ?? [];
    const matches: ResolvedMatch[] = official.map((raw) => {
      const m = toResolved(raw);
      if (m.teamA && records[m.teamA]) m.pool = poolLabel(records[m.teamA]);
      return m;
    });
    const scheduled = new Set(matches.flatMap((m) => [m.teamA, m.teamB]));
    const active = swissTeams.filter(
      (id) => records[id].wins < SWISS_WINS && records[id].losses < SWISS_LOSSES && !scheduled.has(id),
    );

    const canProject = !blocked && opts.mode !== 'none' && swissTeams.length === 16;
    if (active.length > 0 && canProject) {
      let pairs: [string, string][] = [];
      if (round === 1) {
        pairs = drawRoundOne(active, teamsById, opts.rng, qualifier);
      } else {
        const pools = new Map<string, string[]>();
        for (const id of active) {
          const key = poolLabel(records[id]);
          pools.set(key, [...(pools.get(key) ?? []), id]);
        }
        for (const pool of pools.values()) {
          pairs.push(
            ...pairPool(pool, opts.rng, (a, b) => (records[a].opponents.includes(b) ? 2 : 0)),
          );
        }
      }
      for (const [a, b] of pairs) {
        const rec = records[a];
        matches.push({
          id: swissMatchId(round, a, b),
          stage: 'SWISS',
          round,
          label: null,
          teamA: a,
          teamB: b,
          bestOf: swissBestOf(rec),
          status: 'SCHEDULED',
          scoreA: 0,
          scoreB: 0,
          winner: null,
          startTime: null,
          externalId: null,
          source: null,
          pool: poolLabel(rec),
          projectedPairing: true,
        });
      }
    }

    for (const m of matches) decideMatch(m, opts);
    for (const m of matches) {
      if (!m.winner || !m.teamA || !m.teamB) {
        blocked = true;
        continue;
      }
      const ra = (records[m.teamA] ??= emptyRecord(m.teamA));
      const rb = (records[m.teamB] ??= emptyRecord(m.teamB));
      ra.opponents.push(m.teamB);
      rb.opponents.push(m.teamA);
      const [w, l] = m.winner === m.teamA ? [ra, rb] : [rb, ra];
      w.wins++;
      l.losses++;
      if (w.wins === SWISS_WINS) w.finishedRound = round;
      if (l.losses === SWISS_LOSSES) l.finishedRound = round;
    }
    if (active.length > 0 && !canProject) blocked = true;
    rounds.push({ round, matches });
  }
  return { swissTeams, rounds, records };
}

// ---------------------------------------------------------------- Knockout

export function swissQualifiers(records: Record<string, SwissRecord>) {
  const q = Object.values(records).filter((r) => r.wins === SWISS_WINS);
  return {
    complete: q.length === 8 && Object.values(records).every((r) => r.wins === 3 || r.losses === 3),
    byRecord: {
      '3-0': q.filter((r) => r.losses === 0).map((r) => r.team),
      '3-1': q.filter((r) => r.losses === 1).map((r) => r.team),
      '3-2': q.filter((r) => r.losses === 2).map((r) => r.team),
    },
  };
}

/**
 * Quarterfinal draw: both 3-0 teams go to opposite halves (QF1, QF3) and face
 * a 3-2 team; the remaining teams are drawn randomly into QF2 / QF4.
 * Same-region quarterfinals are avoided when possible.
 */
export function drawQuarterfinals(
  byRecord: Record<'3-0' | '3-1' | '3-2', string[]>,
  teamsById: Map<string, Team>,
  rng: Rng,
): [string, string][] {
  const region = (id: string) => teamsById.get(id)?.region;
  let fallback: [string, string][] | null = null;
  for (let attempt = 0; attempt < 80; attempt++) {
    const zeros = shuffle(byRecord['3-0'], rng);
    const twos = shuffle(byRecord['3-2'], rng);
    const ones = byRecord['3-1'];
    const top: string[] = [];
    const opponents: string[] = [];
    for (const z of zeros) {
      top.push(z);
      opponents.push(twos.shift() ?? '');
    }
    const rest = shuffle([...ones, ...twos], rng);
    const qf: [string, string][] = [];
    // Bracket order: QF1 (3-0 #1), QF2, QF3 (3-0 #2), QF4.
    const slots = [
      [top[0], opponents[0]],
      [rest[0], rest[1]],
      [top[1], opponents[1]],
      [rest[2], rest[3]],
    ];
    for (const [a, b] of slots) {
      if (a && b) qf.push([a, b]);
    }
    if (qf.length !== 4) {
      // Non-standard distribution (shouldn't happen): plain random bracket.
      const all = shuffle([...byRecord['3-0'], ...byRecord['3-1'], ...byRecord['3-2']], rng);
      return [0, 2, 4, 6].map((i) => [all[i], all[i + 1]] as [string, string]);
    }
    fallback ??= qf;
    if (qf.every(([a, b]) => region(a) !== region(b))) return qf;
  }
  return fallback!;
}

export function resolveKnockout(
  t: TournamentFile,
  teams: Team[],
  records: Record<string, SwissRecord>,
  opts: ResolveOptions,
) {
  const teamsById = new Map(teams.map((x) => [x.id, x]));
  const { complete, byRecord } = swissQualifiers(records);
  const byId = new Map<string, ResolvedMatch>();
  const matches = t.knockout.matches.map(toResolved);
  const qfs = matches.filter((m) => m.id.startsWith('QF'));
  const needsDraw = qfs.some((m) => !m.teamA || !m.teamB);
  if (needsDraw && complete && opts.mode !== 'none') {
    const draw = drawQuarterfinals(byRecord, teamsById, opts.rng);
    const used = new Set(qfs.flatMap((m) => [m.teamA, m.teamB]).filter(Boolean));
    let i = 0;
    for (const m of qfs) {
      if (m.teamA && m.teamB) continue;
      while (i < draw.length && (used.has(draw[i][0]) || used.has(draw[i][1]))) i++;
      if (i >= draw.length) break;
      [m.teamA, m.teamB] = draw[i++];
      m.projectedPairing = true;
    }
  }
  for (const m of matches) {
    const feed = KNOCKOUT_FEEDS[m.id];
    if (feed) {
      if (!m.teamA) {
        m.teamA = byId.get(feed.A)?.winner ?? null;
        m.projectedPairing ||= byId.get(feed.A)?.source !== 'official';
      }
      if (!m.teamB) {
        m.teamB = byId.get(feed.B)?.winner ?? null;
        m.projectedPairing ||= byId.get(feed.B)?.source !== 'official';
      }
    }
    decideMatch(m, opts);
    byId.set(m.id, m);
  }
  return { matches, champion: byId.get('F')?.winner ?? null };
}

// ---------------------------------------------------------------- Whole event

export function resolveTournament(
  teams: Team[],
  t: TournamentFile,
  opts: ResolveOptions,
): ResolvedTournament {
  const pi = resolvePlayIn(t, opts);
  // If upstream already placed the qualifier in Swiss, trust that.
  const directIds = new Set(teams.filter((x) => x.stageEntry === 'SWISS').map((x) => x.id));
  const upstreamQualifier =
    t.swiss.rounds
      .flatMap((r) => r.matches.flatMap((m) => [m.teamA, m.teamB]))
      .find((id) => id && !directIds.has(id)) ?? null;
  const qualifier = upstreamQualifier ?? pi.qualifier;
  const sw = resolveSwiss(t, teams, qualifier, opts);
  const ko = resolveKnockout(t, teams, sw.records, opts);
  return {
    playIn: pi.matches,
    playInQualifier: qualifier,
    swissTeams: sw.swissTeams,
    swissRounds: sw.rounds,
    swissRecords: sw.records,
    knockout: ko.matches,
    champion: ko.champion,
  };
}

/** All official matches with results (for Elo/form computation). */
export function officialMatches(t: TournamentFile): Match[] {
  return [...t.playIn.matches, ...t.swiss.rounds.flatMap((r) => r.matches), ...t.knockout.matches];
}
