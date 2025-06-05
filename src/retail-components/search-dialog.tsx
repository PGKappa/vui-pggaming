'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/retail-components/ui/accordion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/retail-components/ui/dialog'
import { cn } from '@/retail-lib/utils'
import { SearchIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from './ui/button'

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

      <DialogContent className="flex min-h-[480px] max-w-xl flex-col justify-between">
        <DialogHeader className="h-16 bg-accent">
          <DialogTitle className="text-center text-[19px] font-bold text-accent-foreground">
            Search Results
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 flex-row gap-4 overflow-auto p-4">
          <Accordion type="multiple" className="w-1/2 space-y-2">
            <AccordionItem value="date">
              <AccordionTrigger className="bg-background text-[16px] font-semibold">
                Date
              </AccordionTrigger>
              <AccordionContent className="max-h-60 overflow-y-auto">
                <ul className="flex flex-col gap-2">
                  {dates.map((date) => (
                    <li
                      key={date}
                      className={cn(
                        'cursor-pointer p-2 hover:bg-muted',
                        selectedDate === date &&
                          'bg-muted text-muted-foreground',
                      )}
                      onClick={() =>
                        setSelectedDate((prev) =>
                          prev === date ? undefined : date,
                        )
                      }
                    >
                      {date}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Accordion type="multiple" className="w-1/2 space-y-2">
            <AccordionItem value="time">
              <AccordionTrigger className="bg-background text-[16px] font-semibold">
                Time Slot
              </AccordionTrigger>
              <AccordionContent className="max-h-60 overflow-y-auto">
                <ul className="flex flex-col gap-2">
                  {timeSlot.map((slot) => (
                    <li
                      key={slot}
                      className={cn(
                        'cursor-pointer p-2 hover:bg-muted',
                        selectedTimeSlot === slot &&
                          'bg-muted text-muted-foreground',
                      )}
                      onClick={() =>
                        setSelectedTimeSlot((prev) =>
                          prev === slot ? undefined : slot,
                        )
                      }
                    >
                      {slot}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <div className="m-4 flex justify-center">
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
