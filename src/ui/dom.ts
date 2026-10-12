import type { ResolvedMatch, Team } from '../types.ts';
import { store } from '../state.ts';
import { pMap, seriesWinProb } from '../simulator.ts';
import { LOGO_TONE } from '../logoTone.ts';

export function esc(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export const pct = (x: number, digits = 1) =>
  x <= 0 ? '0%' : x >= 1 ? '100%' : x < 0.001 ? '<0.1%' : `${(x * 100).toFixed(digits)}%`;

export const REGION_COLORS: Record<string, string> = {
  LCK: '#0AC8B9',
  LPL: '#E84057',
  LEC: '#C8AA6E',
  LCS: '#4A90E2',
  LTA: '#4A90E2',
  CBLOL: '#3FB950',
  LCP: '#B57EDC',
};

export function team(id: string | null): Team | undefined {
  return id ? store.teamsById.get(id) : undefined;
}

/** Hexagon with the team code: fallback when a logo is missing or fails to load. */
export function codeCrest(code: string, color: string, size: string): string {
  return `<span class="hex-crest ${size}" style="--crest:${color}" aria-hidden="true">${esc(code)}</span>`;
}

/** Team crest: official logo on a round plate ringed in the region color. */
export function crest(id: string | null, size = 'w-8 h-8 text-[10px]'): string {
  const t = team(id);
  if (!t) return codeCrest('?', '#3C3C41', size);
  const color = REGION_COLORS[t.region] ?? '#3C3C41';
  const tone = LOGO_TONE[t.id] ? ` data-tone="${LOGO_TONE[t.id]}"` : '';
  return `<span class="logo-crest ${size}" style="--crest:${color}"${tone} data-code="${esc(t.code)}"><img src="logos/${esc(t.id)}.webp" alt="${esc(t.name)}" width="40" height="40" loading="lazy" decoding="async" draggable="false"></span>`;
}

export function regionTag(region: string): string {
  return `<span class="region-tag" style="--rc:${REGION_COLORS[region] ?? '#888'}">${esc(region)}</span>`;
}

export function seriesProbFor(m: Pick<ResolvedMatch, 'teamA' | 'teamB' | 'bestOf'>): number | null {
  if (!m.teamA || !m.teamB || !store.ratings[m.teamA] || !store.ratings[m.teamB]) return null;
  return seriesWinProb(pMap(store.ratings, m.teamA, m.teamB), m.bestOf);
}

export function statusPill(m: ResolvedMatch): string {
  if (m.status === 'IN_PROGRESS') return '<span class="pill pill-live"><i></i>EN VIVO</span>';
  if (m.source === 'official') return '<span class="pill pill-final">FINAL</span>';
  if (m.source === 'manual') return '<span class="pill pill-pick">TU PICK</span>';
  if (m.source === 'projected') return '<span class="pill pill-proj">PROYECCIÓN</span>';
  return '<span class="pill pill-sched">PROGRAMADO</span>';
}

function fmtTime(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

/**
 * Match card used by Play-In, Swiss and Bracket. Team rows are buttons that
 * toggle a user pick unless the official result is final.
 */
export function matchCard(m: ResolvedMatch, opts: { compact?: boolean; title?: string } = {}): string {
  const p = seriesProbFor(m);
  const locked = m.status === 'FINISHED' || !m.teamA || !m.teamB;
  const row = (id: string | null, score: number, prob: number | null) => {
    const t = team(id);
    const isWinner = !!m.winner && m.winner === id;
    const isLoser = !!m.winner && m.winner !== id;
    const showScore = m.source || m.status === 'IN_PROGRESS';
    return `<button type="button" class="team-row ${isWinner ? 'is-winner' : ''} ${isLoser ? 'is-loser' : ''}"
      ${locked ? 'disabled' : ''} data-pick="${esc(m.id)}" data-team="${esc(id ?? '')}"
      title="${locked ? '' : 'Click: elegir ganador (otra vez para quitar)'}">
      ${crest(id, 'w-6 h-6 text-[8px]')}
      <span class="flex-1 truncate text-left">${t ? esc(opts.compact ? t.code : t.name) : '<span class="text-hex-500">Por definir</span>'}</span>
      ${prob != null && !m.winner ? `<span class="text-[10px] text-cyan-neon/80 tabular-nums">${pct(prob, 0)}</span>` : ''}
      <span class="score">${showScore ? score : ''}</span>
    </button>`;
  };
  return `<div class="match-card ${m.projectedPairing ? 'is-projected' : ''} ${m.status === 'IN_PROGRESS' ? 'is-live' : ''}" data-match="${esc(m.id)}">
    <div class="flex items-center justify-between gap-2 px-2 pt-1.5 pb-1 text-[10px] uppercase tracking-wider text-hex-500">
      <span class="truncate">${esc(opts.title ?? m.label ?? '')} <b class="text-gold-300">Bo${m.bestOf}</b></span>
      <span class="flex items-center gap-1">${m.startTime && !m.source ? `<span>${esc(fmtTime(m.startTime))}</span>` : ''}${statusPill(m)}</span>
    </div>
    ${row(m.teamA, m.scoreA, p)}
    ${row(m.teamB, m.scoreB, p == null ? null : 1 - p)}
    ${scorePicker(m)}
    ${p != null ? `<div class="prob-bar" title="Probabilidad de serie"><span style="width:${(p * 100).toFixed(1)}%"></span></div>` : ''}
  </div>`;
}

/**
 * For a user pick in a Bo3/Bo5, lets the user choose the exact scoreline.
 * Default (auto) score = most likely scoreline for that winner given both Elos.
 */
function scorePicker(m: ResolvedMatch): string {
  if (m.source !== 'manual' || m.bestOf === 1 || !m.winner || !m.teamA || !m.teamB) return '';
  const w = Math.ceil(m.bestOf / 2);
  const aWins = m.winner === m.teamA;
  const custom = store.overrides[m.id]?.scoreA != null;
  const options = Array.from({ length: w }, (_, l) => {
    const [sa, sb] = aWins ? [w, l] : [l, w];
    const active = m.scoreA === sa && m.scoreB === sb;
    return `<button type="button" class="score-opt ${active ? 'is-active' : ''}" data-score="${esc(m.id)}"
      data-winner="${esc(m.winner)}" data-sa="${sa}" data-sb="${sb}">${w}-${l}</button>`;
  }).join('');
  return `<div class="score-picker" title="${custom ? 'Marcador elegido por ti' : 'Automático: el marcador más probable para este ganador según el Elo de ambos equipos'}">
    <span>${esc(team(m.winner)?.code)} gana</span>${options}${custom ? '' : '<em>auto</em>'}
  </div>`;
}
