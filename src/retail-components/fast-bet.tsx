import { Input } from '@/retail-components/ui/input'
import CodeList from './code-list'
import { useTranslation } from 'react-i18next'

export default function FastBet() {
  const { t } = useTranslation()
  return (
    <div className="flex w-full flex-col gap-2 bg-accent px-2 py-3">
      <div className="flex flex-row items-center justify-between">
        <span className="text-[16px] font-bold text-bet-foreground">
          {t('fastbet')}
        </span>
        <CodeList />
      </div>
      <div className="flex flex-row items-center gap-1">
        <Input
          className="text-bold h-10 w-1/4 text-[16px]"
          placeholder={t('code')}
        />
        <Input
          className="text-bold h-10 w-3/4 text-[16px]"
          placeholder={t('selection')}
        />
      </div>
    </div>
  )
}
