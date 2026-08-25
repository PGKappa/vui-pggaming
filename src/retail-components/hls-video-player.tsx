'use client'

import { useEffect, useRef } from 'react'
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

  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return

    const isM3u8 = src.includes('.m3u8')

    if (!isM3u8 || video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src
      return
    }

    if (Hls.isSupported()) {
      const hls = new Hls()
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) onError?.(data)
      })
      hls.loadSource(src)
      hls.attachMedia(video)
      return () => hls.destroy()
    }

    onError?.(new Error('HLS is not supported in this browser'))
  }, [src, onError])

  return (
    <video
      ref={videoRef}
      controls={controls}
      autoPlay={autoPlay}
      muted={muted}
      playsInline={playsInline}
      onEnded={onEnded}
      className={className}
    />
  )
}
