'use client'

import { Button } from '@/retail-components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/retail-components/ui/dialog'
import { ScrollArea } from '@/retail-components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/retail-components/ui/table'
import { cn } from '@/retail-lib/utils'
import { Menu } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const racingCodeListLeft = [
  { label: 'Vincente\nV [Selezione]', code: 'V' },
  { label: 'Piazzato 1° 2°\n2P [Selezione]', code: '2P' },
  { label: 'Podio 1° 2° 3°\n3P [Selezione]', code: '3P' },
  { label: 'Accoppiata in Ordine\nAO [Selezione]', code: 'AO' },
  { label: 'Accoppiata a Girare\nAX [Selezione]', code: 'AX' },
  { label: 'Trio in Ordine\nTO [Selezione]', code: 'TO' },
]

const racingCodeListRight = [
  
  { label: 'Trio a Girare\nTX [Selezione]', code: 'TX' },
  { label: 'Pari\nP', code: 'P' },
  { label: 'Dispari\nD', code: 'D' },
  { label: 'Under\nU', code: 'U' },
  { label: 'Over\nO', code: 'O' },
]

export default function RacingCodeList() {
  const { t } = useTranslation()
  const [singleColumn, setSingleColumn] = useState(false)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-32 bg-bet text-[16px] font-bold text-bet-foreground hover:bg-bet/70">
          {t('code_list')}
        </Button>
      </DialogTrigger>

      <DialogContent
        className={cn(
          'overflow-hidden p-0',
          singleColumn ? 'max-h-[500px] w-[320px]' : 'max-h-[600px] w-[600px]',
        )}
      >
        <DialogHeader className="relative flex items-center justify-center bg-accent py-4">
          <div className="absolute left-4 flex items-center gap-2">
            <Button
              variant={'ghost'}
              size="icon"
              onClick={() => setSingleColumn((prev) => !prev)}
            >
              {!singleColumn ? (
                <Menu className="text-accent-foreground" />
              ) : (
                <div className="flex flex-row">
                  <div className="flex w-2 flex-col overflow-hidden">
                    <Menu className="text-accent-foreground" />
                  </div>
                  <div className="flex w-2 flex-col overflow-hidden">
                    <Menu className="text-accent-foreground" />
                  </div>
                </div>
              )}
            </Button>
          </div>
          <DialogTitle className="text-[19px] font-bold text-accent-foreground">
            {t('code_list')}
          </DialogTitle>
        </DialogHeader>

        {singleColumn ? (
          <ScrollArea className="h-full overflow-auto">
            <Table>
              <TableBody>
                {[...racingCodeListLeft, ...racingCodeListRight].map(
                  (item, index) => (
                    <TableRow key={index} className="border-b border-border">
                      <TableCell className="whitespace-pre-wrap text-[16px] font-medium">
                        {item.label}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="ml-auto flex h-8 w-8 items-center justify-center bg-bet font-bold text-bet-foreground">
                          {item.code}
                        </div>
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        ) : (
          <div className="grid grid-cols-2 divide-x">
            <Table>
              <TableBody>
                {racingCodeListLeft.map((item, index) => (
                  <TableRow key={index} className="border-b border-border">
                    <TableCell className="whitespace-pre-wrap text-[16px] font-medium">
                      {item.label}
                    </TableCell>
                    <TableCell>
                      <div className="ml-auto flex h-8 w-8 items-center justify-center bg-bet font-bold text-bet-foreground">
                        {item.code}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Table className="border-b border-border">
              <TableBody>
                {racingCodeListRight.map((item, index) => (
                  <TableRow key={index} className="border-b border-border">
                    <TableCell className="whitespace-pre-wrap text-[16px] font-medium">
                      {item.label}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="ml-auto flex h-8 w-8 items-center justify-center bg-bet font-bold text-bet-foreground">
                        {item.code}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
