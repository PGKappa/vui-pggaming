import { UpcomingEvent, UpcomingRace } from '@/retail-lib/types'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import BetCombinationsTable from './bet-combination-table'
import BetEntryToggle from './bet-entry-toggle'
import MedalsHistory from './medals-history'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader } from './ui/card'
import { Checkbox } from './ui/checkbox'
import { Switch } from './ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'

type UpcomingRaceCardProps = {
  race: UpcomingEvent
  onSelectionChange?: (
    raceInfo: UpcomingRace | undefined,
    isTris: boolean,
    position1Selection: number | null,
    position2Selection: number | null,
    position3Selection: number | null,
    disorderSelection: number[],
  ) => void
}

export default function UpcomingRaceCard({
  race,
  onSelectionChange,
}: UpcomingRaceCardProps) {
  const [raceInfo, setRaceInfo] = useState<UpcomingRace>()
  const [isTris, setIsTris] = useState(false)
  const [position1Selection, setPosition1Selection] = useState<number | null>(
    null,
  )
  const [position2Selection, setPosition2Selection] = useState<number | null>(
    null,
  )
  const [position3Selection, setPosition3Selection] = useState<number | null>(
    null,
  )
  const [disorderSelection, setDisorderSelection] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchEventInfo = async () => {
      setIsLoading(true)
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

        const data = await response.json()
        const upcomingRace: UpcomingRace = {
          ...data.current,
          id: parseInt(data.int_event_id),
        }
        console.log('Upcoming race data:', upcomingRace)
        console.log('Data', data.current)
        setRaceInfo(upcomingRace)
      } catch (error) {
        console.error('Error fetching event info:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEventInfo()
  }, [race.id, race.extId])

  // Notifica le modifiche alle selezioni
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(
        raceInfo,
        isTris,
        position1Selection,
        position2Selection,
        position3Selection,
        disorderSelection,
      )
    }
  }, [
    raceInfo,
    isTris,
    position1Selection,
    position2Selection,
    position3Selection,
    disorderSelection,
    onSelectionChange,
  ])

  const togglePosition1Selection = (competitorId: number) => {
    setPosition1Selection((current) =>
      current === competitorId ? null : competitorId,
    )
  }

  const togglePosition2Selection = (competitorId: number) => {
    setPosition2Selection((current) =>
      current === competitorId ? null : competitorId,
    )
  }

  const togglePosition3Selection = (competitorId: number) => {
    setPosition3Selection((current) =>
      current === competitorId ? null : competitorId,
    )
  }

  const toggleDisorderSelection = (competitorId: number) => {
    setDisorderSelection((current) => {
      if (current.includes(competitorId)) {
        return current.filter((id) => id !== competitorId)
      }
      return [...current, competitorId]
    })
  }

  const clearSelections = () => {
    setPosition1Selection(null)
    setPosition2Selection(null)
    setPosition3Selection(null)
    setDisorderSelection([])
  }

  return (
    <>
      <Card className="h-full w-full">
        <CardHeader className="flex h-16 flex-row items-center justify-between px-5">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              <Image
                src="/horse-image.png"
                alt="Horse"
                width={40}
                height={20}
                className="size-10 object-contain"
              />
              <span className="text-[24px] font-bold">{race.name}</span>
            </div>

            <div className="flex items-center justify-between gap-40">
              <div className="flex items-center gap-2">
                <span
                  className={isTris ? 'text-muted-foreground' : 'font-bold'}
                >
                  ACCOPPIATA
                </span>
                <Switch
                  checked={isTris}
                  onCheckedChange={(checked) => {
                    setIsTris(checked)
                    // Resetta la terza posizione quando si passa da TRIS a ACCOPPIATA
                    if (!checked) setPosition3Selection(null)
                  }}
                  className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-green-500"
                />
                <span
                  className={isTris ? 'font-bold' : 'text-muted-foreground'}
                >
                  TRIS
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="market"
                  className="h-9 w-full px-4 font-bold"
                  onClick={clearSelections}
                >
                  PULISCI
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader className="h-10 bg-card-header text-card-header-foreground">
              <TableRow>
                <TableHead className="w-[225px]">LISTA PARTENTI</TableHead>
                <TableHead className="w-[1px] bg-border p-0" />
                <TableHead className="text-center font-bold">
                  Vincente
                </TableHead>
                <TableHead className="w-[1px] bg-border p-0" />
                <TableHead className="text-center font-bold">
                  Piazzato su 2
                </TableHead>
                <TableHead className="w-[1px] bg-border p-0" />
                <TableHead className="text-center font-bold">
                  Piazzato su 3
                </TableHead>
                <TableHead className="w-[1px] bg-border p-0" />
                <TableHead className="text-center font-bold">1°</TableHead>
                <TableHead className="text-center font-bold">2°</TableHead>
                {isTris && (
                  <TableHead className="text-center font-bold">3°</TableHead>
                )}
                <TableHead className="w-[1px] bg-border p-0" />
                <TableHead className="text-center font-bold">
                  In Disordine
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {!isLoading && raceInfo?.racers && raceInfo.racers.length > 0 ? (
                raceInfo.racers.map((racer) => (
                  <TableRow
                    key={racer.number}
                    className="border-b border-border"
                  >
                    {/* Informazioni sul corridore */}
                    <TableCell className="p-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={
                            'flex h-7 w-7 items-center justify-center rounded-md font-bold text-white ' +
                            (racer.number === 1
                              ? 'bg-red-500'
                              : racer.number === 2
                                ? 'bg-blue-600'
                                : racer.number === 3
                                  ? 'bg-orange-500'
                                  : racer.number === 4
                                    ? 'bg-green-500'
                                    : racer.number === 5
                                      ? 'bg-yellow-400'
                                      : racer.number === 6
                                        ? 'bg-purple-500'
                                        : 'border border-gray-300 bg-white text-black')
                          }
                        >
                          {racer.number}
                        </div>
                        <div>
                          <div className="font-semibold">{racer.name}</div>
                          <div className="flex space-x-1">
                            <MedalsHistory history={racer.history} />
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Quote Vincente */}
                    <TableCell className="w-[1px] bg-border p-0" />
                    <TableCell className="p-2 text-center">
                      <BetEntryToggle
                        marketName="Vincente"
                        bet={{
                          discipline: race.discipline,
                          event: {
                            name: race.name,
                            number: race.id,
                            startingAt: race.time,
                          },
                          competitors: racer.name,

                          option: {
                            outcome: racer.number.toString(),
                            decPrice: parseFloat(
                              raceInfo.odds?.winner?.[
                                racer.number.toString()
                              ] || '0',
                            ),
                          },
                        }}
                        variant="racecard"
                        className="h-10 w-20 bg-red-100"
                      />
                    </TableCell>
                    <TableCell className="w-[1px] bg-border p-0" />

                    {/* Quote Piazzato su 2 */}
                    <TableCell className="p-2 text-center">
                      <BetEntryToggle
                        marketName="Piazzato su 2"
                        bet={{
                          discipline: race.discipline,
                          event: {
                            name: race.name,
                            number: race.id,
                            startingAt: race.time,
                          },
                          competitors: racer.name,
                          option: {
                            outcome: racer.number.toString(),
                            decPrice: parseFloat(
                              raceInfo.odds?.placed?.[
                                racer.number.toString()
                              ] || '0',
                            ),
                          },
                        }}
                        variant="racecard"
                        className="h-10 w-20 bg-red-100"
                      />
                    </TableCell>
                    <TableCell className="w-[1px] bg-border p-0" />

                    {/* Quote Piazzato su 3 */}
                    <TableCell className="p-2 text-center">
                      <BetEntryToggle
                        marketName="Piazzato su 3"
                        bet={{
                          discipline: race.discipline,
                          event: {
                            name: race.name,
                            number: race.id,
                            startingAt: race.time,
                          },
                          competitors: racer.name,
                          option: {
                            outcome: racer.number.toString(),
                            decPrice: parseFloat(
                              raceInfo.odds?.show?.[racer.number.toString()] ||
                                '0',
                            ),
                          },
                        }}
                        variant="racecard"
                        className="h-10 w-20 bg-red-100"
                      />
                    </TableCell>
                    <TableCell className="w-[1px] bg-border p-0" />

                    {/* Checkbox per posizione 1 */}
                    <TableCell className="p-2 text-center">
                      <Checkbox
                        checked={position1Selection === racer.number}
                        onCheckedChange={() =>
                          togglePosition1Selection(racer.number)
                        }
                        className="h-6 w-6 border-gray-400"
                      />
                    </TableCell>

                    {/* Checkbox per posizione 2 */}
                    <TableCell className="p-2 text-center">
                      <Checkbox
                        checked={position2Selection === racer.number}
                        onCheckedChange={() =>
                          togglePosition2Selection(racer.number)
                        }
                        className="h-6 w-6 border-gray-400"
                      />
                    </TableCell>

                    {/* Checkbox per posizione 3 (solo se TRIS) */}
                    {isTris && (
                      <TableCell className="p-2 text-center">
                        <Checkbox
                          checked={position3Selection === racer.number}
                          onCheckedChange={() =>
                            togglePosition3Selection(racer.number)
                          }
                          className="h-6 w-6 border-gray-400"
                        />
                      </TableCell>
                    )}
                    <TableCell className="w-[1px] bg-border p-0" />

                    {/* Checkbox per In Disordine */}
                    <TableCell className="p-2 text-center">
                      <Checkbox
                        checked={disorderSelection.includes(racer.number)}
                        onCheckedChange={() =>
                          toggleDisorderSelection(racer.number)
                        }
                        className="h-6 w-6 border-gray-400"
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={isTris ? 13 : 12}
                    className="py-6 text-center"
                  >
                    {isLoading
                      ? 'Caricamento dati in corso...'
                      : raceInfo
                        ? 'Nessun corridore disponibile per questa gara.'
                        : 'Impossibile caricare i dati della gara.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Tabella delle combinazioni - sempre mostrata quando abbiamo i dati */}
      {!isLoading && raceInfo && (
        <BetCombinationsTable
          race={{ ...race, data: raceInfo }}
          isTris={isTris}
          position1Selection={position1Selection}
          position2Selection={position2Selection}
          position3Selection={position3Selection}
          disorderSelection={disorderSelection}
        />
      )}
    </>
  )
}
