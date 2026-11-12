'use client'

import dynamic from 'next/dynamic'
import { Maximize, Minimize, Power, VideoOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import LoadingSpinner from './loading-spinner'
import { Discipline } from '@/virtual-lib/types'

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false })

// Dirette video (HLS net4media) per disciplina; il calcio è ancora quello di prova
const getDisciplineVideoUrl = (discipline: Discipline): string | undefined => {
  const videoUrls: Partial<Record<Discipline, string>> = {
    [Discipline.DOGS]:
      'https://global-premium-n4m2025.net4media.net:8082/PG/91fbbcb0-V73-430b-92bf-7cb58c714168/playlist.m3u8',
    [Discipline.DOGS8]:
      'https://global-premium-n4m2025.net4media.net:8082/PG/f5c0a5fb-v71-spagnolo-dogs8-ad9ce2662d0a/playlist.m3u8',
    [Discipline.HORSES]:
      'https://global-premium-n4m2025.net4media.net:8082/PG/d85c8856-V72-4090-991a-c28645b94aec/playlist.m3u8',
    [Discipline.FOOTBALL]:
      'https://st12.net4media.net:8082/nuvometa/c510a754-V140-Trident-Football-492d2a7a15b5/playlist.m3u8',
  }
  return videoUrls[discipline]
}

export default function VideoStreamCard(props: {
  streamUrl?: string | undefined
  discipline?: Discipline
}) {
  // Usa streamUrl se fornito, altrimenti determina in base alla disciplina
  const videoUrl =
    props.streamUrl ||
    (props.discipline ? getDisciplineVideoUrl(props.discipline) : undefined)

  // spento, il player viene smontato: niente flusso scaricato
  const [videoOn, setVideoOn] = useState(true)

  // a schermo intero va il riquadro (non solo il <video>), così i tasti
  // restano visibili sopra il video
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const onChange = () =>
      setIsFullscreen(document.fullscreenElement === containerRef.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
      return
    }
    const container = containerRef.current
    if (container?.requestFullscreen) {
      container.requestFullscreen().catch(() => {})
      return
    }
    // iPhone: niente fullscreen sugli elementi, solo sul <video> nativo
    const video = container?.querySelector('video') as
      | (HTMLVideoElement & { webkitEnterFullscreen?: () => void })
      | null
    video?.webkitEnterFullscreen?.()
  }

  return (
    <div
      ref={containerRef}
      className="relative aspect-video overflow-hidden bg-black shadow-sm [&:fullscreen]:aspect-auto"
    >
      <button
        type="button"
        aria-pressed={videoOn}
        aria-label="Video on/off"
        onClick={() => setVideoOn((on) => !on)}
        className={`absolute right-2 top-2 z-10 flex size-8 items-center justify-center rounded-sm text-white shadow transition-colors ${
          videoOn
            ? 'bg-black/50 hover:bg-black/70'
            : 'bg-tertiary hover:bg-tertiary/85'
        }`}
      >
        <Power className="size-4" />
      </button>

      {videoOn && (
        <button
          type="button"
          aria-label="Fullscreen"
          onClick={toggleFullscreen}
          className="absolute bottom-2 right-2 z-10 flex size-8 items-center justify-center rounded-sm bg-black/50 text-white shadow transition-colors hover:bg-black/70"
        >
          {isFullscreen ? (
            <Minimize className="size-4" />
          ) : (
            <Maximize className="size-4" />
          )}
        </button>
      )}

      {!videoOn ? (
        <div className="flex h-full items-center justify-center">
          <Power className="size-16 text-white/20" />
        </div>
      ) : videoUrl ? (
        <ReactPlayer
          playing={true}
          controls={false}
          url={videoUrl}
          width="100%"
          height="100%"
          muted={true}
        />
      ) : props.discipline ? (
        // disciplina senza diretta configurata: niente caricamento infinito
        <div className="flex h-full items-center justify-center">
          <VideoOff className="size-16 text-white/20" />
        </div>
      ) : (
        <div className="flex h-full items-center justify-center">
          <LoadingSpinner />
        </div>
      )}
    </div>
  )
}
