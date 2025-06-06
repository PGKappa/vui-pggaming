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
import { SearchIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from './ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

const dates = [
  '20/01/2023',
  '13/01/2023',
  '20/12/2022',
  '13/12/2022',
  '06/12/2022',
  '29/11/2022',
  '22/11/2022',
  '15/11/2022',
  '08/11/2022',
  '01/11/2022',
]

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

export default function SearchDialog() {
  const [selectedDate, setSelectedDate] = useState<string | undefined>()
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | undefined>()

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="navbarSelected"
          className="relative h-12 w-full cursor-pointer justify-center"
        >
          <span className="text-md font-light">Search Last Results</span>
          <SearchIcon className="absolute right-4" style={{ scale: 1.5 }} />
        </Button>
      </DialogTrigger>

      <DialogContent className="min-h-[500px] max-w-xl">
        <DialogHeader className="h-16 bg-accent">
          <DialogTitle className="text-center text-[19px] font-bold text-accent-foreground">
            Search Results
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
              Cancel
            </Button>
          </DialogClose>
          <Button
            className="w-24 bg-green-500 text-[19px] text-white hover:bg-green-600"
            disabled={!selectedDate || !selectedTimeSlot}
            onClick={() => {
              console.log(
                `Selected Date: ${selectedDate}, Selected Time Slot: ${selectedTimeSlot}`,
              )
            }}
          >
            Cerca
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
