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
  duration: number
  matches: {
    teams: string
    odds: number[]
  }[]
}

export type MatchStatistics = {
  teams: string
  probabilities: [number, number, number]
  startTime: Date
}

export type RoundStatistics = {
  name: string
  number: number
  matches: MatchStatistics[]
}
