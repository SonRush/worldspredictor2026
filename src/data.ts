import type { TeamsFile, TournamentFile } from './types.ts';

/** Relative URLs: works from any GitHub Pages sub-path. */
const DATA_BASE = './data/';

async function getJson<T>(file: string): Promise<T> {
  const res = await fetch(`${DATA_BASE}${file}?t=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
  return (await res.json()) as T;
}

export async function loadData(): Promise<{ teams: TeamsFile; tournament: TournamentFile }> {
  const [teams, tournament] = await Promise.all([
    getJson<TeamsFile>('teams.json'),
    getJson<TournamentFile>('tournament.json'),
  ]);
  if (!Array.isArray(teams?.teams) || !tournament?.swiss?.rounds) throw new Error('Malformed data files');
  return { teams, tournament };
}
