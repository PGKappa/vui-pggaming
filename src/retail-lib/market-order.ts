// Ordine dei mercati nel dettaglio partita: segue l'ordine grafico dei TAB
// (Principali, Under/Over, Risultato Esatto, Combo, Multi Goal,
// Casa/Trasferta, Parziale/Finale, Speciale). Ogni voce elenca i nomi
// equivalenti (feed italiano e legacy inglese); i mercati non in lista
// finiscono in coda mantenendo l'ordine del feed.
export const DETAIL_MARKET_ORDER: string[][] = [
  // Principali
  ['1x2', 'esito finale 1x2'],
  ['double chance', 'doppia chance'],
  ['gol no gol'],
  ['under/over 2.5'],
  // Under/Over
  ['under/over 1.5'],
  ['under/over 3.5'],
  ['under/over 4.5'],
  // Risultato Esatto
  ['correct score', 'risultato esatto'],
  // Combo
  ['combo 1x2 + goal/no goal', 'combo vincente & segna'],
  ['combo 1x2 + under/over (1.5)', 'combo vincente & goals (1.5)'],
  ['combo 1x2 + under/over (2.5)', 'combo vincente & goals (2.5)'],
  ['combo dc & segna'],
  ['combo dc & goals 1.5'],
  ['combo dc & goals 2.5'],
  // Multi Goal
  ['multigoal', 'somma gol'],
  ['multigoal home', 'somma gol casa'],
  ['multigoal away', 'somma gol trasferta'],
  // Casa/Trasferta
  ['home under/over 0.5', 'casa under/over 0.5'],
  ['home under/over 1.5', 'casa under/over 1.5'],
  ['home under/over 2.5', 'casa under/over 2.5'],
  ['away under/over 0.5', 'trasferta under/over 0.5'],
  ['away under/over 1.5', 'trasferta under/over 1.5'],
  ['away under/over 2.5', 'trasferta under/over 2.5'],
  // Parziale/Finale
  ['half time/ full time', 'parziale/finale'],
  // Speciale
  ['first scorer', 'primo marcatore'],
  ['red card', 'cartellino rosso'],
  ['margine di vittoria'],
  // fuori dai tab
  ['exact number of goals', 'numero esatto goal'],
]

export function detailMarketPriority(name: string): number {
  const n = name.trim().toLowerCase()
  const idx = DETAIL_MARKET_ORDER.findIndex((aliases) => aliases.includes(n))
  return idx === -1 ? DETAIL_MARKET_ORDER.length : idx
}
