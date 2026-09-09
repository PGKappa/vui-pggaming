'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

const MEDIA_ERROR_LABELS: Record<number, string> = {
  1: 'ABORTED (caricamento interrotto)',
  2: 'NETWORK (errore di rete)',
  3: 'DECODE (codec non supportato)',
  4: 'SRC_NOT_SUPPORTED (formato/sorgente non supportati)',
}

const NETWORK_STATE_LABELS = ['EMPTY', 'IDLE', 'LOADING', 'NO_SOURCE']
const READY_STATE_LABELS = [
  'NOTHING',
  'METADATA',
  'CURRENT_DATA',
  'FUTURE_DATA',
  'ENOUGH_DATA',
]

const VIDEO_EVENTS = [
  'loadstart',
  'durationchange',
  'loadedmetadata',
  'loadeddata',
  'canplay',
  'canplaythrough',
  'play',
  'playing',
  'pause',
  'waiting',
  'stalled',
  'suspend',
  'abort',
  'emptied',
  'error',
  'ended',
]

export function ReplayDiagnosticPlayer({
  url,
  onEnded,
}: {
  url: string
  onEnded?: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const startRef = useRef(Date.now())
  const [log, setLog] = useState<string[]>([])
  const [state, setState] = useState('in attesa...')

  const append = useCallback((line: string) => {
    setLog((prev) => [
      ...prev.slice(-25),
      `+${Date.now() - startRef.current}ms  ${line}`,
    ])
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    startRef.current = Date.now()
    setLog([])
    append(`URL: ${url}`)
    append(
      `UA: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'n/a'}`,
    )
    append(
      `canPlayType mp4/h264: "${video.canPlayType(
        'video/mp4; codecs="avc1.42E01E"',
      )}" | mp4 generico: "${video.canPlayType('video/mp4')}" | webm: "${video.canPlayType('video/webm')}"`,
    )

    const handlers: Array<[string, () => void]> = VIDEO_EVENTS.map((name) => {
      const handler = () => {
        if (name === 'error') {
          const code = video.error?.code
          const label =
            (code && MEDIA_ERROR_LABELS[code]) ||
            video.error?.message ||
            'sconosciuto'
          append(`EVENTO error -> MEDIA_ERR_${label}`)
          toast.error(`Errore video: MEDIA_ERR_${label}`, {
            duration: Infinity,
          })
        } else {
          append(`evento ${name}`)
          if (name === 'ended') onEnded?.()
        }
      }
      video.addEventListener(name, handler)
      return [name, handler]
    })

    video
      .play()
      .then(() => append('play() risolto (riproduzione avviata)'))
      .catch((error: unknown) => {
        const name = error instanceof Error ? error.name : String(error)
        const message = error instanceof Error ? error.message : ''
        append(`play() RIFIUTATO -> ${name}: ${message}`)
        toast.error(`play() bloccato: ${name} — ${message}`, {
          duration: Infinity,
        })
      })

    const interval = setInterval(() => {
      setState(
        `network=${NETWORK_STATE_LABELS[video.networkState] ?? video.networkState} | ` +
          `ready=${READY_STATE_LABELS[video.readyState] ?? video.readyState} | ` +
          `paused=${video.paused} | t=${video.currentTime.toFixed(1)}s | ` +
          `durata=${isNaN(video.duration) ? 'n/d' : video.duration.toFixed(1) + 's'} | ` +
          `buffer=${video.buffered.length > 0 ? video.buffered.end(video.buffered.length - 1).toFixed(1) + 's' : '0s'}`,
      )
    }, 500)

    return () => {
      clearInterval(interval)
      handlers.forEach(([name, handler]) =>
        video.removeEventListener(name, handler),
      )
    }
  }, [url, append, onEnded])

  return (
    <>
      <video
        ref={videoRef}
        key={url}
        src={url}
        controls
        muted
        playsInline
        className="h-full w-full object-contain"
      />
      <div className="absolute inset-x-2 top-2 z-20 rounded-lg bg-black/90 p-3 font-mono text-[11px] leading-tight text-lime-300 ring-2 ring-red-500">
        <div className="mb-1 text-[13px] font-bold text-white">
          DIAGNOSTICA REPLAY — {state}
        </div>
        <div className="max-h-[220px] overflow-y-auto whitespace-pre-wrap break-all">
          {log.join('\n')}
        </div>
      </div>
    </>
  )
}
