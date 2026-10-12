#!/usr/bin/env node
// Validates teams.json + tournament.json against public/data/schema.json
// plus semantic checks a JSON Schema cannot express (referential integrity,
// score/best-of consistency, duplicate ids).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DATA_DIR = path.join(ROOT, 'public', 'data');

let compiled = null;
function validators() {
  if (compiled) return compiled;
  const schema = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'schema.json'), 'utf8'));
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  ajv.addSchema(schema);
  compiled = {
    teams: ajv.getSchema(`${schema.$id}#/$defs/teamsFile`),
    tournament: ajv.getSchema(`${schema.$id}#/$defs/tournamentFile`),
  };
  return compiled;
}

function allMatches(t) {
  return [...t.playIn.matches, ...t.swiss.rounds.flatMap((r) => r.matches), ...t.knockout.matches];
}

/** @returns {string[]} list of human-readable errors (empty = valid) */
export function validateData(teamsFile, tournamentFile) {
  const errors = [];
  const v = validators();
  if (!v.teams(teamsFile)) {
    errors.push(...v.teams.errors.map((e) => `teams.json ${e.instancePath || '/'} ${e.message}`));
  }
  if (!v.tournament(tournamentFile)) {
    errors.push(...v.tournament.errors.map((e) => `tournament.json ${e.instancePath || '/'} ${e.message}`));
  }
  if (errors.length) return errors;

  const ids = new Set();
  for (const team of teamsFile.teams) {
    if (ids.has(team.id)) errors.push(`duplicate team id ${team.id}`);
    ids.add(team.id);
    if (team.stageEntry === 'SWISS' && team.swissTier == null) errors.push(`${team.id}: SWISS team needs swissTier`);
  }
  const swissDirect = teamsFile.teams.filter((t) => t.stageEntry === 'SWISS').length;
  if (swissDirect !== 15) errors.push(`expected 15 direct Swiss teams, found ${swissDirect}`);

  const matchIds = new Set();
  for (const m of allMatches(tournamentFile)) {
    if (matchIds.has(m.id)) errors.push(`duplicate match id ${m.id}`);
    matchIds.add(m.id);
    for (const key of ['teamA', 'teamB', 'winner']) {
      if (m[key] && !ids.has(m[key])) errors.push(`${m.id}: unknown team ${m[key]} in ${key}`);
    }
    if (m.teamA && m.teamA === m.teamB) errors.push(`${m.id}: team plays itself`);
    const need = Math.ceil(m.bestOf / 2);
    if (m.scoreA > need || m.scoreB > need) errors.push(`${m.id}: score exceeds Bo${m.bestOf}`);
    if (m.status === 'FINISHED') {
      const winnerScore = m.winner === m.teamA ? m.scoreA : m.scoreB;
      if (m.winner !== m.teamA && m.winner !== m.teamB) errors.push(`${m.id}: winner is not a participant`);
      else if (winnerScore !== need) errors.push(`${m.id}: winner must have ${need} map wins`);
    } else if (m.winner) {
      errors.push(`${m.id}: winner set on unfinished match`);
    }
  }
  tournamentFile.swiss.rounds.forEach((r, i) => {
    if (r.round !== i + 1) errors.push(`swiss round ${i + 1} out of order`);
    const seen = new Set();
    for (const m of r.matches) {
      for (const t of [m.teamA, m.teamB]) {
        if (!t) continue;
        if (seen.has(t)) errors.push(`swiss round ${r.round}: ${t} plays twice`);
        seen.add(t);
      }
    }
  });
  return errors;
}

export function readData(dir = DATA_DIR) {
  return {
    teams: JSON.parse(fs.readFileSync(path.join(dir, 'teams.json'), 'utf8')),
    tournament: JSON.parse(fs.readFileSync(path.join(dir, 'tournament.json'), 'utf8')),
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { teams, tournament } = readData();
  const errors = validateData(teams, tournament);
  if (errors.length) {
    console.error(`✗ Data validation failed (${errors.length}):`);
    for (const e of errors) console.error('  -', e);
    process.exit(1);
  }
  console.log(`✓ Data valid: ${teams.teams.length} teams, ${allMatches(tournament).length} matches`);
}
