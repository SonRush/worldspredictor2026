export type Region = 'LCK' | 'LPL' | 'LEC' | 'LCS' | 'CBLOL' | 'LCP' | 'LTA';
export type Stage = 'PLAY_IN' | 'SWISS' | 'KNOCKOUT';
export type MatchStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED';
export type BestOf = 1 | 3 | 5;
/** Where a resolved result comes from: real data, a user pick, or the simulator. */
export type ResultSource = 'official' | 'manual' | 'projected';

export interface RosterEntry {
  role: 'TOP' | 'JUNGLE' | 'MID' | 'BOT' | 'SUPPORT' | 'SUB' | 'COACH';
  player: string;
}

export interface Team {
  id: string;
  code: string;
  name: string;
  region: Region;
  regionSeed: number;
  stageEntry: 'PLAY_IN' | 'SWISS';
  swissTier: number | null;
  baseElo: number;
  roster: RosterEntry[];
  aliases: string[];
  metrics: {
    worldsAppearances?: number | null;
    splitWinRate?: number | null;
    gdAt15?: number | null;
    kda?: number | null;
  };
}

export interface Match {
  id: string;
  stage: Stage;
  round: number | string;
  label?: string | null;
  teamA: string | null;
  teamB: string | null;
  bestOf: BestOf;
  status: MatchStatus;
  scoreA: number;
  scoreB: number;
  winner: string | null;
  startTime: string | null;
  externalId?: string | null;
}

export interface TeamsFile {
  schemaVersion: 1;
  lastUpdated: string;
  teams: Team[];
}

export interface TournamentFile {
  schemaVersion: 1;
  lastUpdated: string;
  event: {
    name: string;
    shortName: string;
    stages: { id: Stage; name: string; start: string; end: string; venue?: string }[];
  };
  playIn: { matches: Match[] };
  swiss: { rounds: { round: number; matches: Match[] }[] };
  knockout: { matches: Match[] };
}

/** A user what-if: forces the winner (and optionally score) of a match. */
export interface Override {
  winner: string;
  scoreA?: number;
  scoreB?: number;
}
export type Overrides = Record<string, Override>;

/** A match after resolution: teams filled in and, if decided, a result + its source. */
export interface ResolvedMatch extends Match {
  source: ResultSource | null;
  /** Pool label for Swiss matches, e.g. "1-0". */
  pool?: string;
  /** True when the pairing itself is simulated (not published yet). */
  projectedPairing: boolean;
}

export interface SwissRecord {
  team: string;
  wins: number;
  losses: number;
  opponents: string[];
  /** Round in which the team reached 3 wins or 3 losses. */
  finishedRound: number | null;
}

export interface ResolvedTournament {
  playIn: ResolvedMatch[];
  playInQualifier: string | null;
  swissTeams: string[];
  swissRounds: { round: number; matches: ResolvedMatch[] }[];
  swissRecords: Record<string, SwissRecord>;
  knockout: ResolvedMatch[];
  champion: string | null;
}
