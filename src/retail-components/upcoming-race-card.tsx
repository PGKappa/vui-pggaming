import { UpcomingEvent, UpcomingRace } from '@/retail-lib/types'
import { useEffect, useState } from 'react'

export default function UpcomingRaceCard(props: { race: UpcomingEvent }) {
  const { race } = props
  const [raceInfo, setRaceInfo] = useState<UpcomingRace>()

  useEffect(() => {
    const fetchEventInfo = async () => {
      try {
        const response = await fetch(
          `https://apidev.pgvirtual.eu/api/event/info/${race.extId}/${race.id}`,
          {
            headers: {
              accept: 'application/json',
              'accept-language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
              authorization: 'Bearer ffffffff-ffff-ffff-ffff-ffffffffffee',
              operator: 'pg',
              priority: 'u=1, i',
              'sec-ch-ua':
                '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
              'sec-ch-ua-mobile': '?1',
              'sec-ch-ua-platform': '"Android"',
              'sec-fetch-dest': 'empty',
              'sec-fetch-mode': 'cors',
              'sec-fetch-site': 'same-site',
            },
            referrer: 'https://test.pgvirtual.eu/',
            referrerPolicy: 'strict-origin-when-cross-origin',
            body: null,
            method: 'GET',
            mode: 'cors',
            credentials: 'include',
          },
        )
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data: UpcomingRace = await response.json()
        setRaceInfo(data)
      } catch (error) {
        console.error('Error fetching event info:', error)
      }
    }
    fetchEventInfo()
  }, [race.id, race.extId])

  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <h1 className="text-2xl font-bold">Upcoming {raceInfo?.id}</h1>
    </div>
  )
}
