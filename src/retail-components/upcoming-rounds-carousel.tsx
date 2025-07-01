import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/retail-components/ui/carousel'
import { RootContext } from '@/retail-contexts/root-context'
import { UpcomingRound } from '@/retail-lib/types'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'

import Image from 'next/image'

export function UpcomingRoundsCarousel(props: {
  selectedRound?: UpcomingRound
  setSelectedRound: (round: UpcomingRound) => void
}) {
  const { upcomingRounds } = useContext(RootContext)

  const { t } = useTranslation()

  const formatStartTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Carousel className="w-[1400px]">
      <CarouselContent className="-ml-1">
        {upcomingRounds && upcomingRounds.length > 0 ? (
          upcomingRounds.map((round) => {
            const firstMatch = round.mag_event?.[0]
            if (!firstMatch) return null

            const startTime = formatStartTime(firstMatch.startTime)
            return (
              <CarouselItem
                key={round.scheduleId}
                className={`flex basis-1/6 cursor-pointer flex-row gap-3 justify-center items-center py-2 ${round.scheduleId === props.selectedRound?.scheduleId ? 'bg-tertiary text-tertiary-foreground' : 'hover:bg-trasparent bg-secondary text-secondary-foreground hover:text-accent-foreground'}`}
                onClick={() => {
                  props.setSelectedRound(round)
                }}
              >
                <div className="flex flex-col justify-between items-center h-12 w-12 bg-white py-0.5">
                  <Image
                    src="/soccer.svg"
                    alt="Horses"
                    width={40}
                    height={20}
                    className="size-6"
                  />
                  <span className="text-md font-bold text-black">{startTime}</span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-md font-bold">
                    {round.scheduleName} Round {round.scheduleId}
                  </span>
                  <div className="flex flex-row gap-2">
                    <span className="text-md italic">0:30</span>
                  </div>
                </div>
              </CarouselItem>
            )
          })
        ) : (
          <div className="p-4 text-center">{t('no_upcoming_rounds')}</div>
        )}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  )
}
