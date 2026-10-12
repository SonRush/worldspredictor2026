import './styles.css';
import { loadData } from './data.ts';
import { store } from './state.ts';
import { runMonteCarlo, type MonteCarloInput, type MonteCarloResult } from './montecarlo.ts';
import { renderSwiss } from './ui/swissTracker.ts';
import { renderBracket } from './ui/bracket.ts';
import { renderH2H } from './ui/h2h.ts';
import { renderRankings, setSort } from './ui/rankings.ts';
import { esc } from './ui/dom.ts';
import type { BestOf } from './types.ts';

const TABS = {
  swiss: { label: 'Swiss Stage', render: renderSwiss },
  bracket: { label: 'Playoffs', render: renderBracket },
  h2h: { label: 'H2H Simulator', render: renderH2H },
  rankings: { label: 'Power Rankings', render: renderRankings },
} as const;
type TabId = keyof typeof TABS;

const REFRESH_MS = 5 * 60 * 1000;
const app = document.getElementById('view')!;
const tabsEl = document.getElementById('tabs')!;
const metaEl = document.getElementById('meta')!;

function currentTab(): TabId {
  const h = location.hash.replace('#', '') as TabId;
  return h in TABS ? h : 'swiss';
}

function renderTabs() {
  const active = currentTab();
  tabsEl.innerHTML = (Object.keys(TABS) as TabId[])
    .map(
      (id) =>
        `<a href="#${id}" role="tab" aria-selected="${id === active}" class="tab ${id === active ? 'is-active' : ''}">${TABS[id].label}</a>`,
    )
    .join('');
}

function currentStageLabel(): string {
  const now = new Date().toISOString().slice(0, 10);
  const stages = store.tournament.event.stages;
  const live = stages.find((s) => now >= s.start && now <= s.end);
  if (live) return live.name;
  const next = stages.find((s) => now < s.start);
  return next ? `Próximo: ${next.name} (${next.start})` : 'Torneo finalizado';
}

function renderMeta() {
  const live = [
    ...store.tournament.playIn.matches,
    ...store.tournament.swiss.rounds.flatMap((r) => r.matches),
    ...store.tournament.knockout.matches,
  ].some((m) => m.status === 'IN_PROGRESS');
  const updated = new Date(store.tournament.lastUpdated);
  metaEl.innerHTML = `
    ${live ? '<span class="pill pill-live"><i></i>EN VIVO</span>' : ''}
    <span class="hidden sm:inline text-gold-300">${esc(currentStageLabel())}</span>
    <span title="${esc(store.tournament.lastUpdated)}">Datos: ${esc(updated.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }))}</span>
    <button class="btn-ghost" data-action="refresh" title="Recargar datos">↻</button>`;
}

function render() {
  renderTabs();
  renderMeta();
  const tab = currentTab();
  TABS[tab].render(app);
  document.title = `${TABS[tab].label} · Worlds 2026 Predictor`;
}

// ------------------------------------------------------------ Monte Carlo

let worker: Worker | null = null;
function getWorker(): Worker | null {
  if (worker) return worker;
  try {
    worker = new Worker(new URL('./mc.worker.ts', import.meta.url), { type: 'module' });
  } catch {
    worker = null;
  }
  return worker;
}

function runMc() {
  if (store.mcRunning) return;
  store.setMc(store.mc, true);
  const input: MonteCarloInput = {
    teams: store.teams,
    tournament: store.tournament,
    ratings: store.ratings,
    iterations: store.prefs.mcIterations,
    overrides: store.prefs.mcUseOverrides ? store.overrides : undefined,
  };
  const w = getWorker();
  if (!w) {
    // Fallback: run on the main thread (yield first so the UI shows "Simulando…").
    setTimeout(() => store.setMc(runMonteCarlo(input), false), 20);
    return;
  }
  w.onmessage = (e: MessageEvent<MonteCarloResult>) => store.setMc(e.data, false);
  w.onerror = () => {
    worker = null;
    store.setMc(runMonteCarlo(input), false);
  };
  w.postMessage(JSON.parse(JSON.stringify(input)));
}

// ------------------------------------------------------------ Events

document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  const pick = target.closest<HTMLButtonElement>('[data-pick]');
  if (pick && !pick.disabled && pick.dataset.team) {
    store.togglePick(pick.dataset.pick!, pick.dataset.team);
    return;
  }
  const sort = target.closest<HTMLElement>('[data-sort]');
  if (sort) {
    setSort(sort.dataset.sort!);
    render();
    return;
  }
  const bo = target.closest<HTMLElement>('[data-h2h-bo]');
  if (bo) {
    store.setPrefs({ h2h: { ...store.prefs.h2h, bestOf: Number(bo.dataset.h2hBo) as BestOf } });
    return;
  }
  const action = target.closest<HTMLElement>('[data-action]')?.dataset.action;
  switch (action) {
    case 'refresh':
      void refresh(true);
      break;
    case 'run-mc':
      runMc();
      break;
    case 'h2h-swap': {
      const { a, b, bestOf } = store.prefs.h2h;
      store.setPrefs({ h2h: { a: b, b: a, bestOf } });
      break;
    }
    case 'clear-picks': {
      const prefixes = (target.closest<HTMLElement>('[data-prefix]')?.dataset.prefix ?? '').split(',');
      if (prefixes.includes('SW-')) prefixes.push('PI-');
      for (const p of prefixes) store.clearPicks(p);
      break;
    }
  }
});

document.addEventListener('change', (e) => {
  const el = e.target as HTMLInputElement | HTMLSelectElement;
  if (el.dataset.action === 'toggle-projection') {
    store.setPrefs({ showProjection: (el as HTMLInputElement).checked });
  } else if (el.dataset.h2h) {
    const h2h = { ...store.prefs.h2h, [el.dataset.h2h]: el.value };
    if (h2h.a === h2h.b) {
      const other = el.dataset.h2h === 'a' ? 'b' : 'a';
      h2h[other] = store.prefs.h2h[el.dataset.h2h as 'a' | 'b'];
    }
    store.setPrefs({ h2h });
  } else if (el.dataset.mc === 'iterations') {
    store.setPrefs({ mcIterations: Number(el.value) });
  } else if (el.dataset.mc === 'overrides') {
    store.setPrefs({ mcUseOverrides: (el as HTMLInputElement).checked });
  }
});

window.addEventListener('hashchange', render);

// ------------------------------------------------------------ Data lifecycle

async function refresh(manual = false) {
  try {
    const { teams, tournament } = await loadData();
    const changed =
      !store.tournament ||
      tournament.lastUpdated !== store.tournament.lastUpdated ||
      teams.lastUpdated !== store.teamsFile.lastUpdated;
    if (changed || manual) {
      store.setData(teams, tournament);
      runMc();
    }
  } catch (err) {
    console.error(err);
    if (!store.tournament) {
      app.innerHTML = `<div class="panel text-center text-loss">No se pudieron cargar los datos (${esc((err as Error).message)}).</div>`;
    }
  }
}

store.subscribe(render);
void refresh().then(() => setInterval(() => void refresh(), REFRESH_MS));
