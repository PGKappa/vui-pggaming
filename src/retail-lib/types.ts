export type User = {
  playerId: string
  currency: string
  lang: string
  level: number
  group: string[]
}

export type Score = {
  team1: string
  team2: string
  score1: number
  score2: number
}

export type Team = {
  kitChoice: string
  name: string
  position: number
  form: string
  homeKit: string
  homeKitId: number
  homeKitIdSpecified: boolean
  awayKit: string
  awayKitId: number
  awayKitIdSpecified: boolean
  strenght: number
  strenghtSpecified: boolean
  teamId: number
  teamIdSpecified: boolean
  kitChoiceSpecified: boolean
}

export type Selection = {
  outcome: string
  decPrice: number
}

export type Market = {
  selections: {
    selection: Selection[]
  }[]
  name: string
  code: string
  externCode: string
  margin: number
  marginSpecified?: boolean
}

export type EventIdentity = {
  eventId: number
  scheduleId: number
  scheduleIdSpecified: boolean
  scheduleUUID: string
  eventName: string
  startTime: Date
  eventType: string
  externEventIdSpecified: boolean
  externOfferIdSpecified: boolean
  displayCode: string
  groupId: number
  groupIdSpecified: boolean
  eventStatus: string
  scheduleType: string
  scheduleSubType: string
  roundIdSpecified: boolean
  parentGroupIdSpecified: boolean
}

export type UpcomingMatch = {
  eventIdentity: EventIdentity
  eventName: string
  groupId: number
  markets: { market: Market[] }
  maxRoundIdSpecified: boolean
  racer: { racer: [] }
  roundIdSpecified: boolean
  startTime: string
  teams: {
    team: Team[]
  }
  timeOfDay: string
}

export type UpcomingEvent = {
  id: number
  extId?: string
  discipline: Discipline
  name: string
  startTime: string
  time: Date
  duration: number
  data?: UpcomingRound | UpcomingRace
}

export type UpcomingRace = {
  id: number
  odds: {
    winner: Record<string, string>
    placed: Record<string, string>
    show: Record<string, string>
    exacta: Record<string, Record<string, string>>
    quinella: Record<string, Record<string, string>>
    trifecta: Record<string, Record<string, Record<string, string>>>
    boxedtrifecta: Record<string, Record<string, Record<string, string>>>
    evenodd: {
      even: string
      odd: string
    }
    underover: {
      under: string
      over: string
    }
  }
  latecomers: {
    winner: {
      racers: number[]
      delay: number
    }
    exacta: {
      racers: number[]
      delay: number
    }
    trifecta: {
      racers: number[]
      delay: number
    }
  }
  racers: Array<{
    number: number
    name: string
    history: number[]
    performance: number
  }>
}

export type UpcomingRound = {
  channel: number
  oddsFormat: string
  scheduleId: number
  scheduleName: string
  scheduleUUID: string
  subType: string
  type: string
  mag_event: UpcomingMatch[]
}

/* export type RoundResults = {
  round: {
    name: string
    number: number
  }
  startTime: Date
  duration: number
  matchResults: MatchResult[]
} */

export enum Discipline {
  DOGS = 'DOGS',
  HORSES = 'HORSES',
  SOCCER = 'SOCCER',
}

export type EventResult = {
  id: number
  extId?: string
  name: string
  startTime: Date
  discipline: Discipline
  result?: MatchResult | RaceResult
}

export type RaceResult = {
  odds: {
    winner: Record<string, string>
    placed: Record<string, string>
    show: Record<string, string>
    exacta: Record<string, Record<string, string>>
    quinella: Record<string, Record<string, string>>
    trifecta: Record<string, Record<string, Record<string, string>>>
    boxedtrifecta: Record<string, Record<string, Record<string, string>>>
    evenodd: Record<string, string>
    underover: Record<string, string>
  }
  raceDuration?: number
  arrival?: {
    name: string
    number: number
  }[]
}

export type Bet = {
  event: {
    name: string
    number: number
    startingAt: Date
  }
  discipline: Discipline
  competitors: string
  option: Selection
}

export type BetEntry = {
  id: number
  market: string
  bet: Bet
  fixed?: boolean
}

export type SystemGroup = {
  name: string
  size: number
  combinations: BetEntry[][]
  stake: number
  minWin: number
  maxWin: number
}

export type Ticket = {
  id: number
  date: Date
  amount: number
  winning: number
  betEntries: BetEntry[]
  status: 'Vincente' | 'Pending' | 'Perdente'
}

export type SubmittedTicket = {
  date: Date
  amount: number
  winning: number
  betEntries: BetEntry[]
}

export type MatchResult = {
  round?: {
    name: string
    number: number
  }
  teams: string
  score1: number
  score2: number
  odds?: {
    oneXTwo: {
      odds: number
    }
    doubleChance: {
      odds: number
    }
    firstScorer: {
      teamLabel?: string
      odds: number
    }
    sumGoals: {
      value: number
      odds: number
    }
    goalNoGoal: {
      value: number
      odds: number
    }
    redCard: {
      value: string
      odds: number
    }
    winningCombo: {
      value: string
      odds: number
    }
    exactGoals: {
      value: number
      odds: number
    }
  }
}

export type MatchStatistics = {
  teams: string
  probabilities: [number, number, number]
  startTime: Date
}

export type TeamRanking = {
  position: number
  team: string
  played: number
  wins: number
  draws: number
  losses: number
  points: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  last8: Array<'W' | 'L' | 'D'>
}
