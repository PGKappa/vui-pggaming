/**
 * Script to generate events data with 10 events per groupId and 40 unique groupIds
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Get current file path in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Function to generate random date between two dates (not used in current implementation)
// Kept for potential future use
/* 
function randomDate(start, end) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  )
}
*/

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


// Function to generate markets
function generateMarkets() {
  // Define all markets from the example
  const marketDefinitions = [
    {
      code: '67',
      name: 'Esito finale 1X2',
      externCode: '45',
      selections: [
        { outcome: '1', order: 1, externCode: '1' },
        { outcome: 'X', order: 2, externCode: '2' },
        { outcome: '2', order: 3, externCode: '3' }
      ]
    },
    {
      code: '68',
      name: 'Doppia Chance',
      externCode: '0',
      selections: [
        { outcome: '1X', order: 1, externCode: '1' },
        { outcome: 'X2', order: 2, externCode: '2' },
        { outcome: '12', order: 3, externCode: '3' }
      ]
    },
    {
      code: '69',
      name: 'Risultato esatto',
      externCode: '46',
      selections: [
        { outcome: '0-0', order: 1, externCode: '1' },
        { outcome: '0-1', order: 2, externCode: '2' },
        { outcome: '0-2', order: 3, externCode: '3' },
        { outcome: '0-3', order: 4, externCode: '4' },
        { outcome: '0-4', order: 5, externCode: '5' },
        { outcome: '0-5', order: 6, externCode: '6' },
        { outcome: '0-6', order: 7, externCode: '7' },
        { outcome: '0-7', order: 8, externCode: '8' },
        { outcome: '1-0', order: 9, externCode: '9' },
        { outcome: '1-1', order: 10, externCode: '10' },
        { outcome: '1-2', order: 11, externCode: '11' },
        { outcome: '1-3', order: 12, externCode: '12' },
        { outcome: '1-4', order: 13, externCode: '13' },
        { outcome: '1-5', order: 14, externCode: '14' },
        { outcome: '1-6', order: 15, externCode: '15' },
        { outcome: '2-0', order: 16, externCode: '16' },
        { outcome: '2-1', order: 17, externCode: '17' },
        { outcome: '2-2', order: 18, externCode: '18' },
        { outcome: '2-3', order: 19, externCode: '19' },
        { outcome: '2-4', order: 20, externCode: '20' },
        { outcome: '2-5', order: 21, externCode: '21' },
        { outcome: '3-0', order: 22, externCode: '22' },
        { outcome: '3-1', order: 23, externCode: '23' },
        { outcome: '3-2', order: 24, externCode: '24' },
        { outcome: '3-3', order: 25, externCode: '25' },
        { outcome: '3-4', order: 26, externCode: '26' },
        { outcome: '4-0', order: 27, externCode: '27' },
        { outcome: '4-1', order: 28, externCode: '28' },
        { outcome: '4-2', order: 29, externCode: '29' },
        { outcome: '4-3', order: 30, externCode: '30' },
        { outcome: '5-0', order: 31, externCode: '31' },
        { outcome: '5-1', order: 32, externCode: '32' },
        { outcome: '5-2', order: 33, externCode: '33' },
        { outcome: '6-0', order: 34, externCode: '34' },
        { outcome: '6-1', order: 35, externCode: '35' },
        { outcome: '7-0', order: 36, externCode: '36' }
      ]
    },
    {
      code: '70',
      name: 'Parziale/Finale',
      externCode: '47',
      selections: [
        { outcome: '11', order: 1, externCode: '1' },
        { outcome: 'X1', order: 2, externCode: '2' },
        { outcome: '21', order: 3, externCode: '3' },
        { outcome: '1X', order: 4, externCode: '4' },
        { outcome: 'XX', order: 5, externCode: '5' },
        { outcome: '2X', order: 6, externCode: '6' },
        { outcome: '12', order: 7, externCode: '7' },
        { outcome: 'X2', order: 8, externCode: '8' },
        { outcome: '22', order: 9, externCode: '9' }
      ]
    },
    {
      code: '71',
      name: 'Primo marcatore',
      externCode: '48',
      selections: [
        { outcome: 'NG', order: 4, externCode: '7' },
        { outcome: '11', order: 5, externCode: '1', extraInfo: 'FOD' },
        { outcome: '12', order: 6, externCode: '2', extraInfo: 'HAA' },
        { outcome: '13', order: 7, externCode: '3', extraInfo: 'GRE' },
        { outcome: '21', order: 8, externCode: '4', extraInfo: 'ZAH' },
        { outcome: '22', order: 9, externCode: '5', extraInfo: 'EDO' },
        { outcome: '23', order: 10, externCode: '6', extraInfo: 'EZE' }
      ]
    },
    {
      code: '73',
      name: 'Gol no gol',
      externCode: '50',
      selections: [
        { outcome: 'G', order: 1, externCode: '1' },
        { outcome: 'NG', order: 2, externCode: '2' }
      ]
    },
    {
      code: '74',
      name: 'Cartellino Rosso ',
      externCode: '51',
      selections: [
        { outcome: 'Yes', order: 1, externCode: '1' },
        { outcome: 'No', order: 2, externCode: '2' }
      ]
    },
    {
      code: '75',
      name: 'Somma gol',
      externCode: '52',
      selections: [
        { outcome: '0-1', order: 1, externCode: '1' },
        { outcome: '2-3', order: 2, externCode: '2' },
        { outcome: '4+', order: 3, externCode: '3' }
      ]
    },
    {
      code: '76',
      name: 'Somma gol Casa',
      externCode: '53',
      selections: [
        { outcome: '0', order: 1, externCode: '1' },
        { outcome: '1-2', order: 2, externCode: '2' },
        { outcome: '3+', order: 3, externCode: '3' }
      ]
    },
    {
      code: '77',
      name: 'Somma gol Trasferta',
      externCode: '54',
      selections: [
        { outcome: '0', order: 1, externCode: '1' },
        { outcome: '1-2', order: 2, externCode: '2' },
        { outcome: '3+', order: 3, externCode: '3' }
      ]
    },
    {
      code: '78',
      name: 'Under/Over 1.5',
      externCode: '55',
      selections: [
        { outcome: 'U', order: 1, externCode: '1' },
        { outcome: 'O', order: 2, externCode: '2' }
      ]
    },
    {
      code: '79',
      name: 'Under/Over 2.5 ',
      externCode: '56',
      selections: [
        { outcome: 'U', order: 1, externCode: '1' },
        { outcome: 'O', order: 2, externCode: '2' }
      ]
    },
    {
      code: '80',
      name: 'Under/Over 3.5',
      externCode: '57',
      selections: [
        { outcome: 'U', order: 1, externCode: '1' },
        { outcome: 'O', order: 2, externCode: '2' }
      ]
    },
    {
      code: '81',
      name: 'Under/Over 4.5',
      externCode: '0',
      selections: [
        { outcome: 'U', order: 1, externCode: '1' },
        { outcome: 'O', order: 2, externCode: '2' }
      ]
    },
    {
      code: '82',
      name: 'Combo Vincente & Segna',
      externCode: '59',
      selections: [
        { outcome: '1+G', order: 1, externCode: '1' },
        { outcome: 'X+G', order: 2, externCode: '2' },
        { outcome: '2+G', order: 3, externCode: '3' },
        { outcome: '1+NG', order: 4, externCode: '4' },
        { outcome: 'X+NG', order: 5, externCode: '5' },
        { outcome: '2+NG', order: 6, externCode: '6' }
      ]
    },
    {
      code: '83',
      name: 'Combo Vincente & Goals (1.5)',
      externCode: '60',
      selections: [
        { outcome: '1+U', order: 1, externCode: '1' },
        { outcome: 'X+U', order: 2, externCode: '2' },
        { outcome: '2+U', order: 3, externCode: '3' },
        { outcome: '1+O', order: 4, externCode: '4' },
        { outcome: 'X+O', order: 5, externCode: '5' },
        { outcome: '2+O', order: 6, externCode: '6' }
      ]
    },
    {
      code: '84',
      name: 'Combo Vincente & Goals (2.5)',
      externCode: '61',
      selections: [
        { outcome: '1+U', order: 1, externCode: '1' },
        { outcome: 'X+U', order: 2, externCode: '2' },
        { outcome: '2+U', order: 3, externCode: '3' },
        { outcome: '1+O', order: 4, externCode: '4' },
        { outcome: 'X+O', order: 5, externCode: '5' },
        { outcome: '2+O', order: 6, externCode: '6' }
      ]
    },
    {
      code: '300',
      name: 'Casa Under/Over 0.5',
      externCode: '68',
      selections: [
        { outcome: 'U', order: 1, externCode: '1' },
        { outcome: 'O', order: 2, externCode: '2' }
      ]
    },
    {
      code: '301',
      name: 'Casa Under/Over 1.5',
      externCode: '69',
      selections: [
        { outcome: 'U', order: 1, externCode: '1' },
        { outcome: 'O', order: 2, externCode: '2' }
      ]
    },
    {
      code: '302',
      name: 'Casa Under/Over 2.5',
      externCode: '70',
      selections: [
        { outcome: 'U', order: 1, externCode: '1' },
        { outcome: 'O', order: 2, externCode: '2' }
      ]
    },
    {
      code: '303',
      name: 'Trasferta Under/Over 0.5',
      externCode: '71',
      selections: [
        { outcome: 'U', order: 1, externCode: '1' },
        { outcome: 'O', order: 2, externCode: '2' }
      ]
    },
    {
      code: '304',
      name: 'Trasferta Under/Over 1.5',
      externCode: '72',
      selections: [
        { outcome: 'U', order: 1, externCode: '1' },
        { outcome: 'O', order: 2, externCode: '2' }
      ]
    },
    {
      code: '305',
      name: 'Trasferta Under/Over 2.5',
      externCode: '73',
      selections: [
        { outcome: 'U', order: 1, externCode: '1' },
        { outcome: 'O', order: 2, externCode: '2' }
      ]
    },
    {
      code: '72',
      name: 'Esatto numero di goal',
      externCode: '74',
      selections: [
        { outcome: '0', order: 1, externCode: '1' },
        { outcome: '1', order: 2, externCode: '2' },
        { outcome: '2', order: 3, externCode: '3' },
        { outcome: '3', order: 4, externCode: '4' },
        { outcome: '4', order: 5, externCode: '5' },
        { outcome: '5', order: 6, externCode: '6' },
        { outcome: '6+', order: 7, externCode: '7' }
      ]
    }
  ]

  return marketDefinitions.map(market => {
    return {
      selections: [
        {
          selection: market.selections.map(sel => ({
            outcome: sel.outcome,
            decPrice: generateRandomPrice(
              market.code === '67' ? 1.5 : 1.2,
              market.code === '67' ? 4.5 : 2.5
            ),
            order: sel.order,
            externCode: sel.externCode
          }))
        }
      ],
      name: market.name,
      code: market.code,
      externCode: market.externCode,
      margin: Math.random() * 0.3 + 1.1, // Full precision
      marginSpecified: true,
    }
  })
}

// Function to generate a single event
function generateEvent(eventIndex, groupId) {
  // Generate event ID based on groupId and eventIndex
  const eventId = 60000 + groupId * 100 + eventIndex

  // Generate start time based on groupId (each group is 3 minutes apart)
  // Use a fixed date format: YYYY-MM-DDThh:mm:ssZ
  const baseDate = new Date('2025-06-05T10:00:00Z') // Use a fixed start date
  
  // Calculate the group's start time: base time + (groupId - 9) * 3 minutes
  const groupDate = new Date(baseDate.getTime() + ((groupId - 9) * 3 * 60 * 1000))
  groupDate.setSeconds(0)
  groupDate.setMilliseconds(0)
  
  const startTime = formatDate(groupDate)

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
