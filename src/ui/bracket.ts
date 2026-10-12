import type { ResolvedMatch } from '../types.ts';
import { store } from '../state.ts';
import { crest, esc, matchCard, pct, scenarioBanner, team } from './dom.ts';
import { mcControls } from './simPanel.ts';

export function renderBracket(el: HTMLElement) {
  const r = store.resolved(true);
  const by = new Map(r.knockout.map((m) => [m.id, m]));
  const card = (id: string, title: string) => matchCard(by.get(id) as ResolvedMatch, { title });
  const champ = team(r.champion);
  const projected = r.knockout.some((m) => m.source !== 'official');
  const picks = Object.keys(store.overrides).filter((k) => /^(QF|SF|F$)/.test(k)).length;
  const mc = store.mc;
  const favourites = mc
    ? Object.values(mc.odds)
        .sort((a, b) => b.champion - a.champion)
        .slice(0, 5)
    : [];
  el.innerHTML = `
  <section class="panel">
    <header class="panel-head">
      <div>
        <h3 class="panel-title">Knockout Stage · Bo5</h3>
        <p class="panel-sub">Los dos 3-0 van a mitades opuestas contra equipos 3-2; el resto se sortea. Cuartos y semis en Allen (TX), final el 14 de noviembre en el Barclays Center (NY).</p>
      </div>
      ${picks ? `<button class="btn-ghost text-xs" data-action="clear-picks" data-prefix="QF,SF,F">Borrar picks (${picks})</button>` : ''}
    </header>
    ${scenarioBanner()}
    ${projected && store.scenarioSeed == null ? `<p class="notice">Cuadro proyectado: resultados oficiales + tus picks + favoritos por Elo para lo que falta. Haz click en un equipo para forzar su victoria; el cuadro se recalcula.</p>` : ''}
    <div class="bracket">
      <div class="bracket-col"><h4 class="col-title">Cuartos</h4>${card('QF1', 'QF1')}${card('QF2', 'QF2')}<div class="h-2"></div>${card('QF3', 'QF3')}${card('QF4', 'QF4')}</div>
      <div class="bracket-col justify-around"><h4 class="col-title">Semifinales</h4>${card('SF1', 'SF1')}${card('SF2', 'SF2')}</div>
      <div class="bracket-col justify-center"><h4 class="col-title">Gran Final</h4>${card('F', 'Final · Brooklyn')}
        <div class="champion ${champ ? '' : 'opacity-50'}">
          <div class="text-[10px] uppercase tracking-[0.3em] text-gold-400">${projected ? 'Campeón proyectado' : 'Campeón'}</div>
          ${champ ? `<div class="flex items-center gap-3 justify-center mt-2">${crest(champ.id, 'w-12 h-12 text-xs')}<span class="font-display text-2xl text-gold-100">${esc(champ.name)}</span></div>` : '<div class="mt-2 text-hex-500">Por definir</div>'}
        </div>
      </div>
    </div>
  </section>
  <section class="panel mt-6">
    <header class="panel-head"><div><h3 class="panel-title">Favoritos al título (Monte Carlo)</h3>
    <p class="panel-sub">${mc ? `${mc.iterations.toLocaleString()} simulaciones del resto del torneo desde el estado real.` : store.mcRunning ? 'Simulando…' : 'Aún no hay simulación.'}</p></div>${mcControls()}</header>
    <div class="grid gap-2 sm:grid-cols-5">
      ${favourites
        .map(
          (o) => `<div class="stat-tile">${crest(o.team)}<div class="min-w-0"><div class="truncate text-sm">${esc(team(o.team)?.name)}</div><div class="text-xl font-display text-gold-300 tabular-nums">${pct(o.champion)}</div><div class="text-[10px] text-hex-500">Final ${pct(o.final, 0)}</div></div></div>`,
        )
        .join('')}
    </div>
  </section>`;
}
