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
  order: number
  externCode: string
  extraInfo?: string
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

export type LastRoundResults = {
  round: {
    name: string
    number: number
  }
  startTime: Date
  duration: number
  matchResults: MatchResult[]
}

export type Bet = {
  round: {
    name: string
    number: number
    startingAt: Date
  }
  teams: string
  option: Selection
}

export type BetEntry = {
  id: number
  market: string
  bet: Bet
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
  round: {
    name: string
    number: number
  }
  teams: string
  score1: number
  score2: number
}
