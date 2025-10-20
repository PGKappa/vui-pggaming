'use client'

import dynamic from 'next/dynamic'
import LoadingSpinner from './loading-spinner'
import { Discipline } from '@/virtual-lib/types'

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false })

// URL video fittizi per discipline - da sostituire con URL reali
const getDisciplineVideoUrl = (discipline: Discipline): string => {
  const videoUrls = {
    [Discipline.DOGS]:
      'https://global-premium-n4m2025.net4media.net:8082/PG/12aa14d9-Dogs-V61-a787-26aed4a81f41/playlist.m3u8',
    [Discipline.HORSES]:
      'https://global-premium-n4m2025.net4media.net:8082/PG/2dbd6af0-Horses-V62-ab0c-190406a689d/playlist.m3u8',
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

  return (
    <div className="aspect-video">
      {videoUrl ? (
        <ReactPlayer
          playing={true}
          controls={false}
          url={videoUrl}
          width="100%"
          height="100%"
          muted={true}
        />
      ) : (
        <div className="flex h-full items-center justify-center">
          <LoadingSpinner />
        </div>
      )}
    </div>
  )
}
