import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'

export default function NumberInput(props: {
  value: number
  onChange: (value: number) => void
  openStakeDialog?: () => void
}) {
  const [value, setValue] = useState(props.value)

  return (
    <div className="flex w-fit items-center border border-border">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-5 bg-bet p-3 text-[19px] text-bet-foreground"
        onClick={() => {
          setValue((prev) => {
            const newValue = prev < 0.5 ? 0 : prev - 0.5
            props.onChange(newValue)
            return newValue
          })
        }}
      >
        -
      </Button>
      <Input
        type="number"
        value={value}
        className="bg-background-foreground h-7 w-16 border-x text-center"
        readOnly
        onClick={() => !!props.openStakeDialog && props.openStakeDialog()}
      />
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-4 bg-bet p-3 text-[19px] text-bet-foreground"
        onClick={() => {
          setValue((prev) => {
            const newValue = prev + 0.5
            props.onChange(newValue)
            return newValue
          })
        }}
      >
        +
      </Button>
    </div>
  )
}
