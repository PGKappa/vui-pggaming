/**
 * Script to generate events data with 10 events per groupId and 40 unique groupIds
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Get current file path in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Function to generate random date between two dates
function randomDate(start, end) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  )
}

// Function to format date to ISO string with proper format (YYYY-MM-DDThh:mm:ssZ)
function formatDate(date) {
  // Format as YYYY-MM-DDThh:mm:ssZ without milliseconds
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  const seconds = String(date.getUTCSeconds()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`
}

// Function to generate random form string (e.g., "WLLWWXXL")
function generateRandomForm() {
  const possibleValues = ['W', 'L', 'X']
  let form = ''
  for (let i = 0; i < 8; i++) {
    form += possibleValues[Math.floor(Math.random() * possibleValues.length)]
  }
  return form
}

// Function to generate random price with full precision
function generateRandomPrice(min, max) {
  // Don't use toFixed to keep full precision
  return Math.random() * (max - min) + min
}

// List of real team codes to use
const teamCodes = [
  'MCI',
  'MUN',
  'LIV',
  'CHE',
  'ARS',
  'TOT',
  'LEI',
  'EVE',
  'WHU',
  'NEW',
  'ASV',
  'SOU',
  'CPL',
  'BHA',
  'LEE',
  'BUR',
  'WAT',
  'NOR',
  'BRE',
  'WOL',
]

// Function to generate team data
function generateTeam(isHome, index, groupId, eventIndex) {
  const teamPosition = isHome ? 1 : 2
  const kitChoice = isHome ? 'Home' : 'Away'

  // Use real team codes based on groupId and eventIndex
  const teamCodeIndex =
    (groupId + (isHome ? 0 : 1) + eventIndex) % teamCodes.length
  const teamName = teamCodes[teamCodeIndex]

  // Generate team ID based on groupId and position
  const teamId = isHome
    ? 270 + (groupId % 20) + (eventIndex % 10)
    : 290 + (groupId % 20) + (eventIndex % 10)

  // Generate kit IDs
  const homeKitId = 1000 + (groupId % 20)
  const awayKitId = 1020 + (groupId % 20)

  // Generate team strength (between 40-80)
  const strength = 40 + Math.floor(Math.random() * 41)

  // Generate team form
  const form = generateRandomForm()

  // Generate team kit codes
  const prefix = teamName.substring(0, 3)
  const homeKitCode = `${prefix}_${homeKitId}`
  const awayKitCode = `${prefix}A_${awayKitId}`

  return {
    kitChoice: kitChoice,
    name: teamName,
    position: teamPosition,
    form: form,
    homeKit: homeKitCode,
    homeKitId: homeKitId,
    homeKitIdSpecified: true,
    awayKit: awayKitCode,
    awayKitId: awayKitId,
    awayKitIdSpecified: true,
    strenght: strength,
    strenghtSpecified: true,
    teamId: teamId,
    teamIdSpecified: true,
    kitChoiceSpecified: true,
  }
}

// Function to generate selection for a market
function generateSelections(marketCode) {
  switch (marketCode) {
    case '67': // Esito finale 1X2
      return {
        selection: [
          {
            outcome: '1',
            decPrice: generateRandomPrice(1.5, 3.5),
            order: 1,
            externCode: '1',
          },
          {
            outcome: 'X',
            decPrice: generateRandomPrice(2.5, 4.5),
            order: 2,
            externCode: '2',
          },
          {
            outcome: '2',
            decPrice: generateRandomPrice(2.0, 4.0),
            order: 3,
            externCode: '3',
          },
        ],
      }
    case '68': // Doppia Chance
      return {
        selection: [
          {
            outcome: '1X',
            decPrice: generateRandomPrice(1.1, 1.5),
            order: 1,
            externCode: '1',
          },
          {
            outcome: 'X2',
            decPrice: generateRandomPrice(1.3, 1.8),
            order: 2,
            externCode: '2',
          },
          {
            outcome: '12',
            decPrice: generateRandomPrice(1.1, 1.5),
            order: 3,
            externCode: '3',
          },
        ],
      }
    case '73': // Gol no gol
      return {
        selection: [
          {
            outcome: 'G',
            decPrice: generateRandomPrice(1.4, 1.8),
            order: 1,
            externCode: '1',
          },
          {
            outcome: 'NG',
            decPrice: generateRandomPrice(1.8, 2.5),
            order: 2,
            externCode: '2',
          },
        ],
      }
    case '79': // Under/Over 2.5
      return {
        selection: [
          {
            outcome: 'U',
            decPrice: generateRandomPrice(1.8, 2.2),
            order: 1,
            externCode: '1',
          },
          {
            outcome: 'O',
            decPrice: generateRandomPrice(1.5, 1.8),
            order: 2,
            externCode: '2',
          },
        ],
      }
    default:
      return {
        selection: [
          {
            outcome: 'Option 1',
            decPrice: generateRandomPrice(1.5, 3.0),
            order: 1,
            externCode: '1',
          },
          {
            outcome: 'Option 2',
            decPrice: generateRandomPrice(1.5, 3.0),
            order: 2,
            externCode: '2',
          },
        ],
      }
  }
}

// Function to generate markets
function generateMarkets() {
  const marketCodes = ['67', '68', '73', '79']
  const marketNames = [
    'Esito finale 1X2',
    'Doppia Chance',
    'Gol no gol',
    'Under/Over 2.5',
  ]
  const externCodes = ['45', '0', '50', '56']

  return marketCodes.map((code, index) => {
    return {
      selections: [generateSelections(code)],
      name: marketNames[index],
      code: code,
      externCode: externCodes[index],
      margin: Math.random() * 0.3 + 1.1, // Full precision
      marginSpecified: true,
    }
  })
}

// Function to generate a single event
function generateEvent(eventIndex, groupId) {
  // Generate event ID based on groupId and eventIndex
  const eventId = 60000 + groupId * 100 + eventIndex

  // Generate start time (between now and 1 year from now)
  // Use a fixed date format: YYYY-MM-DDThh:mm:ssZ
  const now = new Date('2025-06-05T10:00:00Z') // Use a fixed start date to ensure consistency
  const oneYearLater = new Date('2026-06-05T10:00:00Z')

  // Generate a random date but ensure it has whole minutes (no milliseconds)
  const randomEventDate = randomDate(now, oneYearLater)
  randomEventDate.setSeconds(0)
  randomEventDate.setMilliseconds(0)

  const startTime = formatDate(randomEventDate)

  // Generate event name from team names that will be created later
  const teamCodeIndex1 = (groupId + eventIndex) % teamCodes.length
  const teamCodeIndex2 = (groupId + eventIndex + 1) % teamCodes.length
  const team1Name = teamCodes[teamCodeIndex1]
  const team2Name = teamCodes[teamCodeIndex2]

  return {
    eventIdentity: {
      eventId: eventId,
      scheduleId: 1,
      scheduleIdSpecified: true,
      scheduleUUID: `01H45RT38V3ZE1P9T603X9R${groupId}${eventIndex}`,
      eventName: `${team1Name} v ${team2Name}`,
      startTime: startTime,
      eventType: 'Football',
      externEventIdSpecified: false,
      externOfferIdSpecified: false,
      displayCode: `${groupId}${eventIndex}`,
      groupId: groupId,
      groupIdSpecified: true,
      eventStatus: 'Scheduled',
      scheduleType: 'Trident',
      scheduleSubType: 'Football7',
      roundIdSpecified: false,
      parentGroupIdSpecified: false,
    },
    teams: {
      team: [
        generateTeam(true, 0, groupId, eventIndex),
        generateTeam(false, 1, groupId, eventIndex),
      ],
    },
    racer: {
      racer: [],
    },
    markets: {
      market: generateMarkets(),
    },
  }
}

// Generate all events
function generateAllEvents() {
  const events = []

  // Generate 10 events for each of the 40 groupIds (starting from 9)
  for (let groupId = 9; groupId < 49; groupId++) {
    for (let eventIndex = 0; eventIndex < 10; eventIndex++) {
      events.push(generateEvent(eventIndex, groupId))
    }
  }

  return { events }
}

// Main execution
const outputData = generateAllEvents()
const outputPath = path.join(__dirname, '..', 'data', 'generated-events.json')

// Ensure the directory exists
const dir = path.dirname(outputPath)
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true })
}

// Write the data to file
fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf8')

console.log(
  `Generated ${outputData.events.length} events and saved to ${outputPath}`,
)
