import { Discipline, EventResult } from '@/retail-lib/types'
import { format, isSameDay } from 'date-fns'
import { ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader } from './ui/card'
import { ScrollArea } from './ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

const dates = Array.from({ length: 10 }, (_, index) => {
  const date = new Date()
  date.setDate(date.getDate() - index)
  return date.toLocaleDateString('it-IT')
})

const timeSlots = [
  '00:00 | 03:00',
  '03:00 | 07:00',
  '07:00 | 09:00',
  '09:00 | 11:00',
  '11:00 | 13:00',
  '13:00 | 15:00',
  '15:00 | 17:00',
  '17:00 | 19:00',
  '19:00 | 21:00',
  '21:00 | 23:59',
]

export default function SearchEventResults(props: {
  eventResults: EventResult[]
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [selectedDiscipline, setSelectedDiscipline] = useState<
    Discipline | 'ALL'
  >('ALL')
  const [selectedDate, setSelectedDate] = useState<string>('ALL')
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('ALL')
  const eventResults = useMemo(() => {
    const filtereResults = props.eventResults.filter((result) => {
      if (
        selectedDiscipline !== 'ALL' &&
        result.discipline?.toLowerCase() !== selectedDiscipline.toLowerCase()
      ) {
        return false
      }
      if (
        selectedDate !== 'ALL' &&
        !isSameDay(result.startTime, new Date(selectedDate))
      )
        return false
      if (selectedTimeSlot !== 'ALL') {
        const [startTimeStr, endTimeStr] = selectedTimeSlot.split(' | ')
        const [startHours, startMinutes] = startTimeStr.split(':').map(Number)
        const [endHours, endMinutes] = endTimeStr.split(':').map(Number)
        const hours = result.startTime.getHours()
        const minutes = result.startTime.getMinutes()
        const timeInMinutes = hours * 60 + minutes
        const startInMinutes = startHours * 60 + startMinutes
        const endInMinutes = endHours * 60 + endMinutes
        if (timeInMinutes < startInMinutes || timeInMinutes > endInMinutes)
          return false
      }
      return true
    })
    return filtereResults
  }, [props.eventResults, selectedDiscipline, selectedDate, selectedTimeSlot])

  const handleReset = () => {
    setSelectedDiscipline('ALL')
    setSelectedDate('ALL')
    setSelectedTimeSlot('ALL')
  }

  return (
    <Card>
      <CardHeader className="flex flex-col items-center">
        <div className="flex flex-wrap items-center gap-8">
          <Select
            value={selectedDiscipline?.toString()}
            onValueChange={(value) =>
              setSelectedDiscipline(
                Discipline[value as keyof typeof Discipline],
              )
            }
          >
            <SelectTrigger className="w-[130px] bg-background text-[12px] text-foreground">
              <SelectValue placeholder={t('sport')} />
            </SelectTrigger>
            <SelectContent className="bg-white p-0">
              <SelectItem value="ALL">{t('all_sports')}</SelectItem>
              {Object.values(Discipline).map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedDate} onValueChange={setSelectedDate}>
            <SelectTrigger className="w-[130px] bg-background text-[12px] text-foreground">
              <SelectValue placeholder={t('date')} />
            </SelectTrigger>
            <SelectContent className="bg-white p-0">
              <SelectItem value="ALL">{t('all_date')}</SelectItem>
              {dates.map((date) => (
                <SelectItem key={date} value={date}>
                  {date}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedTimeSlot} onValueChange={setSelectedTimeSlot}>
            <SelectTrigger className="w-[130px] bg-background text-[12px] text-foreground">
              <SelectValue placeholder={t('time_slot')} />
            </SelectTrigger>
            <SelectContent className="bg-white p-0">
              <SelectItem value="ALL">{t('all_time_slot')}</SelectItem>
              {timeSlots.map((slot) => (
                <SelectItem key={slot} value={slot}>
                  {slot}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex flex-row items-center gap-2">
            <Button
              className="text-bold w-[80px] bg-tertiary text-[14px] text-tertiary-foreground hover:bg-tertiary/70"
              disabled={
                !selectedDate && !selectedDiscipline && !selectedTimeSlot
              }
              onClick={handleReset}
            >
              {t('reset')}
            </Button>

            <Button
              variant="outline"
              className="text-bold w-[80px] bg-muted text-[14px] text-muted-foreground hover:bg-muted/70"
              onClick={() => {
                handleReset()
                props.onClose()
              }}
            >
              {t('cancel')}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="h-full pt-4">
        {eventResults.length > 0 ? (
          <ScrollArea className="h-full">
            <Accordion type="multiple" className="space-y-4">
              {eventResults.map((eventResult) => {
                return (
                  <AccordionItem
                    key={eventResult.id}
                    value={eventResult.id.toString()}
                    className="gap-0"
                  >
                    <AccordionTrigger className="bg-accent p-2 text-base text-accent-foreground [&[data-state=open]>svg]:-rotate-90">
                      <div className="flex w-[600px] flex-row justify-between gap-2">
                        <div className="flex flex-row gap-2">
                          <span className="font-bold">
                            {format(eventResult.startTime, 'dd-MM-yyyy HH:mm')}{' '}
                            {eventResult.title}
                            {' / '}
                          </span>
                          <span>{eventResult.result.teams}</span>
                        </div>
                        <span className="font-bold">
                          {eventResult.result.score1} -{' '}
                          {eventResult.result.score2}
                        </span>
                      </div>
                      <ChevronRight className="h-6 w-6 shrink-0 transition-transform duration-200" />
                    </AccordionTrigger>
                    <AccordionContent>
                      <table className="w-full border-collapse bg-background text-center">
                        <tbody>
                          {/* 1X2 and DOUBLE CHANCE */}
                          <tr className="border-b-2 border-betSlip">
                            <td className="border-r-2 border-betSlip p-2 text-center">
                              <div className="font-bold">1X2</div>
                              <div>
                                {eventResult.result.odds?.oneXTwo
                                  ? `2 ${eventResult.result.odds.oneXTwo.odds.toFixed(2)}`
                                  : '2 1.95'}
                              </div>
                            </td>
                            <td className="p-2 text-center">
                              <div className="font-bold">DOUBLE CHANCE</div>
                              <div>
                                {eventResult.result.odds?.doubleChance
                                  ? `2 ${eventResult.result.odds.doubleChance.odds.toFixed(2)}`
                                  : '2 1.63'}
                              </div>
                            </td>
                          </tr>

                          {/* FIRST SCORER and SUM GOALS */}
                          <tr className="border-b-2 border-betSlip">
                            <td className="border-r-2 border-betSlip p-2 text-center">
                              <div className="font-bold">FIRST SCORER</div>
                              <div>
                                {eventResult.result.odds?.firstScorer
                                  ? `${eventResult.result.odds.firstScorer.teamLabel || 'TEAM 2'} ${eventResult.result.odds.firstScorer.odds.toFixed(2)}`
                                  : 'TEAM 2 2.05'}
                              </div>
                            </td>
                            <td className="p-2 text-center">
                              <div className="font-bold">SUM GOALS</div>
                              <div>
                                {eventResult.result.odds?.sumGoals
                                  ? `${eventResult.result.odds.sumGoals.value} ${eventResult.result.odds.sumGoals.odds.toFixed(2)}`
                                  : '2 1.63'}
                              </div>
                            </td>
                          </tr>

                          {/* GOAL / NO GOAL and RED CARD */}
                          <tr className="border-b-2 border-betSlip">
                            <td className="border-r-2 border-betSlip p-2 text-center">
                              <div className="font-bold">GOAL / NO GOAL</div>
                              <div>
                                {eventResult.result.odds?.goalNoGoal
                                  ? `${eventResult.result.odds.goalNoGoal.value} ${eventResult.result.odds.goalNoGoal.odds.toFixed(2)}`
                                  : '1 1.95'}
                              </div>
                            </td>
                            <td className="p-2 text-center">
                              <div className="font-bold">RED CARD</div>
                              <div>
                                {eventResult.result.odds?.redCard
                                  ? `${eventResult.result.odds.redCard.value} ${eventResult.result.odds.redCard.odds.toFixed(2)}`
                                  : 'Yes 2.95'}
                              </div>
                            </td>
                          </tr>

                          {/* WINNING COMBO & SCORES and EXACT NUMBER OF GOALS */}
                          <tr>
                            <td className="border-r-2 border-betSlip p-2 text-center">
                              <div className="font-bold">
                                WINNING COMBO & SCORES
                              </div>
                              <div>
                                {eventResult.result.odds?.winningCombo
                                  ? `${eventResult.result.odds.winningCombo.value} ${eventResult.result.odds.winningCombo.odds.toFixed(2)}`
                                  : '2+G 1.90'}
                              </div>
                            </td>
                            <td className="p-2 text-center">
                              <div className="font-bold">
                                EXACT NUMBER OF GOALS
                              </div>
                              <div>
                                {eventResult.result.odds?.exactGoals
                                  ? `${eventResult.result.odds.exactGoals.value} ${eventResult.result.odds.exactGoals.odds.toFixed(2)}`
                                  : '2 1.90'}
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          </ScrollArea>
        ) : (
          <div className="flex h-full flex-col items-center justify-center">
            {t('no_results_found')}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
