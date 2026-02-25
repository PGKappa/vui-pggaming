type CarouselLayoutConfig = {
  itemBasis: string
  imageOffset: Record<string, string>
  textOffset: Record<string, string>
  progressBarHeight: string
}
type EventBetsLayoutConfig = {
  eventIdMargin: string
}
type BettingSlipLayoutConfig = {
  combinationsButtonLeft: string
}
export type LayoutConfig = {
  carousel: CarouselLayoutConfig
  eventBets: EventBetsLayoutConfig
  bettingSlip: BettingSlipLayoutConfig
}
const layoutByLanguage: Record<string, LayoutConfig> = {
  en: {
    carousel: {
      itemBasis: 'basis-1/6',
      imageOffset: {
        SOCCER: 'bottom-[4px] right-[10px]',
        HORSES: 'bottom-[4px] right-[9px]',
        DOGS: 'bottom-[4px] right-[11px]',
        DOGS8: 'bottom-[4px] right-[11px]',
      },
      textOffset: {
        SOCCER: 'right-[3px]',
        HORSES: 'right-[5px]',
        DOGS: 'right-[6px]',
        DOGS8: 'right-[6px]',
      },
      progressBarHeight: 'h-[6px]',
    },
    eventBets: {
      eventIdMargin: 'mr-[255px]',
    },
    bettingSlip: {
      combinationsButtonLeft: 'left-[247px]',
    },
  },
  es: {
    carousel: {
      itemBasis: 'basis-1/5',
      imageOffset: {
        SOCCER: 'bottom-[4px] right-[10px]',
        HORSES: 'bottom-[4px] right-[4px]',
        DOGS: 'bottom-[4px] right-[13px]',
        DOGS8: 'bottom-[4px] right-[12px]',
      },
      textOffset: {
        SOCCER: 'right-[3px]',
        HORSES: 'right-[0px]',
        DOGS: 'right-[9px]',
        DOGS8: 'right-[8px]',
      },
      progressBarHeight: 'h-[7px]',
    },
    eventBets: {
      eventIdMargin: 'mr-[220px]',
    },
    bettingSlip: {
      combinationsButtonLeft: 'left-[237px]',
    },
  },
  it: {
    carousel: {
      itemBasis: 'basis-1/6',
      imageOffset: {
        SOCCER: 'bottom-[4px] right-[10px]',
        HORSES: 'bottom-[4px] right-[9px]',
        DOGS: 'bottom-[4px] right-[11px]',
        DOGS8: 'bottom-[4px] right-[11px]',
      },
      textOffset: {
        SOCCER: 'right-[3px]',
        HORSES: 'right-[5px]',
        DOGS: 'right-[6px]',
        DOGS8: 'right-[6px]',
      },
      progressBarHeight: 'h-[6px]',
    },
    eventBets: {
      eventIdMargin: 'mr-[215px]',
    },
    bettingSlip: {
      combinationsButtonLeft: 'left-[10px]',
    },
  },
}
/** Default layout (English) used as fallback for unknown languages */
const defaultLayout = layoutByLanguage.en
export function getLayoutConfig(lang: string): LayoutConfig {
  return layoutByLanguage[lang] ?? defaultLayout
}