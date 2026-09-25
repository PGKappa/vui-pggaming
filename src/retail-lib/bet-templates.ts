import type { SystemGroupItemProps } from '@/retail-components/system-group-item'
import type { ComponentType } from 'react'

export type BetTemplateSlots = {
  systemGroupItem: ComponentType<SystemGroupItemProps>
}

export type BetTemplateSlot = keyof BetTemplateSlots

export type BetTemplate = {
  showGroupStakeIncrement: boolean
  components?: Partial<BetTemplateSlots>
}

export const DEFAULT_BET_TEMPLATE_ID = 'standard'

export const BET_TEMPLATES = {
  standard: {
    showGroupStakeIncrement: true,
  },
  noIncrement: {
    showGroupStakeIncrement: false,
  },
} as const satisfies Record<string, BetTemplate>

export type BetTemplateId = keyof typeof BET_TEMPLATES

export function isBetTemplateId(value: string): value is BetTemplateId {
  return Object.prototype.hasOwnProperty.call(BET_TEMPLATES, value)
}

export function resolveBetTemplate(value: string | null | undefined): {
  id: BetTemplateId
  template: BetTemplate
} {
  const id =
    value && isBetTemplateId(value) ? value : (DEFAULT_BET_TEMPLATE_ID as BetTemplateId)
  return { id, template: BET_TEMPLATES[id] }
}
