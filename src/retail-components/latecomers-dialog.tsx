import { UpcomingRace } from '@/retail-lib/types'
import { getRacerColors } from '@/retail-lib/utils'
import { t } from 'i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'

type LatecomersDialogProps = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  raceInfo: UpcomingRace | undefined
  discipline: 'DOGS' | 'HORSES'
}

export default function LatecomersDialog({
  isOpen,
  onOpenChange,
  raceInfo,
  discipline,
}: LatecomersDialogProps) {
  const formatRacers = (racers: number[]) => {
    return racers.map((racerNumber) => {
      return (
        <div key={racerNumber} className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded text-[21px] tabular-nums font-semibold ${(() => {
              const colors = getRacerColors(racerNumber, discipline)
              return `${colors.bg} ${colors.text} ${colors.border}`
            })()}`}
            style={getRacerColors(racerNumber, discipline).style}
          >
            {racerNumber}
          </div>
        </div>
      )
    })
  }

  // Prepara i dati per la tabella
  const latecomersData: Array<{
    market: string
    racers: number[]
    delay: number
  }> = []

  if (raceInfo?.latecomers) {
    if (raceInfo.latecomers.winner?.racers?.length > 0) {
      latecomersData.push({
        market: t('winner'),
        racers: raceInfo.latecomers.winner.racers,
        delay: raceInfo.latecomers.winner.delay,
      })
    }

    if (raceInfo.latecomers.exacta?.racers?.length > 0) {
      latecomersData.push({
        market: t('exacta'),
        racers: raceInfo.latecomers.exacta.racers,
        delay: raceInfo.latecomers.exacta.delay,
      })
    }

    if (raceInfo.latecomers.trifecta?.racers?.length > 0) {
      latecomersData.push({
        market: t('trifecta'),
        racers: raceInfo.latecomers.trifecta.racers,
        delay: raceInfo.latecomers.trifecta.delay,
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-accent p-0">
        {/* Header */}
        <DialogHeader className="flex h-[64px] flex-row items-center justify-center bg-accent px-4 text-accent-foreground">
          <DialogTitle className="text-center text-[17px] font-semibold text-white">
            {t('latecomers').toUpperCase()}
          </DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="p-0">
          {latecomersData.length > 0 ? (
            <Table style={{ borderCollapse: 'collapse' }}>
              <TableHeader className="!h-16 bg-secondary text-secondary-foreground">
                <TableRow>
                  <TableHead className="w-1/3 border-r border-border text-center text-[16px] font-bold">
                    {t('market')}
                  </TableHead>
                  <TableHead className="w-1/3 border-r border-border text-center text-[16px] font-bold">
                    {t('result')}
                  </TableHead>
                  <TableHead className="w-1/3 text-center text-[16px] font-bold">
                    {t('delay')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latecomersData.map((item, index) => (
                  <TableRow key={index} className="border-b border-black">
                    <TableCell className="w-1/3 border-r border-border bg-white p-4 text-center text-[16px] font-medium">
                      {item.market}
                    </TableCell>
                    <TableCell className="w-1/3 border-r border-border bg-white p-4">
                      <div className="flex flex-wrap space-x-4 text-[16px] ml-[15px]">
                        {formatRacers(item.racers)}
                      </div>
                    </TableCell>
                    <TableCell className="w-1/3 bg-white p-4 text-center text-[18px] tabular-nums">
                      {item.delay}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="bg-white p-8 text-center text-muted-foreground">
              {raceInfo ? t('no_latecomers') : `${t('loading')}...`}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
