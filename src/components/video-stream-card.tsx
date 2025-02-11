import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import Player from '@/components/video-player'

export default function VideoStreamCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Football</CardTitle>
      </CardHeader>
      <CardContent>
        <Player
          streamUrl="https://st7.net4media.net:8082/PG/Dogs/1qasw5/playlist.m3u8"
          width="full"
          height="auto"
          controls={false}
          autoplay={true}
          muted={false}
          sldpOptions={{
            adaptive_bitrate: {
              initial_rendition: '240p',
            },
            buffering: 500,
          }}
        />
      </CardContent>
    </Card>
  )
}
