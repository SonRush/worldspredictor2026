import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
// @ts-expect-error -- plain ESM JavaScript module without type declarations
import { applyUpstream, mergeUpstream, teamResolver, toIsoUtc } from '../scripts/lib/merge.mjs';
// @ts-expect-error -- plain ESM JavaScript module without type declarations
import { validateData } from '../scripts/validate.mjs';

const teams = JSON.parse(fs.readFileSync('tests/fixtures/teams.initial.json', 'utf8'));
const tournament = JSON.parse(fs.readFileSync('tests/fixtures/tournament.initial.json', 'utf8'));
const fixture = JSON.parse(fs.readFileSync('scripts/fixtures/sample_upstream.json', 'utf8'));

const up = (o: Record<string, unknown>) => ({
  source: 'test', stage: 'SWISS', roundHint: null, scoreA: null, scoreB: null, winner: null,
  status: 'SCHEDULED', bestOf: null, startTime: null, externalId: null, ...o,
});

describe('sync merge', () => {
  it('resolves upstream names and aliases', () => {
    const r = teamResolver(teams);
    expect(r('Gen.G')).toBe('GEN');
    expect(r('Shanghai Invictus Gaming Meituan')).toBe('IG');
    expect(r('Los Grandes')).toBe('LOS');
    expect(r('Unknown Team')).toBeNull();
  });

  it('parses Leaguepedia and ISO timestamps as UTC', () => {
    expect(toIsoUtc('2026-10-15 20:00:00')).toBe('2026-10-15T20:00:00Z');
    expect(toIsoUtc('2026-10-15T20:00:00.000Z')).toBe('2026-10-15T20:00:00Z');
    expect(toIsoUtc('')).toBeNull();
  });

  it('merges the fixture incrementally and stays valid', () => {
    const { tournament: t, changes } = mergeUpstream(tournament, fixture);
    expect(changes.length).toBeGreaterThan(0);
    // Orientation is kept (local FUR-MVK) and scores are flipped accordingly.
    expect(t.playIn.matches[0]).toMatchObject({ teamA: 'FUR', teamB: 'MVK', scoreA: 3, scoreB: 1, winner: 'FUR', status: 'FINISHED' });
    expect(t.playIn.matches[1]).toMatchObject({ status: 'IN_PROGRESS', scoreA: 1, scoreB: 2 });
    expect(t.swiss.rounds[0].matches).toHaveLength(1);
    expect(t.swiss.rounds[0].matches[0].id).toBe('SW-R1-CFO-GEN');
    expect(validateData(teams, t)).toEqual([]);
    // Input is not mutated, and re-applying is a no-op.
    expect(tournament.playIn.matches[0].status).toBe('SCHEDULED');
    expect(mergeUpstream(t, fixture).changes).toEqual([]);
  });

  it('fills derived Play-In slots once feeder matches finish', () => {
    const rows = [
      up({ stage: 'PLAY_IN', teamA: 'FUR', teamB: 'MVK', scoreA: 3, scoreB: 0, winner: 'FUR', status: 'FINISHED', startTime: '2026-10-15T20:00:00Z' }),
      up({ stage: 'PLAY_IN', teamA: 'KC', teamB: 'C9', scoreA: 3, scoreB: 2, winner: 'KC', status: 'FINISHED', startTime: '2026-10-16T20:00:00Z' }),
      up({ stage: 'PLAY_IN', teamA: 'KC', teamB: 'FUR', status: 'SCHEDULED', startTime: '2026-10-17T20:00:00Z' }),
      up({ stage: 'PLAY_IN', teamA: 'MVK', teamB: 'C9', scoreA: 1, scoreB: 3, winner: 'C9', status: 'FINISHED', startTime: '2026-10-17T23:00:00Z' }),
    ];
    const { tournament: t } = mergeUpstream(tournament, rows);
    const by = Object.fromEntries(t.playIn.matches.map((m: { id: string }) => [m.id, m]));
    expect(by['PI-C']).toMatchObject({ teamA: 'FUR', teamB: 'KC', status: 'SCHEDULED' });
    expect(by['PI-D']).toMatchObject({ teamA: 'MVK', teamB: 'C9', winner: 'C9' });
    expect(validateData(teams, t)).toEqual([]);
  });

  it('never moves a finished match backwards', () => {
    const local = { id: 'X', teamA: 'GEN', teamB: 'T1', bestOf: 3, status: 'FINISHED', scoreA: 2, scoreB: 1, winner: 'GEN', startTime: null, externalId: null };
    expect(applyUpstream({ ...local }, up({ teamA: 'GEN', teamB: 'T1', status: 'SCHEDULED' }))).toBeNull();
    expect(applyUpstream({ ...local }, up({ teamA: 'GEN', teamB: 'T1', status: 'IN_PROGRESS', scoreA: 1, scoreB: 1 }))).toBeNull();
  });

  it('infers the Swiss round when upstream gives no hint', () => {
    const rows = [
      up({ teamA: 'GEN', teamB: 'CFO', scoreA: 1, scoreB: 0, winner: 'GEN', status: 'FINISHED', bestOf: 1, startTime: '2026-10-23T19:00:00Z' }),
      up({ teamA: 'GEN', teamB: 'T1', bestOf: 1, startTime: '2026-10-25T19:00:00Z' }),
    ];
    const { tournament: t } = mergeUpstream(tournament, rows);
    expect(t.swiss.rounds[1].matches[0]).toMatchObject({ id: 'SW-R2-GEN-T1', round: 2 });
  });

  it('places knockout pairs in the slot named by the round hint', () => {
    const rows = [up({ stage: 'KNOCKOUT', roundHint: 'Semifinals', teamA: 'GEN', teamB: 'BLG', bestOf: 5 })];
    const { tournament: t } = mergeUpstream(tournament, rows);
    expect(t.knockout.matches.find((m: { id: string }) => m.id === 'SF1')).toMatchObject({ teamA: 'GEN', teamB: 'BLG' });
  });

  it('keeps repeated Play-In pairings in separate bracket slots (double elimination)', () => {
    const f = (o: Record<string, unknown>) => up({ stage: 'PLAY_IN', status: 'FINISHED', bestOf: 5, ...o });
    // Real order of the 2026 Play-In: R1, R2, lower final and final repeat MVK-FUR / KC-MVK.
    const rows = [
      f({ teamA: 'KC', teamB: 'C9', scoreA: 3, scoreB: 2, winner: 'KC', startTime: '2026-10-15T18:00:00Z' }),
      f({ teamA: 'MVK', teamB: 'FUR', scoreA: 3, scoreB: 0, winner: 'MVK', startTime: '2026-10-15T23:00:00Z' }),
      f({ teamA: 'KC', teamB: 'MVK', scoreA: 3, scoreB: 0, winner: 'KC', startTime: '2026-10-16T18:00:00Z' }),
      f({ teamA: 'FUR', teamB: 'C9', scoreA: 3, scoreB: 1, winner: 'FUR', startTime: '2026-10-16T23:00:00Z' }),
      f({ teamA: 'MVK', teamB: 'FUR', scoreA: 3, scoreB: 1, winner: 'MVK', startTime: '2026-10-17T18:00:00Z' }),
      f({ teamA: 'KC', teamB: 'MVK', scoreA: 3, scoreB: 0, winner: 'KC', startTime: '2026-10-18T18:00:00Z' }),
    ];
    // The same series also arrives from a second source with a slightly different time.
    const dup = rows.map((r) => ({ ...r, source: 'other', startTime: String(r.startTime).replace('T18:', 'T19:').replace('T23:', 'T22:') }));
    for (const input of [rows, [...rows, ...dup]]) {
      const { tournament: t, skipped } = mergeUpstream(tournament, input);
      const by = Object.fromEntries(t.playIn.matches.map((m: { id: string }) => [m.id, m]));
      expect(by['PI-A']).toMatchObject({ teamA: 'FUR', teamB: 'MVK', winner: 'MVK', scoreA: 0, scoreB: 3 });
      expect(by['PI-C']).toMatchObject({ winner: 'KC', status: 'FINISHED' });
      expect(by['PI-E']).toMatchObject({ teamA: 'MVK', teamB: 'FUR', winner: 'MVK', status: 'FINISHED' });
      expect(by['PI-F']).toMatchObject({ teamA: 'KC', teamB: 'MVK', winner: 'KC', status: 'FINISHED' });
      expect(skipped).toEqual([]);
      expect(validateData(teams, t)).toEqual([]);
      // Idempotent: a second sync with the same data changes nothing.
      expect(mergeUpstream(t, input).changes).toEqual([]);
    }
  });
});
