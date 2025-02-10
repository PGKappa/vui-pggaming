export type Score = {
  team1: string,
  team2: string,
  score1: number,
  score2: number,
}

export type Round = {
  name: string,
  number: number,
  scores: Score[],
  status: RoundStatus,
}

export enum RoundStatus {
  UPCOMING = 'UPCOMING',
  LIVE = 'LIVE',
  COMPLETED = 'COMPLETED',
}
