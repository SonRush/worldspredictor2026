import { store } from '../state.ts';
import { crest, esc, pct, team } from './dom.ts';

export const MC_ITERATION_OPTIONS = [1000, 5000, 10000, 25000, 50000];

/** Shared Monte Carlo controls (iterations, include picks, run). */
export function mcControls(): string {
  const current = MC_ITERATION_OPTIONS.includes(store.prefs.mcIterations) ? store.prefs.mcIterations : 1000;
  const options = MC_ITERATION_OPTIONS.map(
    (n) => `<option value="${n}" ${n === current ? 'selected' : ''}>${n.toLocaleString()}</option>`,
  ).join('');
  return `<div class="flex flex-wrap items-center gap-2 text-xs">
    <label class="field-inline">Simulaciones <select data-mc="iterations">${options}</select></label>
    <label class="toggle"><input type="checkbox" data-mc="overrides" ${store.prefs.mcUseOverrides ? 'checked' : ''}><span>Incluir mis picks</span></label>
    <button class="btn-gold" data-action="run-mc" ${store.mcRunning ? 'disabled' : ''}>${store.mcRunning ? 'Simulando…' : '▶ Simular torneo'}</button>
  </div>`;
}

export function mcStatus(): string {
  const mc = store.mc;
  if (store.mcRunning) return `Simulando ${store.prefs.mcIterations.toLocaleString()} torneos…`;
  if (!mc) return 'Sin simulación todavía.';
  return `${mc.iterations.toLocaleString()} simulaciones · ${(mc.elapsedMs / 1000).toFixed(2)} s · seed ${mc.seed}${mc.usedOverrides ? ' · con tus picks' : ''}`;
}

/** Monte Carlo panel for the main page: run N simulations and see the favourites. */
export function renderSimPanel(): string {
  const mc = store.mc;
  const top = mc
    ? Object.values(mc.odds)
        .sort((a, b) => b.champion - a.champion || b.final - a.final)
        .slice(0, 8)
    : [];
  return `
  <section class="panel">
    <header class="panel-head">
      <div>
        <h3 class="panel-title">Simulador del torneo (Monte Carlo)</h3>
        <p class="panel-sub">Juega el resto de Worlds N veces desde el estado real (y, si quieres, con tus picks) y cuenta cuántas veces cada equipo llega a playoffs, a la final o gana el título.</p>
      </div>
      ${mcControls()}
    </header>
    <p class="text-[11px] text-hex-500 mb-3">${esc(mcStatus())} · <a href="#rankings" class="text-cyan-neon hover:underline">Ver tabla completa →</a></p>
    <div class="grid gap-2 grid-cols-2 md:grid-cols-4 ${store.mcRunning ? 'opacity-50' : ''}">
      ${top
        .map(
          (o, i) => `<div class="stat-tile">
            <span class="hidden sm:inline text-hex-500 text-xs tabular-nums w-4">${i + 1}</span><span class="hidden sm:inline-flex">${crest(o.team)}</span>
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm"><span class="sm:hidden text-hex-500 tabular-nums">${i + 1}. </span><span class="sm:hidden">${esc(team(o.team)?.code)}</span><span class="hidden sm:inline">${esc(team(o.team)?.name)}</span></div>
              <div class="text-xl font-display text-gold-300 tabular-nums leading-tight">${pct(o.champion)}</div>
              <div class="text-[10px] text-hex-500 tabular-nums">Playoffs ${pct(o.playoffs, 0)} · Final ${pct(o.final, 0)}</div>
            </div>
          </div>`,
        )
        .join('')}
    </div>
  </section>`;
}
