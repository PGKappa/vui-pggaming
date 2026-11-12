import { PreviousChannelResult } from '@/virtual-lib/types'
import { getRacerColors } from '@/virtual-lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type PreviousResultsCardProps = {
  /** undefined finché i dati non sono arrivati */
  results?: PreviousChannelResult
  discipline: 'DOGS' | 'DOGS8' | 'HORSES'
}

const GRID = '56px 52px 1fr'
// risultati visibili senza scroll a pannello chiuso
const VISIBLE_RESULTS = 7

// altezze minime di riga (px): numero 24 + nome 14 + spazi
const ROW_WITH_NAME = 44
const ROW_WITH_BADGE = 28

export default function PreviousResultsCard({
  results,
  discipline,
}: PreviousResultsCardProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const [rowHeight, setRowHeight] = useState<number>()
  const canExpand = (results?.length ?? 0) > VISIBLE_RESULTS
  const isOpen = expanded && canExpand
  const visibleResults = isOpen ? results : results?.slice(0, VISIBLE_RESULTS)
  // a risoluzioni basse il video è più basso e le righe non contengono
  // numero + nome: sotto questa altezza si mostra solo il numero (nome nel
  // tooltip), e sotto la seconda anche il numero si rimpicciolisce
  const showNames = !rowHeight || rowHeight >= ROW_WITH_NAME
  const smallBadge = !!rowHeight && rowHeight < ROW_WITH_BADGE

  // l'altezza della sezione è fissa (la decide il video): ogni riga occupa
  // 1/7 dello spazio, così chiuso ne entrano 7 e aperto si scorre il resto
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const update = () =>
      setRowHeight(Math.floor(list.clientHeight / VISIBLE_RESULTS) || undefined)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(list)
    return () => observer.disconnect()
  }, [])

  // chiudendo si torna in cima, sugli ultimi 7
  useEffect(() => {
    if (!isOpen) listRef.current?.scrollTo({ top: 0 })
  }, [isOpen])

  return (
    <Card className="flex h-full flex-col overflow-hidden shadow-sm">
      <CardHeader className="h-12 shrink-0 justify-center space-y-0 p-0">
        <button
          type="button"
          disabled={!canExpand}
          aria-expanded={isOpen}
          onClick={() => setExpanded((open) => !open)}
          className="relative flex h-full w-full items-center justify-center px-3 disabled:cursor-default"
        >
          <CardTitle className="text-center text-md font-bold uppercase tracking-wide">
            {t('latest_results')}
          </CardTitle>
          {canExpand && (
            <ChevronDown
              className={`absolute right-3 size-5 transition-transform ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          )}
        </button>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col p-0">
        <div
          className="grid shrink-0 items-center border-b border-border bg-muted px-2 py-2 text-center text-[11px] font-bold uppercase text-muted-foreground"
          style={{ gridTemplateColumns: GRID }}
        >
          <span>{t('time')}</span>
          <span>{t('id')}</span>
          <span>{t('arrival')} 1°-2°-3°</span>
        </div>

        <div
          ref={listRef}
          className={`flex min-h-0 flex-1 flex-col ${
            isOpen ? 'thin-scrollbar overflow-y-auto' : 'overflow-hidden'
          }`}
        >
          {!results || results.length === 0 ? (
            <div className="flex h-full min-h-24 items-center justify-center px-3 text-center text-sm text-muted-foreground">
              {results ? t('no_results_available') : `${t('loading')}...`}
            </div>
          ) : null}
          {visibleResults?.map((result, rowIdx) => (
            <div
              key={`${result.ext_pal_id}-${result.ext_event_id}`}
              className={`grid shrink-0 items-center overflow-hidden border-b border-border px-2 py-0.5 ${
                rowIdx % 2 === 1 ? 'bg-muted/50' : ''
              }`}
              style={{ gridTemplateColumns: GRID, height: rowHeight }}
            >
              <div className="text-center text-sm font-bold tabular-nums">
                {result.start_time}
              </div>
              <div className="text-center text-sm tabular-nums text-muted-foreground">
                {result.ext_event_id}
              </div>
              <div className="grid grid-cols-3 gap-1">
                {result.arrival.slice(0, 3).map((competitor, index) => (
                  <div
                    key={`${competitor.number}-${index}`}
                    className="flex min-w-0 flex-col items-center gap-0.5"
                    title={competitor.name}
                  >
                    <div
                      className={`flex items-center justify-center rounded-sm pt-0.5 font-bold tabular-nums leading-none ${
                        smallBadge ? 'size-5 text-sm' : 'size-6 text-base'
                      }`}
                      style={
                        getRacerColors(competitor.number, discipline).style
                      }
                    >
                      {competitor.number}
                    </div>
                    {showNames && (
                      <div className="w-full truncate text-center text-[11px] leading-tight">
                        {competitor.name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
