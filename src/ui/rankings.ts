import { store } from '../state.ts';
import { K_FACTOR } from '../simulator.ts';
import { crest, esc, pct, regionTag } from './dom.ts';

type SortKey = 'elo' | 'delta' | 'record' | 'swiss' | 'playoffs' | 'final' | 'champion' | 'name';
let sortKey: SortKey = 'champion';
let sortDir: 1 | -1 = -1;

export function setSort(key: string) {
  if (key === sortKey) sortDir = sortDir === 1 ? -1 : 1;
  else {
    sortKey = key as SortKey;
    sortDir = key === 'name' ? 1 : -1;
  }
}

export function renderRankings(el: HTMLElement) {
  const mc = store.mc;
  const resolved = store.resolved(false);
  const rows = store.teams.map((t) => {
    const r = store.ratings[t.id];
    const o = mc?.odds[t.id];
    const rec = resolved.swissRecords[t.id];
    return {
      t,
      r,
      o,
      rec,
      values: {
        elo: r.effective,
        delta: r.elo - r.base,
        record: r.seriesWon - r.seriesLost + r.seriesWon * 0.01,
        swiss: o?.swiss ?? 0,
        playoffs: o?.playoffs ?? 0,
        final: o?.final ?? 0,
        champion: o?.champion ?? r.effective / 1e6,
        name: 0,
      } as Record<SortKey, number>,
    };
  });
  rows.sort((x, y) =>
    sortKey === 'name'
      ? sortDir * x.t.name.localeCompare(y.t.name)
      : sortDir * (x.values[sortKey] - y.values[sortKey]) || y.r.effective - x.r.effective,
  );
  const th = (key: SortKey, label: string, cls = '') =>
    `<th class="${cls}"><button data-sort="${key}" class="th-btn ${sortKey === key ? 'is-sorted' : ''}">${label}${sortKey === key ? (sortDir === -1 ? ' ▾' : ' ▴') : ''}</button></th>`;
  const bar = (x: number | undefined, color: string) =>
    x == null
      ? '<span class="text-hex-500">—</span>'
      : `<div class="flex items-center gap-2 justify-end"><span class="tabular-nums">${pct(x)}</span><span class="hidden lg:block w-14 h-1.5 bg-hex-800"><span class="block h-full" style="width:${(x * 100).toFixed(1)}%;background:${color}"></span></span></div>`;
  const iterOptions = [500, 1000, 5000, 10000]
    .map((n) => `<option value="${n}" ${n === store.prefs.mcIterations ? 'selected' : ''}>${n.toLocaleString()}</option>`)
    .join('');
  el.innerHTML = `
  <section class="panel">
    <header class="panel-head">
      <div><h3 class="panel-title">Power Rankings</h3>
      <p class="panel-sub">Elo efectivo = Elo base ajustado por resultados oficiales en Worlds 2026 (K=${K_FACTOR} por mapa) + peso regional + forma reciente. Probabilidades por Monte Carlo.</p></div>
      <div class="flex flex-wrap items-center gap-2 text-xs">
        <label class="field-inline">Simulaciones <select data-mc="iterations">${iterOptions}</select></label>
        <label class="toggle"><input type="checkbox" data-mc="overrides" ${store.prefs.mcUseOverrides ? 'checked' : ''}><span>Incluir mis picks</span></label>
        <button class="btn-gold" data-action="run-mc" ${store.mcRunning ? 'disabled' : ''}>${store.mcRunning ? 'Simulando…' : '▶ Ejecutar Monte Carlo'}</button>
      </div>
    </header>
    ${mc ? `<p class="text-[11px] text-hex-500 mb-3">${mc.iterations.toLocaleString()} simulaciones · ${mc.elapsedMs.toFixed(0)} ms · seed ${mc.seed}</p>` : ''}
    <div class="table-wrap">
      <table class="rank-table">
        <thead><tr>
          <th class="w-8 hidden sm:table-cell">#</th>
          ${th('name', 'Equipo', 'text-left')}
          ${th('elo', 'Elo')}
          ${th('delta', 'Δ', 'hidden sm:table-cell')}
          ${th('record', 'Series', 'hidden md:table-cell')}
          <th class="hidden lg:table-cell">Forma</th>
          ${th('swiss', 'Swiss', 'hidden xl:table-cell')}
          ${th('playoffs', 'Playoffs')}
          ${th('final', 'Final', 'hidden sm:table-cell')}
          ${th('champion', 'Campeón')}
        </tr></thead>
        <tbody>
          ${rows
            .map(({ t, r, o, rec }, i) => {
              const out = rec && (rec.wins === 3 || rec.losses === 3);
              return `<tr class="${rec?.losses === 3 ? 'opacity-50' : ''}">
                <td class="text-hex-500 tabular-nums hidden sm:table-cell">${i + 1}</td>
                <td class="text-left max-w-[10rem] sm:max-w-none"><div class="flex items-center gap-2 min-w-0">${crest(t.id)}
                  <div class="min-w-0"><div class="truncate text-gold-100">${esc(t.name)}</div>
                  <div class="flex items-center gap-1.5 text-[10px] text-hex-500">${regionTag(t.region)}<span class="hidden sm:inline">${t.stageEntry === 'PLAY_IN' ? 'Play-In' : `Tier ${t.swissTier}`}</span>${rec ? `<span class="whitespace-nowrap">· Swiss ${rec.wins}-${rec.losses}${out ? (rec.wins === 3 ? ' ✓' : ' ✗') : ''}</span>` : ''}</div></div></div></td>
                <td class="tabular-nums text-gold-300">${r.effective.toFixed(0)}</td>
                <td class="tabular-nums hidden sm:table-cell ${r.elo - r.base >= 0 ? 'text-cyan-neon' : 'text-loss'}">${r.elo - r.base >= 0 ? '+' : ''}${(r.elo - r.base).toFixed(0)}</td>
                <td class="tabular-nums hidden md:table-cell">${r.seriesWon}-${r.seriesLost} <span class="text-hex-500 text-[10px]">(${r.mapsWon}-${r.mapsLost})</span></td>
                <td class="hidden lg:table-cell"><div class="flex gap-0.5 justify-end">${
                  r.form.length
                    ? r.form.slice(-5).map((f) => `<span class="form-chip ${f === 'W' ? 'is-w' : 'is-l'}">${f}</span>`).join('')
                    : '<span class="text-hex-500 text-xs">—</span>'
                }</div></td>
                <td class="hidden xl:table-cell">${bar(o?.swiss, '#5B5A56')}</td>
                <td>${bar(o?.playoffs, '#0AC8B9')}</td>
                <td class="hidden sm:table-cell">${bar(o?.final, '#C8AA6E')}</td>
                <td>${bar(o?.champion, '#C89B3C')}</td>
              </tr>`;
            })
            .join('')}
        </tbody>
      </table>
    </div>
  </section>`;
}
