import { Input } from '@/retail-components/ui/input'
import CodeList from './code-list'

export default function FastBet() {
  return (
    <div className="flex w-full flex-col gap-2 bg-accent px-2 py-3">
      <div className="flex flex-row items-center justify-between">
        <span className="text-[16px] font-bold text-bet-foreground">
          Fastbet
        </span>
        <CodeList />
      </div>
      <div className="flex flex-row items-center gap-1">
        <Input
          className="text-bold h-10 w-1/4 text-[16px]"
          placeholder="Code"
        />
        <Input
          className="text-bold h-10 w-3/4 text-[16px]"
          placeholder="Selection"
        />
      </div>
    </div>
  )
}
