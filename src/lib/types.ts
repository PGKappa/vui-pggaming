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
  duration: number
  matches: {
    teams: string
    odds: number[]
  }[]
}

export enum BetType {
  TEAM1,
  DRAW,
  TEAM2,
}

export enum BetOption {
  MAIN,
  NEXT_GOAL,
  MULTIGOAL,
  GG_NG,
  UNDER_OVER,
  HANDICAP,
  EXACT_SCORE,
  DOUBLE_CHANCE,
}

export type Bet = {
  round: {
    name: string
    number: number
    startingAt: Date
  }
  betType: BetType
  teams: string
  selectedTeam: string
  odd: number
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

export type BetsHistory = {
  id: number
  date: Date
  amount: number
  winning: number
  status: 'Vincente' | 'Perdente'
}