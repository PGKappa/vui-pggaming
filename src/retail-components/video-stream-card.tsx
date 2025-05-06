'use client'

import dynamic from 'next/dynamic'
import LoadingSpinner from './loading-spinner'

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false })

export default function VideoStreamCard(props: {
  streamUrl: string | undefined
}) {
  return (
    <div className="aspect-video">
      {props.streamUrl ? (
        <ReactPlayer
          playing={true}
          controls={false}
          url={props.streamUrl}
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
