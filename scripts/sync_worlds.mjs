#!/usr/bin/env node
/**
 * Worlds 2026 data sync.
 *
 *   node scripts/sync_worlds.mjs [--dry-run] [--source=leaguepedia|lolesports|all] [--fixture=file.json]
 *
 * 1. Fetches match data from Leaguepedia's Cargo API and the LoL Esports
 *    schedule API (live IN_PROGRESS states; key overridable via LOLESPORTS_API_KEY).
 * 2. Merges incrementally into public/data/tournament.json: only matches whose
 *    upstream state advanced are touched; pending/simulated data is kept.
 * 3. Validates the result against schema.json + semantic checks.
 * 4. Writes atomically (tmp file + rename) only if something changed.
 *
 * Fails safe: network errors, empty or malformed responses, or a merge that
 * would not validate leave the existing JSON untouched and exit with code 0
 * (a GitHub Actions ::warning:: is emitted instead).
 */
import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR, readData, validateData } from './validate.mjs';
import { mergeUpstream, teamResolver, toIsoUtc } from './lib/merge.mjs';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);
const DRY_RUN = Boolean(args['dry-run']);
const SOURCE = args.source ?? 'all';
const USER_AGENT = 'worldspredictor2026-sync/1.0 (+https://github.com/sonrush/worldspredictor2026)';

const LEAGUEPEDIA_API = process.env.LEAGUEPEDIA_API ?? 'https://lol.fandom.com/api.php';
const OVERVIEW_PREFIX = '2026 Season World Championship';
const LOLESPORTS_API = process.env.LOLESPORTS_API ?? 'https://esports-api.lolesports.com/persisted/gw';
const WORLDS_LEAGUE_ID = process.env.LOLESPORTS_LEAGUE_ID ?? '98767975604431411';
// Public key embedded in the lolesports.com frontend (unofficial; override via env if it rotates).
const LOLESPORTS_PUBLIC_KEY = '0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z';

const warn = (msg) => console.log(process.env.GITHUB_ACTIONS ? `::warning::${msg}` : `⚠ ${msg}`);
const info = (msg) => console.log(msg);

async function fetchJson(url, init = {}, { retries = 3, timeoutMs = 20000 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        ...init,
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json', ...(init.headers ?? {}) },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
      if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { fatal: true });
      const body = await res.json();
      if (body?.error?.code === 'ratelimited' || body?.error?.code === 'maxlag') throw new Error(body.error.code);
      return body;
    } catch (err) {
      lastErr = err;
      if (err.fatal || attempt === retries) break;
      await new Promise((r) => setTimeout(r, 2000 * 2 ** attempt));
    }
  }
  throw lastErr;
}

// ------------------------------------------------------------- Leaguepedia

function stageFromOverview(page, tab) {
  const p = `${page ?? ''} ${tab ?? ''}`.toLowerCase();
  if (p.includes('play-in') || p.includes('play in')) return 'PLAY_IN';
  if (/quarter|semi|final|knockout|playoff/.test(p) && !p.includes('swiss')) return 'KNOCKOUT';
  return 'SWISS';
}

export async function fetchLeaguepedia(resolve) {
  const fields = [
    'MS.MatchId=MatchId',
    'MS.OverviewPage=OverviewPage',
    'MS.Tab=Tab',
    'MS.Round=Round',
    'MS.N_MatchInTab=N',
    'MS.Team1=Team1',
    'MS.Team2=Team2',
    'MS.Team1Score=Team1Score',
    'MS.Team2Score=Team2Score',
    'MS.Winner=Winner',
    'MS.BestOf=BestOf',
    'MS.DateTime_UTC=DateTime',
  ].join(',');
  const params = new URLSearchParams({
    action: 'cargoquery',
    format: 'json',
    tables: 'MatchSchedule=MS',
    fields,
    where: `MS.OverviewPage LIKE '${OVERVIEW_PREFIX}%'`,
    order_by: 'MS.DateTime_UTC ASC',
    limit: '200',
    maxlag: '5',
  });
  const body = await fetchJson(`${LEAGUEPEDIA_API}?${params}`);
  if (body?.error) throw new Error(`Cargo error: ${body.error.info ?? body.error.code}`);
  const rows = (body?.cargoquery ?? []).map((r) => r.title ?? {});
  const out = [];
  for (const r of rows) {
    const teamA = resolve(r.Team1);
    const teamB = resolve(r.Team2);
    if (!teamA || !teamB) continue; // TBD slots or unknown names
    const sA = r.Team1Score === '' || r.Team1Score == null ? null : Number(r.Team1Score);
    const sB = r.Team2Score === '' || r.Team2Score == null ? null : Number(r.Team2Score);
    const winner = r.Winner === '1' ? teamA : r.Winner === '2' ? teamB : null;
    const bo = Number(r.BestOf);
    const startTime = toIsoUtc(r.DateTime ?? r['DateTime UTC']);
    const live = !winner && ((sA ?? 0) > 0 || (sB ?? 0) > 0);
    out.push({
      source: 'leaguepedia',
      stage: stageFromOverview(r.OverviewPage, r.Tab),
      roundHint: [r.Tab, r.Round].filter(Boolean).join(' ') || null,
      teamA,
      teamB,
      scoreA: sA,
      scoreB: sB,
      winner,
      status: winner ? 'FINISHED' : live ? 'IN_PROGRESS' : 'SCHEDULED',
      bestOf: [1, 3, 5].includes(bo) ? bo : null,
      startTime,
      externalId: r.MatchId ? `lp:${r.MatchId}` : null,
    });
  }
  return out;
}

// ------------------------------------------------------------- LoL Esports

export async function fetchLolEsports(resolve, apiKey) {
  const out = [];
  let pageToken = '';
  for (let page = 0; page < 5; page++) {
    const q = new URLSearchParams({ hl: 'en-US', leagueId: WORLDS_LEAGUE_ID });
    if (pageToken) q.set('pageToken', pageToken);
    const body = await fetchJson(`${LOLESPORTS_API}/getSchedule?${q}`, { headers: { 'x-api-key': apiKey } });
    const schedule = body?.data?.schedule;
    if (!schedule) throw new Error('LoL Esports: malformed schedule');
    for (const ev of schedule.events ?? []) {
      if (ev.type !== 'match' || !ev.match || !ev.startTime?.startsWith('2026')) continue;
      const [t1, t2] = ev.match.teams ?? [];
      const teamA = resolve(t1?.code) ?? resolve(t1?.name);
      const teamB = resolve(t2?.code) ?? resolve(t2?.name);
      if (!teamA || !teamB) continue;
      const state = ev.state;
      const w1 = t1.result?.outcome === 'win';
      const w2 = t2.result?.outcome === 'win';
      const count = ev.match.strategy?.count;
      out.push({
        source: 'lolesports',
        stage: stageFromOverview(ev.blockName, ''),
        roundHint: ev.blockName ?? null,
        teamA,
        teamB,
        scoreA: t1.result?.gameWins ?? null,
        scoreB: t2.result?.gameWins ?? null,
        winner: state === 'completed' ? (w1 ? teamA : w2 ? teamB : null) : null,
        status: state === 'completed' && (w1 || w2) ? 'FINISHED' : state === 'inProgress' ? 'IN_PROGRESS' : 'SCHEDULED',
        bestOf: [1, 3, 5].includes(count) ? count : null,
        startTime: toIsoUtc(ev.startTime),
        externalId: null, // keep Leaguepedia ids as the canonical external id
      });
    }
    pageToken = schedule.pages?.newer;
    if (!pageToken) break;
  }
  return out;
}

// ------------------------------------------------------------- Main

function writeAtomic(file, data) {
  const tmp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n');
  fs.renameSync(tmp, file);
}

async function main() {
  const { teams, tournament } = readData();
  const resolve = teamResolver(teams);
  const upstream = [];

  if (args.fixture) {
    upstream.push(...JSON.parse(fs.readFileSync(path.resolve(String(args.fixture)), 'utf8')));
    info(`Loaded ${upstream.length} upstream records from fixture`);
  } else {
    if (SOURCE === 'all' || SOURCE === 'leaguepedia') {
      try {
        const rows = await fetchLeaguepedia(resolve);
        info(`Leaguepedia: ${rows.length} matches`);
        upstream.push(...rows);
      } catch (err) {
        warn(`Leaguepedia unavailable: ${err.message}`);
      }
    }
    const key = process.env.LOLESPORTS_API_KEY || LOLESPORTS_PUBLIC_KEY;
    if ((SOURCE === 'all' || SOURCE === 'lolesports') && key) {
      try {
        const rows = await fetchLolEsports(resolve, key);
        info(`LoL Esports: ${rows.length} matches`);
        upstream.push(...rows);
      } catch (err) {
        warn(`LoL Esports unavailable: ${err.message}`);
      }
    }
  }

  if (upstream.length === 0) {
    warn('No upstream data (empty or failed responses). Existing JSON left untouched.');
    return;
  }

  const { tournament: merged, changes, skipped } = mergeUpstream(tournament, upstream);
  for (const s of skipped) info(`  skip: ${s}`);
  if (changes.length === 0) {
    info('No changes.');
    return;
  }
  merged.lastUpdated = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

  const errors = validateData(teams, merged);
  if (errors.length) {
    warn(`Merged data failed validation; not writing. ${errors.slice(0, 5).join(' | ')}`);
    return;
  }
  info(`${changes.length} change(s):`);
  for (const c of changes) info(`  ${c}`);
  if (DRY_RUN) {
    info('Dry run: nothing written.');
    return;
  }
  writeAtomic(path.join(DATA_DIR, 'tournament.json'), merged);
  info('tournament.json updated.');
}

main().catch((err) => {
  // Last-resort guard: never fail the workflow or corrupt data on unexpected errors.
  warn(`Sync aborted: ${err?.stack ?? err}`);
});
