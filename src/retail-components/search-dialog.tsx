'use client'

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/retail-components/ui/dialog'
import { RootContext } from '@/retail-contexts/root-context'
import { RoundResults } from '@/retail-lib/types'
import { isSameDay } from 'date-fns'
import { SearchIcon } from 'lucide-react'
import { useContext, useState } from 'react'
import { Button } from './ui/button'
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

const timeSlot = [
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

export default function SearchDialog(props: {
  setSearchRoundResults: (results: RoundResults[]) => void
}) {
  const [selectedDate, setSelectedDate] = useState<string | undefined>()
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | undefined>()
  const { roundResults } = useContext(RootContext)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="navbarSelected"
          className="relative h-12 w-full cursor-pointer justify-center"
        >
          <span className="text-md font-light">Cerca Ultimi Risultati</span>
          <SearchIcon className="absolute right-4" style={{ scale: 1.5 }} />
        </Button>
      </DialogTrigger>

      <DialogContent className="min-h-[500px] max-w-xl">
        <DialogHeader className="h-16 bg-accent">
          <DialogTitle className="text-center text-[19px] font-bold text-accent-foreground">
            Cerca Risultati
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 flex-row gap-4 overflow-auto p-4">
          <Select onValueChange={setSelectedDate} defaultValue={selectedDate}>
            <SelectTrigger>
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              {dates.map((date) => (
                <SelectItem key={date} value={date}>
                  {date}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            onValueChange={setSelectedTimeSlot}
            defaultValue={selectedTimeSlot}
          >
            <SelectTrigger>
              <SelectValue placeholder="Time Slot" />
            </SelectTrigger>
            <SelectContent>
              {timeSlot.map((slot) => (
                <SelectItem key={slot} value={slot}>
                  {slot}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter className="flex w-full flex-row items-center justify-between p-4">
          <DialogClose asChild>
            <Button className="w-24 bg-gray-500 text-[19px] text-background hover:bg-gray-600">
              Cancella
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              className="w-24 bg-green-500 text-[19px] text-white hover:bg-green-600"
              disabled={!selectedDate}
              onClick={() => {
                if (!selectedDate) return

                props.setSearchRoundResults(
                  roundResults.filter((r) => {
                    const dateMatches = isSameDay(
                      r.startTime,
                      new Date(selectedDate),
                    )

                    if (!selectedTimeSlot) return dateMatches

                    const [startTimeStr, endTimeStr] =
                      selectedTimeSlot.split(' | ')
                    const [startHours, startMinutes] = startTimeStr
                      .split(':')
                      .map(Number)
                    const [endHours, endMinutes] = endTimeStr
                      .split(':')
                      .map(Number)

                    const hours = r.startTime.getHours()
                    const minutes = r.startTime.getMinutes()

                    const timeInMinutes = hours * 60 + minutes
                    const startInMinutes = startHours * 60 + startMinutes
                    const endInMinutes = endHours * 60 + endMinutes

                    const timeInRange =
                      timeInMinutes >= startInMinutes &&
                      timeInMinutes <= endInMinutes

                    return dateMatches && timeInRange
                  }),
                )
              }}
            >
              Cerca
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
