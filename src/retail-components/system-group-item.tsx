'use client'

import { Button } from '@/retail-components/ui/button'
import { SystemGroup } from '@/retail-lib/types'
import { MinusIcon, PlusIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import NumericKeypadDrawer from './numeric-keypad-drawer'
import { AccordionContent, AccordionItem } from './ui/accordion'
import { Checkbox } from './ui/checkbox'

export default function SystemGroupItem(props: {
  group: SystemGroup
  isOpen: boolean
  isSelected: boolean
  currencySymbol: string
  minWin: number
  maxWin: number
  onSelectedChange: (checked: boolean) => void
  onStakeChange: (value: number) => void
  onDecrement: () => void
  onIncrement: () => void
  onToggleOpen: () => void
}) {
  const { t } = useTranslation()
  const { group } = props

  return (
    <AccordionItem
      key={group.name}
      value={group.name}
      className="bg-bet-foreground"
    >
      <div
        className={`relative h-[59px] border-b px-4 py-[7px] ${props.isOpen ? 'bg' : 'bg-background'}`}
      >
        <div className="mt-[3px] flex w-full items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={props.isSelected}
              onCheckedChange={(checked) =>
                props.onSelectedChange(checked as boolean)
              }
            />
            <span className="pt-0.5 text-[12px] font-semibold">
              {group.name.toUpperCase()}
            </span>
            <span className="text-muted-background relative right-[5px] mt-[1px] text-[12px] font-semibold">
              (x{group.combinations.length})
            </span>
          </div>
          <div className="relative flex items-center">
            <div className="mr-[12px] mt-[2px] flex items-center space-x-0 border">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  props.onDecrement()
                }}
                disabled={group.stake <= 0}
                className="h-8 w-7 bg-minusButton p-3 text-[19px] text-bet-foreground hover:opacity-90 disabled:bg-minusButtonDark"
              >
                <MinusIcon className="h-4 w-4" />
              </Button>
              <NumericKeypadDrawer
                value={group.stake}
                setValue={props.onStakeChange}
                inputWidth="w-[142px] pr-2 text-[13px]"
                triggerLabel={group.name}
                showPlusMinus={false}
                drawerId={`system-group-${group.name}`}
                currencySymbol={props.currencySymbol}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  props.onIncrement()
                }}
                className="h-8 w-7 bg-plusButton p-3 text-[19px] text-bet-foreground hover:opacity-90"
              >
                <PlusIcon className="h-4 w-4" />
              </Button>
            </div>
            <button
              onClick={props.onToggleOpen}
              className="ml-2 flex items-center justify-center bg-transparent"
              style={{ width: '20px', height: '20px' }}
            >
              <svg
                className="relative left-1"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  animation: props.isOpen
                    ? 'chevron-rotate-open 0.2s ease-out forwards'
                    : 'chevron-rotate-close 0.2s ease-out forwards',
                }}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>
        </div>
      </div>
      <AccordionContent className="h-[55px] border-b px-4">
        <div className="relative top-1.5 grid grid-cols-3 text-[13px]">
          <div className="text-center">
            <div className="relative bottom-[2px] text-[12px] font-semibold capitalize text-foreground">
              {t('min')} {t('win')}
            </div>
            <div className="relative top-[0px] text-[13px] font-normal">
              {props.currencySymbol} {props.minWin.toFixed(2)}
            </div>
          </div>
          <div className="relative right-[12px] text-center text-[12px] font-semibold">
            <div className="relative bottom-[2px] capitalize text-foreground">
              {t('max')} {t('win')}
            </div>
            <div className="relative top-[0px] text-[13px] font-normal">
              {props.currencySymbol} {props.maxWin.toFixed(2)}
            </div>
          </div>
          <div className="relative right-[16px] text-center text-[12px] font-semibold">
            <div className="relative bottom-[2px] left-1 capitalize text-foreground">
              {t('total_played')}
            </div>
            <div className="relative left-1 top-[0px] text-[13px] font-normal">
              {props.currencySymbol}{' '}
              {(group.stake * group.combinations.length).toFixed(2)}
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
