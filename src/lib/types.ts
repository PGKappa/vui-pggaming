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
    betOptions: Array<{ market: BetOptionMarket; options: BetOption[] }>
  }[]
}

export enum BetType {
  TEAM1 = '1',
  DRAW = 'X',
  TEAM2 = '2',
}

export enum BetOptionMarket {
  MAIN,
  NEXT_GOAL,
  MULTIGOAL,
  GG_NG,
  UNDER_OVER,
  COMBO,
  HANDICAP,
  EXACT_SCORE,
  DOUBLE_CHANCE,
}

export const BetOptionMarketLabels = {
  [BetOptionMarket.MAIN]: 'PRINCIPALI',
  [BetOptionMarket.NEXT_GOAL]: 'PROSSIMO GOL',
  [BetOptionMarket.MULTIGOAL]: 'MULTIGOL',
  [BetOptionMarket.GG_NG]: 'GG / NG',
  [BetOptionMarket.UNDER_OVER]: 'UNDER / OVER',
  [BetOptionMarket.COMBO]: 'COMBO',
  [BetOptionMarket.HANDICAP]: 'HANDICAP',
  [BetOptionMarket.EXACT_SCORE]: 'RIS. ESATTO',
  [BetOptionMarket.DOUBLE_CHANCE]: 'DOPPIA CHANCE',
}

export type BetOption = {
  betType: BetType
  odd: number
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
