'use client'

import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'

type HlsVideoPlayerProps = {
  src: string
  controls?: boolean
  autoPlay?: boolean
  muted?: boolean
  playsInline?: boolean
  className?: string
  onEnded?: () => void
  onError?: (error: unknown) => void
}

export default function HlsVideoPlayer({
  src,
  controls = true,
  autoPlay = true,
  muted = false,
  playsInline = true,
  className,
  onEnded,
  onError,
}: HlsVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [debugMessage, setDebugMessage] = useState<string | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return

    setDebugMessage(null)

    const handleNativeError = () => {
      const err = video.error
      const message = `video error: code=${err?.code ?? 'unknown'} ${err?.message ?? ''}`.trim()
      setDebugMessage(message)
      onError?.(err)
    }
    video.addEventListener('error', handleNativeError)

    const isM3u8 = src.includes('.m3u8')

    if (!isM3u8 || video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src
      return () => video.removeEventListener('error', handleNativeError)
    }

    if (Hls.isSupported()) {
      const hls = new Hls()
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          const message = `HLS error: type=${data.type} details=${data.details}${
            data.response
              ? ` status=${data.response.code}`
              : ''
          }`
          setDebugMessage(message)
          onError?.(data)
        }
      })
      hls.loadSource(src)
      hls.attachMedia(video)
      return () => {
        hls.destroy()
        video.removeEventListener('error', handleNativeError)
      }
    }

    const message = 'HLS is not supported in this browser'
    setDebugMessage(message)
    onError?.(new Error(message))
    return () => video.removeEventListener('error', handleNativeError)
  }, [src, onError])

  return (
    <div className="relative h-full w-full">
      <video
        ref={videoRef}
        controls={controls}
        autoPlay={autoPlay}
        muted={muted}
        playsInline={playsInline}
        onEnded={onEnded}
        className={className}
      />
      {debugMessage && (
        <div className="pointer-events-none absolute inset-x-0 top-0 break-all bg-black/80 p-2 text-[11px] text-red-400">
          {debugMessage}
        </div>
      )}
    </div>
  )
}
