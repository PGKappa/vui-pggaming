type CarouselLayoutConfig = {
  itemBasis: string
  imageOffset: Record<string, string>
  textOffset: Record<string, string>
}

type EventBetsLayoutConfig = {
  eventIdMargin: string
}

export type LayoutConfig = {
  carousel: CarouselLayoutConfig
  eventBets: EventBetsLayoutConfig
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
    },
    eventBets: {
      eventIdMargin: 'mr-[255px]',
    },
  },
  es: {
    carousel: {
      itemBasis: 'basis-1/5',
      imageOffset: {
        SOCCER: 'bottom-[4px] right-[10px]',
        HORSES: 'bottom-[4px] right-[5px]',
        DOGS: 'bottom-[4px] right-[12px]',
        DOGS8: 'bottom-[4px] right-[12px]',
      },
      textOffset: {
        SOCCER: 'right-[3px]',
        HORSES: 'right-[1px]',
        DOGS: 'right-[8px]',
        DOGS8: 'right-[8px]',
      },
    },
    eventBets: {
      eventIdMargin: 'mr-[220px]',
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
    },
    eventBets: {
      eventIdMargin: 'mr-[215px]',
    },
  },
}

/** Default layout (English) used as fallback for unknown languages */
const defaultLayout = layoutByLanguage.en

export function getLayoutConfig(lang: string): LayoutConfig {
  return layoutByLanguage[lang] ?? defaultLayout
}
