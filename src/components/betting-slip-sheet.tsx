import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import BettingSlip from './betting-slip'
import { Button } from './ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from './ui/sheet'
import { t } from 'i18next'

export default function BettingSlipSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          size="lg"
          className="bg-footer-betslip text-footer-betslip-foreground hover:bg-footer-betslip/90 text-md font-semibold"
        >
          {t('bet_slip')}
        </Button>
      </SheetTrigger>
      <SheetContent side="top" className="p-0">
        <VisuallyHidden>
          <SheetTitle>{t('bet_slip')}</SheetTitle>
        </VisuallyHidden>
        <BettingSlip />
      </SheetContent>
    </Sheet>
  )
}
