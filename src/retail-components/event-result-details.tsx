import { RootContext } from '@/retail-contexts/root-context'
import { Discipline, EventResult, RaceResult } from '@/retail-lib/types'
import { getRacerColors, createPGVirtualAPICall } from '@/retail-lib/utils'
import { t } from 'i18next'
import Image from 'next/image'
import ReactPlayer from 'react-player/lazy'
import { useCallback, useContext, useEffect, useState } from 'react'
import LoadingSpinner from './loading-spinner'
import { Button } from './ui/button'

const getReplayGameId = (discipline: Discipline): string => {
  if (discipline === Discipline.HORSES) return 'horses6'
  if (discipline === Discipline.DOGS8) return 'dogs8'
  if (discipline === Discipline.DOGS) return 'dogs6'
  return `${discipline.toLowerCase()}6`
}

const extractReplayUrl = (payload: any): string | null => {
  if (typeof payload === 'string' && payload.trim()) return payload.trim()

  const candidates = [
    payload?.replayUrl,
    payload?.replay_url,
    payload?.videoUrl,
    payload?.video_url,
    payload?.streamUrl,
    payload?.stream_url,
    payload?.url,
    payload?.playlist,
    payload?.hls,
    payload?.data?.replayUrl,
    payload?.data?.replay_url,
    payload?.data?.videoUrl,
    payload?.data?.video_url,
    payload?.data?.streamUrl,
    payload?.data?.stream_url,
    payload?.data?.url,
    payload?.data?.playlist,
    payload?.data?.hls,
    payload?.result?.replayUrl,
    payload?.result?.videoUrl,
    payload?.result?.streamUrl,
    payload?.result?.url,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim()
    }
  }

  return null
}

export default function EventResultDetails({
  eventResult,
}: {
  eventResult: EventResult
}) {
  const rootContext = useContext(RootContext)
  const [detailedResult, setDetailedResult] = useState<any>(null)
  const [showReplay, setShowReplay] = useState(false)
  const [replayUrl, setReplayUrl] = useState<string | null>(null)
  const [replayLoading, setReplayLoading] = useState(false)
  const [replayError, setReplayError] = useState<string | null>(null)

  const handleOpenReplay = useCallback(async () => {
    setShowReplay(true)

    if (replayUrl || replayLoading) return

    if (!rootContext.initCode || !rootContext.operator) {
      setReplayError(t('login_required'))
      return
    }

    if (!eventResult.extId) {
      setReplayError(t('no_detailed_results'))
      return
    }

    setReplayLoading(true)
    setReplayError(null)
    try {
      const requestBody = {
        gameId: getReplayGameId(eventResult.discipline),
        game_id: getReplayGameId(eventResult.discipline),
        discipline: eventResult.discipline,
        eventId: eventResult.id,
        int_event_id: eventResult.id,
        extId: eventResult.extId,
        ext_pal_id: eventResult.extId,
      }

      const response = await createPGVirtualAPICall(
        '/api/event/results/replay',
        rootContext.initCode,
        { method: 'POST', body: JSON.stringify(requestBody) },
        rootContext.operator,
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const rawText = await response.text()
      let parsed: any = null
      try {
        parsed = rawText ? JSON.parse(rawText) : null
      } catch {
        parsed = null
      }

      const url = extractReplayUrl(parsed) || extractReplayUrl(rawText)
      if (!url) {
        throw new Error('Replay URL not found in API response')
      }

      setReplayUrl(url)
    } catch {
      setReplayError(t('failed_fetch_results'))
    } finally {
      setReplayLoading(false)
    }
  }, [
    eventResult.discipline,
    eventResult.extId,
    eventResult.id,
    replayLoading,
    replayUrl,
    rootContext.initCode,
    rootContext.operator,
  ])

  useEffect(() => {
    setShowReplay(false)
    setReplayUrl(null)
    setReplayError(null)
    setReplayLoading(false)
  }, [eventResult.id, eventResult.extId, eventResult.discipline])

  useEffect(() => {
    if (eventResult.result && eventResult.result.odds) {
      setDetailedResult(eventResult.result)
      return
    }
    if (!eventResult.extId) {
      setDetailedResult(eventResult.result || null)
      return
    }
    setDetailedResult(eventResult.result || null)
  }, [eventResult])

  if (!detailedResult) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        {t('no_detailed_results')}
      </div>
    )
  }

  if (
    (eventResult.discipline === Discipline.HORSES ||
      eventResult.discipline === Discipline.DOGS ||
      eventResult.discipline === Discipline.DOGS8) &&
    detailedResult
  ) {
    if (showReplay) {
      return (
        <div className="mb-0">
          <div className="relative bg-black">
            <button
              onClick={() => setShowReplay(false)}
              className="absolute right-3 top-2 z-10 text-[28px] leading-none text-white hover:opacity-80"
              aria-label="Close replay"
            >
              ×
            </button>

            <div className="h-[540px] w-full bg-black">
              {replayLoading ? (
                <div className="flex h-full items-center justify-center">
                  <LoadingSpinner />
                </div>
              ) : replayError ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-neutral-300">
                  <div>{replayError}</div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/5 text-white"
                    onClick={handleOpenReplay}
                  >
                    RETRY
                  </Button>
                </div>
              ) : replayUrl ? (
                <ReactPlayer
                  url={replayUrl}
                  controls
                  playing
                  width="100%"
                  height="100%"
                  muted={false}
                  style={{ backgroundColor: '#000' }}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-neutral-300">
                  {t('no_detailed_results')}
                </div>
              )}
            </div>
          </div>

          <div className="bg-background">
            <div className="flex h-[52px] items-center justify-center">
              <Button
                variant="outline"
                size="sm"
                className="min-w-[160px] bg-background text-foreground hover:bg-muted"
                onClick={() => setShowReplay(false)}
              >
                RESULTS
              </Button>
            </div>
          </div>
        </div>
      )
    }

    if (detailedResult.odds) {
      const raceResult = detailedResult as RaceResult

      const extractExacta = (exacta: any) => {
        const results: Array<{ combination: string; odds: string }> = []
        Object.entries(exacta).forEach(([first, secondObj]: [string, any]) => {
          if (typeof secondObj === 'object') {
            Object.entries(secondObj).forEach(
              ([second, odds]: [string, any]) => {
                results.push({
                  combination: `${first}-${second}`,
                  odds: String(odds),
                })
              },
            )
          }
        })
        return results
      }

      const extractQuinella = (quinella: any) => {
        const results: Array<{ combination: string; odds: string }> = []
        Object.entries(quinella).forEach(
          ([first, secondObj]: [string, any]) => {
            if (typeof secondObj === 'object') {
              Object.entries(secondObj).forEach(
                ([second, odds]: [string, any]) => {
                  results.push({
                    combination: `${first}-${second}`,
                    odds: String(odds),
                  })
                },
              )
            }
          },
        )
        return results
      }

      const extractTrifecta = (trifecta: any) => {
        const results: Array<{ combination: string; odds: string }> = []
        Object.entries(trifecta).forEach(
          ([first, secondObj]: [string, any]) => {
            if (typeof secondObj === 'object') {
              Object.entries(secondObj).forEach(
                ([second, thirdObj]: [string, any]) => {
                  if (typeof thirdObj === 'object') {
                    Object.entries(thirdObj).forEach(
                      ([third, odds]: [string, any]) => {
                        results.push({
                          combination: `${first}-${second}-${third}`,
                          odds: String(odds),
                        })
                      },
                    )
                  }
                },
              )
            }
          },
        )
        return results
      }

      const extractBoxedTrifecta = (boxedtrifecta: any) => {
        const results: Array<{ combination: string; odds: string }> = []
        Object.entries(boxedtrifecta).forEach(
          ([first, secondObj]: [string, any]) => {
            if (typeof secondObj === 'object') {
              Object.entries(secondObj).forEach(
                ([second, thirdObj]: [string, any]) => {
                  if (typeof thirdObj === 'object') {
                    Object.entries(thirdObj).forEach(
                      ([third, odds]: [string, any]) => {
                        results.push({
                          combination: `${first}-${second}-${third}`,
                          odds: String(odds),
                        })
                      },
                    )
                  }
                },
              )
            }
          },
        )
        return results
      }

      return (
        <div className="mb-0 space-y-4">
          {detailedResult.arrival &&
            Array.isArray(detailedResult.arrival) &&
            detailedResult.arrival.length > 0 && (
              <div className="mb-[-8px] border-b">
                <div className="mt-[7px] h-[45px] bg-secondary py-2 text-center">
                  <div className="relative top-[3px] text-[15px] font-semibold uppercase text-accent-foreground">
                    {t('arrival_order').toUpperCase()}
                  </div>
                </div>
                <div className="mr-[40px] flex h-[79px] items-center justify-center gap-[147px] p-4">
                  {detailedResult.arrival
                    .slice(0, 3)
                    .map((competitor: any, index: number) => {
                      const imageSrc =
                        index === 0
                          ? '/cockade_gold.png'
                          : index === 1
                            ? '/cockade_silver.png'
                            : '/cockade_bronze.png'
                      const medalNumber = String(index + 1)
                      return (
                        <div
                          key={competitor.number || index}
                          className="flex items-center gap-3"
                        >
                          <div className="relative flex h-11 w-11 items-center justify-center">
                            <Image
                              src={imageSrc}
                              alt={medalNumber}
                              width={48}
                              height={48}
                              className="absolute"
                            />
                            <div className="relative pb-[11px] text-[23px] font-bold">
                              {medalNumber}
                            </div>
                          </div>
                          <div
                            className="flex h-[33px] w-[33px] items-center justify-center rounded-md text-[21px] font-semibold"
                            style={
                              getRacerColors(
                                competitor.number,
                                eventResult.discipline as
                                  | 'DOGS'
                                  | 'DOGS8'
                                  | 'HORSES',
                              ).style
                            }
                          >
                            {competitor.number}
                          </div>
                          <div className="relative right-[1px] max-w-0 pr-10 pt-[1px] text-[17px] font-semibold">
                            {competitor.name}
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}

          <div className="grid grid-cols-3">
            {raceResult.odds.winner && (
              <div className="border-b">
                <div className="h-[45px] bg-secondary py-2 text-center">
                  <div className="relative top-[3px] text-[15px] font-semibold uppercase text-accent-foreground">
                    {t('winner').toUpperCase()}
                  </div>
                </div>
                <div className="space-y-3 p-3">
                  {Object.entries(raceResult.odds.winner).map(
                    ([number, odds]) => (
                      <div
                        key={number}
                        className="flex items-center justify-between"
                      >
                        <span className="ml-3 flex items-center gap-3">
                          <div
                            className="flex h-[33px] w-[33px] items-center justify-center rounded-md text-[21px] font-semibold"
                            style={
                              getRacerColors(
                                parseInt(number),
                                eventResult.discipline as
                                  | 'DOGS'
                                  | 'DOGS8'
                                  | 'HORSES',
                              ).style
                            }
                          >
                            {number}
                          </div>
                          <span className="text-[17px] font-semibold">
                            {odds}
                          </span>
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
            {raceResult.odds.placed && (
              <div className="border-b border-l">
                <div className="h-[45px] bg-secondary py-2 text-center">
                  <div className="relative top-[3px] text-[15px] font-semibold uppercase text-accent-foreground">
                    {t('place_2').toUpperCase()}
                  </div>
                </div>
                <div className="space-y-3 p-3">
                  {Object.entries(raceResult.odds.placed).map(
                    ([number, odds]) => (
                      <div
                        key={number}
                        className="flex items-center justify-between"
                      >
                        <span className="ml-3 flex items-center gap-3">
                          <div
                            className="flex h-[33px] w-[33px] items-center justify-center rounded-md text-[21px] font-semibold"
                            style={
                              getRacerColors(
                                parseInt(number),
                                eventResult.discipline as
                                  | 'DOGS'
                                  | 'DOGS8'
                                  | 'HORSES',
                              ).style
                            }
                          >
                            {number}
                          </div>
                          <span className="text-[17px] font-semibold">
                            {odds}
                          </span>
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
            {raceResult.odds.show && (
              <div className="border-b border-l">
                <div className="h-[45px] bg-secondary py-2 text-center">
                  <div className="relative top-[3px] text-[15px] font-semibold uppercase text-accent-foreground">
                    {t('show_3').toUpperCase()}
                  </div>
                </div>
                <div className="space-y-3 p-3">
                  {Object.entries(raceResult.odds.show).map(
                    ([number, odds]) => (
                      <div
                        key={number}
                        className="flex items-center justify-between"
                      >
                        <span className="ml-3 flex items-center gap-3">
                          <div
                            className="flex h-[33px] w-[33px] items-center justify-center rounded-md text-[21px] font-semibold"
                            style={
                              getRacerColors(
                                parseInt(number),
                                eventResult.discipline as
                                  | 'DOGS'
                                  | 'DOGS8'
                                  | 'HORSES',
                              ).style
                            }
                          >
                            {number}
                          </div>
                          <span className="text-[17px] font-semibold">
                            {odds}
                          </span>
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-4">
            {raceResult.odds.exacta && (
              <div className="relative bottom-2 border-b">
                <div className="h-[45px] bg-secondary py-2 text-center">
                  <div className="relative top-[3px] text-[15px] font-semibold uppercase text-accent-foreground">
                    {t('exacta').toUpperCase()}
                  </div>
                </div>
                <div className="space-y-2 p-3">
                  {extractExacta(raceResult.odds.exacta).map(
                    ({ combination, odds }) => (
                      <div
                        key={combination}
                        className="flex items-center justify-between"
                      >
                        <span className="ml-3 flex items-center gap-3">
                          {combination.split('-').map((num, idx) => (
                            <div
                              key={idx}
                              className="flex h-[33px] w-[33px] items-center justify-center rounded-md text-[21px] font-semibold"
                              style={
                                getRacerColors(
                                  parseInt(num),
                                  eventResult.discipline as
                                    | 'DOGS'
                                    | 'DOGS8'
                                    | 'HORSES',
                                ).style
                              }
                            >
                              {num}
                            </div>
                          ))}
                        </span>
                        <span className="mr-3 text-[17px] font-semibold">
                          {odds}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
            {raceResult.odds.quinella && (
              <div className="relative bottom-2 border-b border-l">
                <div className="h-[45px] bg-secondary py-2 text-center">
                  <div className="relative top-[3px] text-[15px] font-semibold uppercase text-accent-foreground">
                    {t('quinella').toUpperCase()}
                  </div>
                </div>
                <div className="space-y-2 p-3">
                  {extractQuinella(raceResult.odds.quinella).map(
                    ({ combination, odds }) => (
                      <div
                        key={combination}
                        className="flex items-center justify-between"
                      >
                        <span className="ml-3 flex items-center gap-3">
                          {combination.split('-').map((num, idx) => (
                            <div
                              key={idx}
                              className="flex h-[33px] w-[33px] items-center justify-center rounded-md text-[21px] font-semibold"
                              style={
                                getRacerColors(
                                  parseInt(num),
                                  eventResult.discipline as
                                    | 'DOGS'
                                    | 'DOGS8'
                                    | 'HORSES',
                                ).style
                              }
                            >
                              {num}
                            </div>
                          ))}
                        </span>
                        <span className="mr-3 text-[17px] font-semibold">
                          {odds}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
            {raceResult.odds.trifecta && (
              <div className="relative bottom-2 border-b border-l">
                <div className="h-[45px] bg-secondary py-2 text-center">
                  <div className="relative top-[3px] text-[15px] font-semibold uppercase text-accent-foreground">
                    {t('trifecta').toUpperCase()}
                  </div>
                </div>
                <div className="space-y-2 p-3">
                  {extractTrifecta(raceResult.odds.trifecta).map(
                    ({ combination, odds }) => (
                      <div
                        key={combination}
                        className="flex items-center justify-between"
                      >
                        <span className="ml-3 flex items-center gap-3">
                          {combination.split('-').map((num, idx) => (
                            <div
                              key={idx}
                              className="flex h-[33px] w-[33px] items-center justify-center rounded-md text-[21px] font-semibold"
                              style={
                                getRacerColors(
                                  parseInt(num),
                                  eventResult.discipline as
                                    | 'DOGS'
                                    | 'DOGS8'
                                    | 'HORSES',
                                ).style
                              }
                            >
                              {num}
                            </div>
                          ))}
                        </span>
                        <span className="mr-3 text-[17px] font-semibold">
                          {odds}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
            {raceResult.odds.boxedtrifecta && (
              <div className="relative bottom-2 border-b border-l">
                <div className="h-[45px] bg-secondary py-2 text-center">
                  <div className="relative top-[3px] text-[15px] font-semibold uppercase text-accent-foreground">
                    {t('boxed_trifecta').toUpperCase()}
                  </div>
                </div>
                <div className="space-y-2 p-3">
                  {extractBoxedTrifecta(raceResult.odds.boxedtrifecta).map(
                    ({ combination, odds }) => (
                      <div
                        key={combination}
                        className="flex items-center justify-between"
                      >
                        <span className="ml-3 flex items-center justify-center gap-3">
                          {combination.split('-').map((num, idx) => (
                            <div
                              key={idx}
                              className="flex h-[33px] w-[33px] items-center justify-center rounded-md text-[21px] font-semibold"
                              style={
                                getRacerColors(
                                  parseInt(num),
                                  eventResult.discipline as
                                    | 'DOGS'
                                    | 'DOGS8'
                                    | 'HORSES',
                                ).style
                              }
                            >
                              {num}
                            </div>
                          ))}
                        </span>
                        <span className="mr-3 text-[17px] font-semibold">
                          {odds}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2">
            {raceResult.odds.evenodd && (
              <div className="relative bottom-4 border-b">
                <div className="h-[45px] bg-secondary py-2 text-center">
                  <div className="relative top-[3px] text-[15px] font-semibold uppercase text-accent-foreground">
                    {t('even_odd').toUpperCase()}
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  {raceResult.odds.evenodd.even && (
                    <div className="text-center">
                      <div className="py-2 text-[16px] font-semibold">
                        <span className="relative left-[6px] mr-[644px]">
                          {t('even').toUpperCase()}
                        </span>{' '}
                        <span className="relative right-[6px]">
                          {raceResult.odds.evenodd.even}
                        </span>
                      </div>
                    </div>
                  )}
                  {raceResult.odds.evenodd.odd && (
                    <div className="text-center">
                      <div className="py-2 text-[16px] font-semibold">
                        <span className="relative right-[5px] mr-[586px]">
                          {t('odd').toUpperCase()}
                        </span>{' '}
                        <span className="relative left-[22px] mr-[17px]">
                          {raceResult.odds.evenodd.odd}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {raceResult.odds.underover && (
              <div className="relative bottom-4 border-b border-l">
                <div className="h-[45px] bg-secondary py-2 text-center">
                  <div className="relative top-[3px] text-[15px] font-semibold uppercase text-accent-foreground">
                    {t('under_over')} 3.5
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  {raceResult.odds.underover.under && (
                    <div className="text-center">
                      <div className="py-2 text-[16px] font-semibold">
                        <span className="relative left-[2px] mr-[591px]">
                          {t('under_full').toUpperCase()}
                        </span>{' '}
                        <span className="relative left-[14px] mr-4">
                          {raceResult.odds.underover.under}
                        </span>
                      </div>
                    </div>
                  )}
                  {raceResult.odds.underover.over && (
                    <div className="text-center">
                      <div className="py-2 text-[16px] font-semibold">
                        <span className="relative left-1 mr-[635px]">
                          {t('over_full').toUpperCase()}
                        </span>{' '}
                        <span className="relative right-[6px]">
                          {raceResult.odds.underover.over}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              className="min-w-[160px] border-border bg-background text-foreground hover:bg-muted"
              onClick={handleOpenReplay}
            >
              REPLAY
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div className="p-4 text-center text-muted-foreground">
        {t('event_completed_detailed_results')}
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            className="min-w-[140px] border-border bg-background text-foreground hover:bg-muted"
            onClick={handleOpenReplay}
          >
            REPLAY
          </Button>
        </div>
      </div>
    )
  }

  if (eventResult.discipline === Discipline.SOCCER) {
    return (
      <div className="mb-[-16px] space-y-4">
        <div className="pt-[7px]">
          <div className="bg-accent py-2 text-center">
            <div className="text-[16px] font-bold uppercase text-accent-foreground">
              {t('match_result').toUpperCase()}
            </div>
          </div>
          <div className="pt-4 text-center">
            <div className="mb-1 text-[18px] font-bold">
              {detailedResult.teams}
            </div>
            <div className="text-[24px] font-bold">
              {detailedResult.score1} - {detailedResult.score2}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-y-2">
          {detailedResult.odds?.oneXTwo && (
            <div className="border border-l-0 border-r-0">
              <div className="bg-accent py-2 text-center">
                <div className="text-[16px] font-bold uppercase text-accent-foreground">
                  1X2
                </div>
              </div>
              <div className="p-3 text-center">
                <div className="text-[17px] font-semibold">
                  {detailedResult.odds.oneXTwo.odds}
                </div>
              </div>
            </div>
          )}
          {detailedResult.odds?.doubleChance && (
            <div className="border border-r-0">
              <div className="bg-accent py-2 text-center">
                <div className="text-[16px] font-bold uppercase text-accent-foreground">
                  {t('double_chance').toUpperCase()}
                </div>
              </div>
              <div className="p-3 text-center">
                <div className="text-[17px] font-semibold">
                  {detailedResult.odds.doubleChance.odds}
                </div>
              </div>
            </div>
          )}
          {detailedResult.odds?.firstScorer && (
            <div className="border border-l-0 border-r-0">
              <div className="bg-accent py-2 text-center">
                <div className="text-[16px] font-bold uppercase text-accent-foreground">
                  {t('first_scorer').toUpperCase()}
                </div>
              </div>
              <div className="p-3 text-center">
                <div className="mb-1 text-[16px]">
                  {detailedResult.odds.firstScorer.teamLabel}
                </div>
                <div className="text-[17px] font-semibold">
                  {detailedResult.odds.firstScorer.odds}
                </div>
              </div>
            </div>
          )}
          {detailedResult.odds?.sumGoals && (
            <div className="border border-r-0">
              <div className="bg-accent py-2 text-center">
                <div className="text-[16px] font-bold uppercase text-accent-foreground">
                  {t('total_goals').toUpperCase()}
                </div>
              </div>
              <div className="p-3 text-center">
                <div className="mb-1 text-[16px]">
                  {detailedResult.odds.sumGoals.value}
                </div>
                <div className="text-[17px] font-semibold">
                  {detailedResult.odds.sumGoals.odds}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-background">
          <div className="flex h-[52px] items-center justify-center">
            <Button
              variant="outline"
              size="sm"
              className="min-w-[160px] bg-background text-foreground hover:bg-muted"
              onClick={handleOpenReplay}
            >
              REPLAY
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 text-center text-muted-foreground">
      {t('event_completed_detailed_results')}
    </div>
  )
}
