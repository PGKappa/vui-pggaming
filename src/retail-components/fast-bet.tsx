import { Input } from '@/retail-components/ui/input'
import CodeList from './code-list'
import RacingCodeList from './racing-code-list'
import { useTranslation } from 'react-i18next'
import { useState, useContext } from 'react'
import { BetsContext } from '@/retail-contexts/bets-context'
import {
  parseFastBetInput,
  createBetFromFastCode,
} from '@/retail-lib/fastbet-parser'
import { toast } from 'sonner'

function getDisciplineFromPath(): 'soccer' | 'racing' {
  if (typeof window === 'undefined') return 'soccer'

  const path = window.location.pathname
  if (
    path.includes('/horses') ||
    path.includes('/dogs') ||
    path.includes('/dogs-horses')
  ) {
    return 'racing'
  }
  return 'soccer'
}

export default function FastBet({ selectedEvent }: { selectedEvent?: any }) {
  const { t } = useTranslation()
  const discipline = getDisciplineFromPath()
  const [codeInput, setCodeInput] = useState('')
  const [selectionInput, setSelectionInput] = useState('')

  const { addBets } = useContext(BetsContext)

  const handleSubmit = async () => {
    if (!codeInput.trim()) {
      toast.error(t('enter_code'))
      return
    }

    const parsedCode = parseFastBetInput(codeInput, selectionInput)

    if (!parsedCode) {
      toast.error(t('invalid_code_selection'))
      return
    }

    if (!selectedEvent) {
      toast.error(t('no_event_selected'))
      return
    }

    const bets = await createBetFromFastCode(parsedCode, selectedEvent)
    if (!bets || bets.length === 0) {
      toast.error(t('no_odds_found'))
      return
    }

    const getMarketName = (code: string) => {
      switch (code) {
        case 'V':
          return 'Vincente'
        case '2P':
          return 'Piazzato su 2'
        case '3P':
          return 'Piazzato su 3'
        case 'AO':
          return 'Exacta'
        case 'AX':
          return 'Quinella'
        case 'TO':
          return 'Trifecta'
        case 'BT':
          return 'Boxed Trifecta'
        case 'U':
        case 'O':
          return 'Under/Over'
        default:
          return 'FastBet'
      }
    }

    const marketName = getMarketName(parsedCode.code)

    addBets(marketName, bets)
    toast.success(`${bets.length} ${t('bets_added')}`)

    setCodeInput('')
    setSelectionInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  return (
    <div className="flex w-full flex-col gap-2 bg-accent px-2 py-3">
      <div className="flex flex-row items-center justify-between">
        <span className="text-[16px] font-bold text-bet-foreground">
          {t('fastbet')}
        </span>
        {discipline === 'racing' ? <RacingCodeList /> : <CodeList />}
      </div>
      <div className="flex flex-row items-center gap-1">
        <Input
          className="text-bold h-10 w-1/4 text-[16px]"
          placeholder={t('code')}
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
        />
        <Input
          className="text-bold h-10 w-3/4 text-[16px]"
          placeholder={t('selection')}
          value={selectionInput}
          onChange={(e) => setSelectionInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  )
}
