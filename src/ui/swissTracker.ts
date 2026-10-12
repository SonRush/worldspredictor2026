import type { ResolvedMatch, ResolvedTournament } from '../types.ts';
import { store } from '../state.ts';
import { crest, esc, matchCard, team } from './dom.ts';

function playInSection(r: ResolvedTournament): string {
  const byId = new Map(r.playIn.map((m) => [m.id, m]));
  const col = (title: string, ids: string[]) => `
    <div class="flex flex-col gap-3 min-w-0">
      <h4 class="col-title">${esc(title)}</h4>
      ${ids.map((id) => (byId.get(id) ? matchCard(byId.get(id)!) : '')).join('')}
    </div>`;
  const q = team(r.playInQualifier);
  return `
  <section class="panel">
    <header class="panel-head">
      <div>
        <h3 class="panel-title">Play-In · Los Ángeles</h3>
        <p class="panel-sub">Doble eliminación, todas las series Bo5. Solo el ganador avanza al Swiss Stage (Tier 4 del sorteo).</p>
      </div>
      ${q ? `<div class="flex items-center gap-2 text-sm">${crest(q.id)}<span>Clasifica: <b class="text-gold-300">${esc(q.name)}</b></span></div>` : ''}
    </header>
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      ${col('Ronda 1', ['PI-A', 'PI-B'])}
      ${col('Ronda 2', ['PI-C', 'PI-D'])}
      ${col('Ronda 3', ['PI-E'])}
      ${col('Final de clasificación', ['PI-F'])}
    </div>
  </section>`;
}

function poolOrder(label: string): number {
  const [w, l] = label.split('-').map(Number);
  return -(w * 10 - l);
}

function roundColumn(round: number, matches: ResolvedMatch[], waiting: Map<string, string[]>): string {
  const pools = new Map<string, ResolvedMatch[]>();
  for (const m of matches) pools.set(m.pool ?? '?', [...(pools.get(m.pool ?? '?') ?? []), m]);
  for (const [label] of waiting) if (!pools.has(label)) pools.set(label, []);
  const labels = [...pools.keys()].sort((a, b) => poolOrder(a) - poolOrder(b));
  return `
    <div class="flex flex-col gap-3 min-w-0">
      <h4 class="col-title">Ronda ${round}</h4>
      ${
        labels.length === 0
          ? '<p class="text-xs text-hex-500 italic">Pendiente de sorteo</p>'
          : labels
              .map((label) => {
                const ms = pools.get(label)!;
                const [w, l] = label.split('-').map(Number);
                const kind = w === 2 && l === 2 ? 'decisivo' : w === 2 ? 'clasificación' : l === 2 ? 'eliminación' : '';
                const wait = waiting.get(label) ?? [];
                return `<div class="pool">
                  <div class="pool-head"><span class="pool-label">${esc(label)}</span>${kind ? `<span class="text-[10px] uppercase text-gold-400">${kind} · Bo3</span>` : '<span class="text-[10px] uppercase text-hex-500">Bo1</span>'}</div>
                  <div class="flex flex-col gap-2">${ms.map((m) => matchCard(m, { compact: true })).join('')}
                  ${wait.length ? `<div class="flex flex-wrap gap-1 p-2 text-[10px] text-hex-500">Esperando sorteo: ${wait.map((id) => crest(id, 'w-6 h-6 text-[8px]')).join('')}</div>` : ''}
                  </div>
                </div>`;
              })
              .join('')
      }
    </div>`;
}

function outcomeColumn(r: ResolvedTournament): string {
  const recs = Object.values(r.swissRecords);
  const group = (wins: number, losses: number, good: boolean) => {
    const list = recs.filter((x) => x.wins === wins && x.losses === losses);
    return `<div class="pool ${good ? 'pool-good' : 'pool-bad'}">
      <div class="pool-head"><span class="pool-label">${wins}-${losses}</span><span class="text-[10px] uppercase ${good ? 'text-cyan-neon' : 'text-loss'}">${good ? 'Playoffs' : 'Eliminado'}</span></div>
      <div class="flex flex-col gap-1">${
        list.length
          ? list
              .map((x) => `<div class="flex items-center gap-2 text-sm px-2 py-1">${crest(x.team, 'w-6 h-6 text-[8px]')}<span class="truncate">${esc(team(x.team)?.name)}</span></div>`)
              .join('')
          : '<span class="text-xs text-hex-500 px-2 py-1">—</span>'
      }</div>
    </div>`;
  };
  return `
    <div class="flex flex-col gap-3 min-w-0">
      <h4 class="col-title">Resultado</h4>
      ${group(3, 0, true)}${group(3, 1, true)}${group(3, 2, true)}
      ${group(2, 3, false)}${group(1, 3, false)}${group(0, 3, false)}
    </div>`;
}

export function renderSwiss(el: HTMLElement) {
  const projection = store.prefs.showProjection;
  const r = store.resolved(projection);
  // Teams waiting in a pool without a published/projected match yet.
  const roundsHtml = r.swissRounds
    .map((round) => {
      const waiting = new Map<string, string[]>();
      const playing = new Set(round.matches.flatMap((m) => [m.teamA, m.teamB]));
      const prevDone = r.swissRounds
        .filter((x) => x.round < round.round)
        .every((x) => x.matches.every((m) => m.winner));
      if (prevDone && r.swissTeams.length === 16) {
        // Records before this round = records minus results from this round onwards.
        for (const id of r.swissTeams) {
          if (playing.has(id)) continue;
          let w = 0;
          let l = 0;
          for (const prev of r.swissRounds.filter((x) => x.round < round.round)) {
            const m = prev.matches.find((x) => x.teamA === id || x.teamB === id);
            if (m?.winner === id) w++;
            else if (m?.winner) l++;
          }
          if (w < 3 && l < 3) waiting.set(`${w}-${l}`, [...(waiting.get(`${w}-${l}`) ?? []), id]);
        }
      }
      return roundColumn(round.round, round.matches, waiting);
    })
    .join('');
  const picks = Object.keys(store.overrides).filter((k) => k.startsWith('SW-') || k.startsWith('PI-')).length;
  el.innerHTML = `
    <div class="flex flex-col gap-6">
      ${playInSection(r)}
      <section class="panel">
        <header class="panel-head">
          <div>
            <h3 class="panel-title">Swiss Stage · Allen, Texas</h3>
            <p class="panel-sub">16 equipos · 3 victorias clasifican, 3 derrotas eliminan · Bo1 salvo series de clasificación/eliminación (Bo3) · sin revanchas.</p>
          </div>
          <div class="flex flex-wrap items-center gap-3 text-xs">
            <label class="toggle"><input type="checkbox" data-action="toggle-projection" ${projection ? 'checked' : ''}><span>Proyectar favoritos</span></label>
            ${picks ? `<button class="btn-ghost" data-action="clear-picks" data-prefix="SW-">Borrar picks (${picks})</button>` : ''}
          </div>
        </header>
        <p class="legend">
          <span><i class="dot bg-cyan-neon"></i>Oficial</span>
          <span><i class="dot bg-gold-300"></i>Tu pick (click en un equipo; en Bo3/Bo5 eliges el marcador)</span>
          <span><i class="dot border border-dashed border-hex-500"></i>Emparejamiento simulado</span>
        </p>
        <div class="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          ${roundsHtml}
          ${outcomeColumn(r)}
        </div>
      </section>
    </div>`;
}
