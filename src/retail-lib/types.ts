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
  palimpsestId?: string
  discipline: Discipline
  name: string
  startTime: string
  time: Date
  duration: number
  trackName?: string
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
  track?: string
  jornada?: number
  groupId?: number
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
    roundId?: number
    extId?: string
    palimpsestId?: string
  }
  discipline: Discipline
  competitors: string
  option: Selection
  track?: string
}

export type BetEntry = {
  id: number
  market: string
  apiMarket?: string
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
  minWinOverride?: number
  maxWinAssignedCombinations?: BetEntry[][]
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

export type TicketListRequest = {
  dateStart: string
  dateEnd: string
  offset: number
  itemsPerPage: number
  terminal: number
  status: number
  payment: number
  enablePagination: boolean
  accountingMode: boolean
}

export type TicketListItem = {
  ticket_id: number
  time: [string, number, string, string, string, string]
  amount: string
  amount_won: string
  saldo?: string
  intl: {
    currency: string
    locale: string
    timezone: string
  }
  terminal_id: string
  status: number
  // gameId grezzi delle selezioni del ticket: la classificazione in discipline
  // resta lato frontend (vedi classifyDisciplines in use-ticket-list.ts).
  // Opzionale per compatibilità con backend non ancora aggiornati.
  game_ids?: string[]
}

export type TicketListInfo = {
  count: number
  count_paid: number
  count_won: number
  tot_in: string
  tot_cancelled: number | string
  tot_out: string
  tot_profit: number
  grandtotal: {
    in: number
    cancelled: number | string
    out: string
  }
}

export type TicketListResponse = {
  ret_code: number
  description: string
  info: TicketListInfo
  items: TicketListItem[]
}

export type TicketDetailSelection = {
  game: {
    dict: {
      misc: { name: string }
      markets: Record<string, string>
      runners?: Record<string, string>
    }
    constraints: Record<string, string>
  }
  competitors?: string[]
  trackName: string
  channelName: string
  gameDuration: number
  startTime: string
  gameId: string
  channelId: number
  palimpsestId: string
  eventId: number
  isBanker: string
  status: string
  markets: {
    description: string
    selections: {
      description: string
      odds: string
      status: number
    }[]
  }[]
}

export type TicketDetailInfo = {
  betType: string
  ticket_id: number
  time: [number, number, number, number, number, number]
  intl: {
    currency: string
    locale: string
    timezone: string
  }
  amount: string
  amount_won: string
  status: number
  selections: TicketDetailSelection[]
  system: Record<string, string>
}

export type TicketDetailResponse = {
  ret_code: number
  description?: string
  info: TicketDetailInfo
}

export type TicketPayResponse = {
  ret_code: string | number
  description: string
  print?: string
}
