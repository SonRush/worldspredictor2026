// Incremental merge of upstream match data into tournament.json.
// Pure functions (no I/O) so they can be unit-tested with fixtures.
import { PLAY_IN_FEEDS, swissBestOf, swissMatchId } from '../../src/tournament.ts';

/**
 * @typedef {'SCHEDULED'|'IN_PROGRESS'|'FINISHED'} Status
 * @typedef {{
 *   source: string, stage: 'PLAY_IN'|'SWISS'|'KNOCKOUT', roundHint: string|null,
 *   teamA: string, teamB: string, scoreA: number|null, scoreB: number|null,
 *   winner: string|null, status: Status, bestOf: 1|3|5|null, startTime: string|null,
 *   externalId: string|null
 * }} UpstreamMatch
 */

const RANK = { SCHEDULED: 0, IN_PROGRESS: 1, FINISHED: 2 };

export function normalizeName(s) {
  return String(s ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/** Builds a resolver from upstream team names/codes to local team ids. */
export function teamResolver(teamsFile) {
  const map = new Map();
  for (const t of teamsFile.teams) {
    for (const k of [t.id, t.code, t.name, ...(t.aliases ?? [])]) map.set(normalizeName(k), t.id);
  }
  return (name) => map.get(normalizeName(name)) ?? null;
}

export function toIsoUtc(value) {
  if (!value) return null;
  // Leaguepedia: "2026-10-15 20:00:00" (UTC); LoL Esports: ISO 8601.
  const s = String(value).trim().replace(' ', 'T');
  const d = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : `${s}Z`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function samePair(m, a, b) {
  return (m.teamA === a && m.teamB === b) || (m.teamA === b && m.teamB === a);
}

function loserOf(m) {
  if (!m.winner) return null;
  return m.winner === m.teamA ? m.teamB : m.teamA;
}

/**
 * Applies an upstream record to a local match (oriented to the local A/B).
 * Returns a description of the change or null if nothing changed.
 */
export function applyUpstream(local, up) {
  const flip = local.teamA && local.teamA === up.teamB;
  const teamA = local.teamA ?? up.teamA;
  const teamB = local.teamB ?? up.teamB;
  const scoreA = flip ? up.scoreB : up.scoreA;
  const scoreB = flip ? up.scoreA : up.scoreB;
  const bestOf = up.bestOf ?? local.bestOf;
  const need = Math.ceil(bestOf / 2);

  // Never move a match backwards (e.g. FINISHED -> SCHEDULED from a stale source).
  if (RANK[up.status] < RANK[local.status]) return null;
  // A FINISHED local result can only be corrected by another FINISHED record.
  if (local.status === 'FINISHED' && up.status !== 'FINISHED') return null;

  const next = { ...local, teamA, teamB, bestOf };
  if (up.startTime) next.startTime = up.startTime;
  if (up.externalId && !local.externalId) next.externalId = up.externalId;

  if (up.status === 'FINISHED') {
    if (!up.winner || (up.winner !== teamA && up.winner !== teamB)) return null;
    let a = Number.isFinite(scoreA) ? scoreA : null;
    let b = Number.isFinite(scoreB) ? scoreB : null;
    // Missing/inconsistent scores: trust the winner, keep the loser's maps if sane.
    const winnerIsA = up.winner === teamA;
    if (winnerIsA && a !== need) a = need;
    if (!winnerIsA && b !== need) b = need;
    if (winnerIsA && (b == null || b >= need)) b = 0;
    if (!winnerIsA && (a == null || a >= need)) a = 0;
    Object.assign(next, { status: 'FINISHED', scoreA: a, scoreB: b, winner: up.winner });
  } else if (up.status === 'IN_PROGRESS') {
    const a = Math.min(need - 1, Math.max(0, scoreA ?? 0));
    const b = Math.min(need - 1, Math.max(0, scoreB ?? 0));
    Object.assign(next, { status: 'IN_PROGRESS', scoreA: a, scoreB: b, winner: null });
  } else {
    Object.assign(next, { status: 'SCHEDULED', scoreA: 0, scoreB: 0, winner: null });
  }

  const keys = ['teamA', 'teamB', 'bestOf', 'status', 'scoreA', 'scoreB', 'winner', 'startTime', 'externalId'];
  const diff = keys.filter((k) => (local[k] ?? null) !== (next[k] ?? null));
  if (!diff.length) return null;
  Object.assign(local, next);
  return diff;
}

function derivePlayInTeams(matches) {
  const byId = new Map(matches.map((m) => [m.id, m]));
  return matches.map((m) => {
    const feed = PLAY_IN_FEEDS[m.id];
    const pick = (f) => {
      const src = f && byId.get(f[0]);
      if (!src) return null;
      return f[1] === 'winner' ? src.winner : loserOf(src);
    };
    return { m, a: m.teamA ?? pick(feed?.A), b: m.teamB ?? pick(feed?.B) };
  });
}

function roundFromHint(hint) {
  const r = /round\s*(\d)/i.exec(hint ?? '');
  return r ? Number(r[1]) : null;
}

function knockoutPrefix(up) {
  const h = (up.roundHint ?? '').toLowerCase();
  if (h.includes('quarter')) return 'QF';
  if (h.includes('semi')) return 'SF';
  if (h.includes('final')) return 'F';
  return null;
}

function swissRecord(tournament, team) {
  let wins = 0;
  let losses = 0;
  for (const r of tournament.swiss.rounds) {
    for (const m of r.matches) {
      if (m.status !== 'FINISHED' || (m.teamA !== team && m.teamB !== team)) continue;
      if (m.winner === team) wins++;
      else losses++;
    }
  }
  return { wins, losses };
}

/**
 * Merges upstream matches into a deep copy of `tournament`.
 * @param {object} tournament
 * @param {UpstreamMatch[]} upstream
 * @returns {{ tournament: object, changes: string[], skipped: string[] }}
 */
export function mergeUpstream(tournament, upstream) {
  const t = structuredClone(tournament);
  const changes = [];
  const skipped = [];
  const ordered = upstream.slice().sort((x, y) => (x.startTime ?? '').localeCompare(y.startTime ?? ''));
  const log = (m, diff, up) => changes.push(`${m.id} ${m.teamA ?? '?'}-${m.teamB ?? '?'}: ${diff.join(',')} (${up.source})`);

  // ---- Play-In: bracket slots are derived, so iterate until stable.
  const pi = ordered.filter((u) => u.stage === 'PLAY_IN');
  const pending = new Set(pi);
  for (let pass = 0; pass < 6 && pending.size; pass++) {
    for (const up of [...pending]) {
      const derived = derivePlayInTeams(t.playIn.matches);
      const hit =
        derived.find(({ m }) => up.externalId && m.externalId === up.externalId) ??
        derived.find(({ a, b }) => a && b && ((a === up.teamA && b === up.teamB) || (a === up.teamB && b === up.teamA)));
      if (!hit) continue;
      pending.delete(up);
      const { m, a, b } = hit;
      m.teamA ??= a;
      m.teamB ??= b;
      const diff = applyUpstream(m, up);
      if (diff) log(m, diff, up);
    }
  }
  for (const up of pending) skipped.push(`PLAY_IN ${up.teamA}-${up.teamB}: no bracket slot yet`);

  // ---- Swiss: a pair can meet only once, so the pair is the key.
  for (const up of ordered.filter((u) => u.stage === 'SWISS')) {
    const all = t.swiss.rounds.flatMap((r) => r.matches);
    let m = all.find((x) => (up.externalId && x.externalId === up.externalId) || samePair(x, up.teamA, up.teamB));
    if (!m) {
      const playedA = all.filter((x) => x.teamA === up.teamA || x.teamB === up.teamA).length;
      const playedB = all.filter((x) => x.teamA === up.teamB || x.teamB === up.teamB).length;
      const round = roundFromHint(up.roundHint) ?? Math.max(playedA, playedB) + 1;
      const bucket = t.swiss.rounds.find((r) => r.round === round);
      if (!bucket || bucket.matches.length >= 8) {
        skipped.push(`SWISS ${up.teamA}-${up.teamB}: invalid round ${round}`);
        continue;
      }
      const rec = swissRecord(t, up.teamA);
      m = {
        id: swissMatchId(round, up.teamA, up.teamB),
        stage: 'SWISS',
        round,
        label: null,
        teamA: up.teamA,
        teamB: up.teamB,
        bestOf: up.bestOf ?? swissBestOf(rec),
        status: 'SCHEDULED',
        scoreA: 0,
        scoreB: 0,
        winner: null,
        startTime: up.startTime,
        externalId: up.externalId,
      };
      bucket.matches.push(m);
      changes.push(`${m.id}: new Swiss match R${round} (${up.source})`);
    }
    const diff = applyUpstream(m, up);
    if (diff) log(m, diff, up);
  }

  // ---- Knockout: pair is unique in single elimination; new pairs fill the next free slot.
  for (const up of ordered.filter((u) => u.stage === 'KNOCKOUT')) {
    const ko = t.knockout.matches;
    let m = ko.find((x) => (up.externalId && x.externalId === up.externalId) || samePair(x, up.teamA, up.teamB));
    if (!m) {
      const prefix = knockoutPrefix(up);
      const free = ko.filter((x) => !x.teamA && !x.teamB);
      m =
        (prefix && free.find((x) => (prefix === 'F' ? x.id === 'F' : x.id.startsWith(prefix)))) ||
        (!prefix && up.startTime ? free.find((x) => x.startTime && x.startTime.slice(0, 10) === up.startTime.slice(0, 10)) : undefined);
      if (!m) {
        skipped.push(`KNOCKOUT ${up.teamA}-${up.teamB}: no free slot (${up.roundHint ?? 'no hint'})`);
        continue;
      }
    }
    const diff = applyUpstream(m, up);
    if (diff) log(m, diff, up);
  }

  return { tournament: t, changes, skipped };
}
