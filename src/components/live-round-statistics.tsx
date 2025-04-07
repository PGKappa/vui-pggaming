'use client'
import { RootContext } from '@/contexts/root-context'
import { MatchStatistics } from '@/lib/types'
import { Locale, format } from 'date-fns'
import { enGB, itCH, zhCN } from 'date-fns/locale'
import { PlusIcon } from 'lucide-react'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import LoadingSpinner from './loading-spinner'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'

export default function LiveRoundStatistics(props: {
  onMatchSelect: (match: MatchStatistics) => void
}) {
  const { roundStatistics } = useContext(RootContext)
  const { t, i18n } = useTranslation()
  const currentLocale = getLocale(i18n.language)

  if (!roundStatistics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('live_round_loading')}...</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <LoadingSpinner />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t('statistics')} {roundStatistics.name} {t('round')}{' '}
          {roundStatistics.number}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader className="bg-card-header">
            <TableRow className="*:text-table-foreground border-card-foreground transition-none hover:bg-card-header">
              <TableHead></TableHead>
              <TableHead className="text-center font-bold">1</TableHead>
              <TableHead className="text-center font-bold">X</TableHead>
              <TableHead className="text-center font-bold">2</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="border-b border-t border-card-foreground">
            {roundStatistics.matches.map((match, index) => {
              const formattedTime = format(match.startTime, 'HH:mm', {
                locale: currentLocale,
              })
              return (
                <TableRow
                  key={index}
                  className="relative cursor-pointer border-card-foreground hover:bg-muted lg:cursor-default lg:hover:bg-transparent"
                >
                  <TableCell>
                    <div className="flex flex-row items-center gap-2">
                      <Badge>{formattedTime}</Badge>
                      <span className="text-nowrap font-bold">
                        {match.teams}
                      </span>
                    </div>
                  </TableCell>

                  {match.probabilities.map((probability, index) => (
                    <TableCell key={index} className="text-center font-bold">
                      {probability}%
                    </TableCell>
                  ))}

                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="hidden text-center lg:flex"
                      onClick={() => props.onMatchSelect(match)}
                    >
                      <PlusIcon className="h-4 w-4" />
                    </Button>

                    <div
                      className="absolute inset-0 h-full w-full lg:hidden"
                      onClick={() => props.onMatchSelect(match)}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
function getLocale(lang: string) {
  const locales: Record<string, Locale> = {
    en: enGB,
    it: itCH,
    cn: zhCN,
  }
  return locales[lang] || enGB
}
