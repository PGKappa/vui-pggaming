export type Score = {
  team1: string
  team2: string
  score1: number
  score2: number
}

export type LiveRound = {
  name: string
  number: number
  scores: Score[]
  startingAt: Date
  streamUrl: string
}

export type TeamRanking = {
  position: number
  team: string
  played: number
  wins: number
  draws: number
  losses: number
  points: number
  last8: Array<'W' | 'L' | 'X'>
}

export type UpcomingRound = {
  name: string
  number: number
  startingAt: Date
  betAmounts: number[]
}
