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
    console.log('FastBet handleSubmit called')
    console.log('Inputs:', { codeInput, selectionInput })

    if (!codeInput.trim()) {
      toast.error('Inserisci un codice')
      return
    }

    const parsedCode = parseFastBetInput(codeInput, selectionInput)
    console.log('Parsed Code:', parsedCode)

    if (!parsedCode) {
      toast.error('Codice o selezione non validi')
      return
    }

    if (!selectedEvent) {
      toast.error('Nessun evento selezionato')
      return
    }

    const bets = await createBetFromFastCode(parsedCode, selectedEvent)
    console.log('Created bets:', bets)

    if (!bets || bets.length === 0) {
      toast.error('Nessuna quota trovata per questo codice')
      return
    }

    const getMarketName = (code: string) => {
      switch (code) {
        case 'V':
          return t('winner')
        case '2P':
          return t('place_2')
        case '3P':
          return t('show_3')
        case 'AO':
          return t('exacta')
        case 'AX':
          return t('quinella')
        case 'TO':
          return t('trifecta')
        case 'TX':
          return t('boxed_trifecta')
        case 'P':
        case 'D':
          return t('even_odd')
        case 'U':
        case 'O':
          return t('under_over')
        default:
          return 'FastBet'
      }
    }

    const marketName = getMarketName(parsedCode.code)
    console.log('Market name:', marketName)
    console.log('Adding bets to betting slip...')

    addBets(marketName, bets)
    toast.success(`${bets.length} scommessa/e aggiunta/e`)

    setCodeInput('')
    setSelectionInput('')
    console.log('FastBet completed successfully')
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
