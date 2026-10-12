import type { BestOf } from '../types.ts';
import { store } from '../state.ts';
import { analyzeMatchup } from '../simulator.ts';
import { officialMatches } from '../tournament.ts';
import { crest, esc, pct, regionTag, team } from './dom.ts';

export function renderH2H(el: HTMLElement) {
  const { a, b, bestOf } = store.prefs.h2h;
  const ids = store.teams.map((t) => t.id);
  const A = ids.includes(a) ? a : ids[0];
  const B = ids.includes(b) && b !== A ? b : ids.find((x) => x !== A)!;
  const res = analyzeMatchup(store.ratings, A, B, bestOf);
  const tA = team(A)!;
  const tB = team(B)!;
  const options = (sel: string) =>
    store.teams
      .slice()
      .sort((x, y) => x.name.localeCompare(y.name))
      .map((t) => `<option value="${esc(t.id)}" ${t.id === sel ? 'selected' : ''}>${esc(t.name)} (${esc(t.region)})</option>`)
      .join('');
  const maxProb = Math.max(...res.distribution.map((d) => d.prob));
  const meetings = officialMatches(store.tournament).filter(
    (m) => m.status === 'FINISHED' && ((m.teamA === A && m.teamB === B) || (m.teamA === B && m.teamB === A)),
  );
  const side = (id: string, p: number, align: string) => {
    const t = team(id)!;
    const r = store.ratings[id];
    return `<div class="flex flex-col items-center gap-2 ${align}">
      ${crest(id, 'w-16 h-16 text-sm')}
      <div class="font-display text-lg text-gold-100 text-center">${esc(t.name)}</div>
      <div class="flex items-center gap-2 text-xs">${regionTag(t.region)}<span class="text-hex-500">Elo ${r.effective.toFixed(0)}</span></div>
      <div class="font-display text-4xl md:text-5xl tabular-nums ${p >= 0.5 ? 'text-cyan-neon' : 'text-gold-300'}">${pct(p)}</div>
    </div>`;
  };
  const roster = (id: string) =>
    team(id)!
      .roster.map((p) => `<li class="flex justify-between gap-2"><span class="text-hex-500 text-[10px] uppercase w-14">${esc(p.role)}</span><span class="truncate">${esc(p.player)}</span></li>`)
      .join('');
  el.innerHTML = `
  <section class="panel">
    <header class="panel-head"><div><h3 class="panel-title">Matchup Simulator</h3>
      <p class="panel-sub">Probabilidad por mapa con Elo (P = 1 / (1 + 10<sup>(R<sub>B</sub>−R<sub>A</sub>)/400</sup>)) y distribución binomial para la serie.</p></div></header>
    <div class="grid gap-3 md:grid-cols-[1fr_auto_1fr] items-end">
      <label class="field"><span>Equipo A</span><select data-h2h="a">${options(A)}</select></label>
      <div class="flex gap-2 justify-center">
        <button class="btn-ghost" data-action="h2h-swap" title="Intercambiar">⇄</button>
        <div class="seg" role="group" aria-label="Formato">
          ${([1, 3, 5] as BestOf[]).map((n) => `<button data-h2h-bo="${n}" class="${n === bestOf ? 'is-active' : ''}">Bo${n}</button>`).join('')}
        </div>
      </div>
      <label class="field"><span>Equipo B</span><select data-h2h="b">${options(B)}</select></label>
    </div>
    <div class="grid grid-cols-2 gap-4 mt-6 items-start">
      ${side(A, res.pSeries, '')}
      ${side(B, 1 - res.pSeries, '')}
    </div>
    <div class="prob-bar big mt-4"><span style="width:${(res.pSeries * 100).toFixed(1)}%"></span></div>
    <div class="grid gap-4 md:grid-cols-3 mt-6">
      <div class="sub-panel">
        <h4 class="col-title">Resumen</h4>
        <dl class="kv">
          <dt>Prob. por mapa (${esc(tA.code)})</dt><dd>${pct(res.pMap)}</dd>
          <dt>Prob. de serie (${esc(tA.code)})</dt><dd>${pct(res.pSeries)}</dd>
          <dt>Marcador más probable</dt><dd class="text-gold-300">${res.mostLikely.scoreA}-${res.mostLikely.scoreB} <span class="text-hex-500">(${pct(res.mostLikely.prob)})</span></dd>
          <dt>Favorito</dt><dd>${esc(res.pSeries >= 0.5 ? tA.name : tB.name)}</dd>
          <dt>Cruces en Worlds 2026</dt><dd>${meetings.length ? meetings.map((m) => `${esc(team(m.teamA)?.code)} ${m.scoreA}-${m.scoreB} ${esc(team(m.teamB)?.code)}`).join(', ') : '—'}</dd>
        </dl>
      </div>
      <div class="sub-panel">
        <h4 class="col-title">Distribución de marcadores</h4>
        <div class="flex flex-col gap-1.5">
          ${res.distribution
            .map(
              (d) => `<div class="flex items-center gap-2 text-xs">
                <span class="w-16 tabular-nums ${d.scoreA > d.scoreB ? 'text-cyan-neon' : 'text-gold-300'}">${esc(d.scoreA > d.scoreB ? tA.code : tB.code)} ${Math.max(d.scoreA, d.scoreB)}-${Math.min(d.scoreA, d.scoreB)}</span>
                <span class="flex-1 h-3 bg-hex-800 rounded-sm overflow-hidden"><span class="block h-full ${d.scoreA > d.scoreB ? 'bg-cyan-neon/80' : 'bg-gold-300/80'}" style="width:${((d.prob / maxProb) * 100).toFixed(1)}%"></span></span>
                <span class="w-12 text-right tabular-nums">${pct(d.prob)}</span>
              </div>`,
            )
            .join('')}
        </div>
      </div>
      <div class="sub-panel">
        <h4 class="col-title">Factores determinantes</h4>
        <p class="text-[11px] text-hex-500 mb-2">Puntos de rating a favor de ${esc(tA.code)} (negativo = a favor de ${esc(tB.code)}).</p>
        <div class="flex flex-col gap-2">
          ${res.factors
            .map((f) => {
              const w = Math.min(50, Math.abs(f.value) / 4);
              return `<div class="text-xs">
                <div class="flex justify-between"><span>${esc(f.label)}</span><span class="tabular-nums ${f.value >= 0 ? 'text-cyan-neon' : 'text-gold-300'}">${f.value >= 0 ? '+' : ''}${f.value.toFixed(0)}</span></div>
                <div class="relative h-1.5 bg-hex-800 mt-1"><span class="absolute top-0 h-full ${f.value >= 0 ? 'bg-cyan-neon left-1/2' : 'bg-gold-300 right-1/2'}" style="width:${w}%"></span></div>
              </div>`;
            })
            .join('')}
        </div>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-4 mt-6">
      <div class="sub-panel"><h4 class="col-title">${esc(tA.name)}</h4><ul class="text-sm flex flex-col gap-1">${roster(A)}</ul></div>
      <div class="sub-panel"><h4 class="col-title">${esc(tB.name)}</h4><ul class="text-sm flex flex-col gap-1">${roster(B)}</ul></div>
    </div>
  </section>`;
}
