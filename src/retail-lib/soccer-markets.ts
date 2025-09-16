export interface MarketConfig {
  marketName: string
  outcome: string
}

export const soccerMarkets: Record<string, MarketConfig> = {
  // 1X2 Market
  '1': { marketName: '1X2', outcome: '1' },
  X: { marketName: '1X2', outcome: 'X' },
  '2': { marketName: '1X2', outcome: '2' },

  // Double Chance
  '1X': { marketName: 'Double Chance', outcome: '1X' },
  '12': { marketName: 'Double Chance', outcome: '12' },
  X2: { marketName: 'Double Chance', outcome: 'X2' },

  // Goal/No Goal
  GG: { marketName: 'Gol no gol', outcome: 'G' },
  NG: { marketName: 'Gol no gol', outcome: 'NG' },

  // Under/Over 1.5
  U1: { marketName: 'Under\/Over 1.5', outcome: 'U' },
  O1: { marketName: 'Under\/Over 1.5', outcome: 'O' },

  // Under/Over 2.5
  U2: { marketName: 'Under\/Over 2.5', outcome: 'U' },
  O2: { marketName: 'Under\/Over 2.5', outcome: 'O' },

  // Under/Over 3.5
  U3: { marketName: 'Under\/Over 3.5', outcome: 'U' },
  O3: { marketName: 'Under\/Over 3.5', outcome: 'O' },

  // Under/Over 4.5
  U4: { marketName: 'Under\/Over 4.5', outcome: 'U' },
  O4: { marketName: 'Under\/Over 4.5', outcome: 'O' },

  // Correct Score - Row 0
  S00: { marketName: 'Correct Score', outcome: '0-0' },
  S01: { marketName: 'Correct Score', outcome: '0-1' },
  S02: { marketName: 'Correct Score', outcome: '0-2' },
  S03: { marketName: 'Correct Score', outcome: '0-3' },
  S04: { marketName: 'Correct Score', outcome: '0-4' },
  S05: { marketName: 'Correct Score', outcome: '0-5' },
  S06: { marketName: 'Correct Score', outcome: '0-6' },
  S07: { marketName: 'Correct Score', outcome: '0-7' },

  // Correct Score - Row 1
  S10: { marketName: 'Correct Score', outcome: '1-0' },
  S11: { marketName: 'Correct Score', outcome: '1-1' },
  S12: { marketName: 'Correct Score', outcome: '1-2' },
  S13: { marketName: 'Correct Score', outcome: '1-3' },
  S14: { marketName: 'Correct Score', outcome: '1-4' },
  S15: { marketName: 'Correct Score', outcome: '1-5' },
  S16: { marketName: 'Correct Score', outcome: '1-6' },

  // Correct Score - Row 2
  S20: { marketName: 'Correct Score', outcome: '2-0' },
  S21: { marketName: 'Correct Score', outcome: '2-1' },
  S22: { marketName: 'Correct Score', outcome: '2-2' },
  S23: { marketName: 'Correct Score', outcome: '2-3' },
  S24: { marketName: 'Correct Score', outcome: '2-4' },
  S25: { marketName: 'Correct Score', outcome: '2-5' },

  // Correct Score - Row 3
  S30: { marketName: 'Correct Score', outcome: '3-0' },
  S31: { marketName: 'Correct Score', outcome: '3-1' },
  S32: { marketName: 'Correct Score', outcome: '3-2' },
  S33: { marketName: 'Correct Score', outcome: '3-3' },
  S34: { marketName: 'Correct Score', outcome: '3-4' },

  // Correct Score - Row 4
  S40: { marketName: 'Correct Score', outcome: '4-0' },
  S41: { marketName: 'Correct Score', outcome: '4-1' },
  S42: { marketName: 'Correct Score', outcome: '4-2' },
  S43: { marketName: 'Correct Score', outcome: '4-3' },

  // Correct Score - Row 5
  S50: { marketName: 'Correct Score', outcome: '5-0' },
  S51: { marketName: 'Correct Score', outcome: '5-1' },
  S52: { marketName: 'Correct Score', outcome: '5-2' },

  // Correct Score - Row 6+
  S60: { marketName: 'Correct Score', outcome: '6-0' },
  S61: { marketName: 'Correct Score', outcome: '6-1' },
  S70: { marketName: 'Correct Score', outcome: '7-0' },

  // 1X2 + GOAL/NO GOAL
  C1GG: { marketName: 'Combo 1x2 + Goal\/No Goal', outcome: '1+G' },
  C1NG: { marketName: 'Combo 1x2 + Goal\/No Goal', outcome: '1+NG' },
  CXGG: { marketName: 'Combo 1x2 + Goal\/No Goal', outcome: 'X+G' },
  CXNG: { marketName: 'Combo 1x2 + Goal\/No Goal', outcome: 'X+NG' },
  C2GG: { marketName: 'Combo 1x2 + Goal\/No Goal', outcome: '2+G' },
  C2NG: { marketName: 'Combo 1x2 + Goal\/No Goal', outcome: '2+NG' },

  // 1X2 + UNDER/OVER 1.5
  C1U0: { marketName: 'Combo 1x2 + Under\/Over (1.5)', outcome: '1+U' },
  CXU0: { marketName: 'Combo 1x2 + Under\/Over (1.5)', outcome: 'X+U' },
  C2U0: { marketName: 'Combo 1x2 + Under\/Over (1.5)', outcome: '2+U' },
  C1O0: { marketName: 'Combo 1x2 + Under\/Over (1.5)', outcome: '1+O' },
  CXO0: { marketName: 'Combo 1x2 + Under\/Over (1.5)', outcome: 'X+O' },
  C2O0: { marketName: 'Combo 1x2 + Under\/Over (1.5)', outcome: '2+O' },

  // 1X2 + UNDER/OVER 2.5
  C1U2: { marketName: 'Combo 1x2 + Under\/Over (2.5)', outcome: '1+U' },
  //... add other combo for this market

  // MULTIGOAL
  M01: { marketName: 'Multigoal', outcome: '0-1' },
  M23: { marketName: 'Multigoal', outcome: '2-3' },
  M4: { marketName: 'Multigoal', outcome: '4+' },

  // MULTIGOAL HOME
  HM0: { marketName: 'Multigoal Home', outcome: '0' },
  HM12: { marketName: 'Multigoal Home', outcome: '1-2' },
  HM3: { marketName: 'Multigoal Home', outcome: '3+' },

  // MULTIGOAL AWAY
  AM0: { marketName: 'Multigoal Away', outcome: '0' },
  AM12: { marketName: 'Multigoal Away', outcome: '1-2' },
  AM3: { marketName: 'Multigoal Away', outcome: '3+' },

  // HOME UNDER
  HU0: { marketName: 'Home Under\/Over 0.5', outcome: 'U' },
  HU1: { marketName: 'Home Under\/Over 1.5', outcome: 'U' },
  HU2: { marketName: 'Home Under\/Over 2.5', outcome: 'U' },

  // HOME OVER
  HO0: { marketName: 'Home Under\/Over 0.5', outcome: 'O' },
  HO1: { marketName: 'Home Under\/Over 1.5', outcome: 'O' },
  HO2: { marketName: 'Home Under\/Over 2.5', outcome: 'O' },

  // AWAY UNDER
  AU0: { marketName: 'Away Under\/Over 0.5', outcome: 'U' },
  AU1: { marketName: 'Away Under\/Over 1.5', outcome: 'U' },
  AU2: { marketName: 'Away Under\/Over 2.5', outcome: 'U' },

  // AWAY OVER
  AO0: { marketName: 'Away Under\/Over 0.5', outcome: 'O' },
  AO1: { marketName: 'Away Under\/Over 1.5', outcome: 'O' },
  AO2: { marketName: 'Away Under\/Over 2.5', outcome: 'O' },

  // HALF TIME / FULL TIME
  HFXX: { marketName: 'Half Time\/ Full Time', outcome: 'XX' },
  HFX1: { marketName: 'Half Time\/ Full Time', outcome: 'X1' },
  HFX2: { marketName: 'Half Time\/ Full Time', outcome: 'X2' },
  HF1X: { marketName: 'Half Time\/ Full Time', outcome: '1X' },
  HF11: { marketName: 'Half Time\/ Full Time', outcome: '11' },
  HF12: { marketName: 'Half Time\/ Full Time', outcome: '12' },
  HF2X: { marketName: 'Half Time\/ Full Time', outcome: '2X' },
  HF21: { marketName: 'Half Time\/ Full Time', outcome: '21' },
  HF22: { marketName: 'Half Time\/ Full Time', outcome: '22' },

  // FIRST SCORER
  FNG: { marketName: 'First Scorer', outcome: 'NG' },
  F11: { marketName: 'First Scorer', outcome: '11' },
  F12: { marketName: 'First Scorer', outcome: '12' },
  F13: { marketName: 'First Scorer', outcome: '13' },
  F21: { marketName: 'First Scorer', outcome: '21' },
  F22: { marketName: 'First Scorer', outcome: '22' },
  F23: { marketName: 'First Scorer', outcome: '23' },

  // RED CARD
  R1: { marketName: 'Red Card ', outcome: 'Yes' },
  R0: { marketName: 'Red Card ', outcome: 'No' },
}

// Helper function to get market config by code
export const getMarketConfig = (code: string): MarketConfig | undefined => {
  return soccerMarkets[code.toUpperCase()]
}

// Helper function to validate if a code exists
export const isValidMarketCode = (code: string): boolean => {
  return code.toUpperCase() in soccerMarkets
}

// Helper function to get all codes for a specific market
export const getCodesForMarket = (marketName: string): string[] => {
  return Object.entries(soccerMarkets)
    .filter(([, config]) => config.marketName === marketName)
    .map(([code]) => code)
}
