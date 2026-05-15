import { UpcomingRace } from '@/virtual-lib/types'
import { getRacerColors } from '@/virtual-lib/utils'
import { t } from 'i18next'
import { Button } from './ui/button'
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
            className="flex h-8 w-8 items-center justify-center rounded text-xl font-bold"
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
      <DialogContent className="w-full max-w-xl bg-red-600 p-0">
        {/* Header */}
        <DialogHeader className="flex h-14 flex-row items-center justify-center bg-accent px-6 text-white">
          <DialogTitle className="text-center text-lg font-bold text-white">
            {t('latecomers')}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 text-white hover:bg-red-700"
          ></Button>
        </DialogHeader>

        {/* Content */}
        <div className="bg-white">
          {latecomersData.length > 0 ? (
            <Table>
              <TableHeader className="h-10 bg-gray-200 sm:h-12">
                <TableRow>
                  <TableHead className="w-1/3 border-r border-gray-300 text-center text-sm font-bold text-black sm:text-md">
                    {t('market')}
                  </TableHead>
                  <TableHead className="w-1/3 border-r border-gray-300 text-center text-sm font-bold text-black sm:text-md">
                    {t('result')}
                  </TableHead>
                  <TableHead className="w-1/3 text-center text-sm font-bold text-black sm:text-md">
                    {t('delay')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latecomersData.map((item, index) => (
                  <TableRow key={index} className="border-b border-gray-200">
                    <TableCell className="border-r border-gray-300 p-2 text-center text-sm font-medium text-black sm:p-4 sm:text-md">
                      {item.market}
                    </TableCell>
                    <TableCell className="border-r border-gray-300 p-2 sm:p-4">
                      <div className="flex flex-wrap justify-start gap-1 sm:gap-2">
                        {formatRacers(item.racers)}
                      </div>
                    </TableCell>
                    <TableCell className="p-2 text-center text-sm font-bold text-black sm:p-4 sm:text-md">
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
