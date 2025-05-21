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

const codeListLeft = [
  { label: 'Esito Finale 1\n1 [Team Casa]', code: '1' },
  { label: 'Esito Finale X\nX', code: 'X' },
  { label: 'Esito Finale 2\n2 [Team Ospite]', code: '2' },
  { label: 'Doppia Chance 1X\n1X', code: '1X' },
  { label: 'Doppia Chance 12\n1 [Team Casa]', code: '12' },
  { label: 'Doppia Chance X2\n1 [Team Casa]', code: 'X2' },
  { label: 'Goal/Goal\nGG', code: 'GG' },
  { label: 'No Goal\nNG', code: 'NG' },
  { label: 'Under 2.5\nU25', code: 'U25' },
]

const codeListRight = [
  { label: 'Over 2.5\n025', code: '025' },
  { label: 'Even\nEV', code: 'EV' },
  { label: 'Odd\nOD', code: 'OD' },
  { label: 'Esito 1° Tempo = 1\n1T1', code: '1T1' },
  { label: 'Esito 1° Tempo = 2\n1T2', code: '1T2' },
  { label: 'Esito 1° Tempo = X\n1TX', code: '1TX' },
  { label: 'Multigoal Casa > 1\n1+', code: '1+' },
  { label: 'Multigoal Trasferta > 2\n2+', code: '2+' },
]

export default function CodeList() {
  const [singleColumn, setSingleColumn] = useState(false)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-32 bg-bet text-sm font-bold text-bet-foreground hover:bg-bet/70">
          Code List
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
                  <div className="flex flex-col w-2 overflow-hidden">
                    <Menu className="text-accent-foreground" />
                  </div>
                </div>
              )}
            </Button>
          </div>
          <DialogTitle className="text-lg font-bold text-accent-foreground">
            Code List
          </DialogTitle>
        </DialogHeader>

        {singleColumn ? (
          <ScrollArea className="h-full overflow-auto">
            <Table>
              <TableBody>
                {[...codeListLeft, ...codeListRight].map((item, index) => (
                  <TableRow key={index} className="border-b border-border">
                    <TableCell className="whitespace-pre-wrap text-sm font-medium">
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
          </ScrollArea>
        ) : (
          <div className="grid grid-cols-2 divide-x">
            <Table>
              <TableBody>
                {codeListLeft.map((item, index) => (
                  <TableRow key={index} className="border-b border-border">
                    <TableCell className="whitespace-pre-wrap text-sm font-medium">
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

            <Table>
              <TableBody>
                {codeListRight.map((item, index) => (
                  <TableRow key={index} className="border-b border-border">
                    <TableCell className="whitespace-pre-wrap text-sm font-medium">
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
