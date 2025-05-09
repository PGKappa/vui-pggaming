import { Button } from '@/retail-components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/retail-components/ui/card'
import { LastRoundResults } from '@/retail-lib/types'
import { ChevronDown, ChevronUp, SearchIcon } from 'lucide-react'

export default function LastRoundsResults(props: {
  roundsResults: LastRoundResults[]
  open: boolean
  toggleOpen: () => void
}) {
  

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Last Results</CardTitle>
        <div className='flex flex-row gap-1'>
          <Button variant="ghost" size="icon-lg">
            <SearchIcon style={{scale: 2}}/>
          </Button>
          <Button variant="ghost" size="icon-lg" onClick={props.toggleOpen}>
            {props.open ? <ChevronUp style={{scale: 2}} /> : <ChevronDown style={{scale: 2}} />}
          </Button>
        </div>
      </CardHeader>
      {props.open && (
        <CardContent className="overflow-y-auto p-0">
          CIAOOO
        </CardContent>
      )}
    </Card>
  )
}
