'use client'

import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import ReactPlayer from 'react-player';

export default function VideoStreamCard(props: { streamUrl: string | undefined }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Football</CardTitle>
      </CardHeader>
      <CardContent>
        {props.streamUrl && <ReactPlayer
          // onEnded={() => {
          //   setReplayMode(false);
          // }}
          playing={true}
          className="details-video"
          controls={false}
          url={props.streamUrl}
          width="100%"
          height="100%"
          muted={true}
        />}
      </CardContent>
    </Card>
  )
}
