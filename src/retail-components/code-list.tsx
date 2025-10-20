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

const codeListLeft = [
  { label: 'result_final_1', code: '1' },
  { label: 'result_final_x', code: 'X' },
  { label: 'result_final_2', code: '2' },
  { label: 'double_chance_1x', code: '1X' },
  { label: 'double_chance_12', code: '12' },
  { label: 'double_chance_x2', code: 'X2' },
  { label: 'goal_goal', code: 'GG' },
  { label: 'no_goal', code: 'NG' },
  { label: 'under_25', code: 'U25' },
]

const codeListRight = [
  { label: 'over_25', code: '025' },
  { label: 'even_result', code: 'EV' },
  { label: 'odd_result', code: 'OD' },
  { label: 'first_half_1', code: '1T1' },
  { label: 'first_half_2', code: '1T2' },
  { label: 'first_half_x', code: '1TX' },
  { label: 'multigoal_home_1plus', code: '1+' },
  { label: 'multigoal_away_2plus', code: '2+' },
]

export default function CodeList(props?: {
  onDirectBet?: (code: string) => void
}) {
  const { t } = useTranslation()
  const [singleColumn, setSingleColumn] = useState(false)
  const [open, setOpen] = useState(false)

  const handleCodeClick = (code: string) => {
    props?.onDirectBet?.(code)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-32 bg-bet text-[16px] font-bold text-bet-foreground">
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
                {[...codeListLeft, ...codeListRight].map((item, index) => (
                  <TableRow key={index} className="border-b border-border">
                    <TableCell className="whitespace-pre-wrap text-[16px] font-medium">
                      {t(item.label)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div
                        className="ml-auto flex h-8 w-8 cursor-pointer items-center justify-center bg-bet font-bold text-bet-foreground transition-colors"
                        onClick={() => handleCodeClick(item.code)}
                      >
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
                    <TableCell className="whitespace-pre-wrap text-[16px] font-medium">
                      {t(item.label)}
                    </TableCell>
                    <TableCell>
                      <div
                        className="ml-auto flex h-8 w-8 cursor-pointer items-center justify-center bg-bet font-bold text-bet-foreground transition-colors"
                        onClick={() => handleCodeClick(item.code)}
                      >
                        {item.code}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Table className="border-b border-border">
              <TableBody>
                {codeListRight.map((item, index) => (
                  <TableRow key={index} className="border-b border-border">
                    <TableCell className="whitespace-pre-wrap text-[16px] font-medium">
                      {t(item.label)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div
                        className="ml-auto flex h-8 w-8 cursor-pointer items-center justify-center bg-bet font-bold text-bet-foreground transition-colors"
                        onClick={() => handleCodeClick(item.code)}
                      >
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
