type CarouselLayoutConfig = {
  itemBasis: string
  imageOffset: Record<string, string>
  textOffset: Record<string, string>
  progressBarHeight: string
  eventNameFontSize: string
  eventSubtitleFontSize: string
  eventSubtitleBottom: string
}
type EventBetsLayoutConfig = {
  eventIdMargin: string
}
type BettingSlipLayoutConfig = {
  combinationsButtonLeft: string
}
type SearchEventResultsLayoutConfig = {
  disciplineSelectLeft: string
  disciplineSelectMinWidth: string
  searchBarPaddingRight: string
}
export type LayoutConfig = {
  carousel: CarouselLayoutConfig
  eventBets: EventBetsLayoutConfig
  bettingSlip: BettingSlipLayoutConfig
  searchEventResults: SearchEventResultsLayoutConfig
}
const layoutByLanguage: Record<string, LayoutConfig> = {
  en: {
    carousel: {
      itemBasis: 'basis-1/5 min-[1500px]:basis-1/6',
      imageOffset: {
        SOCCER: 'bottom-[4px] right-[10px]',
        HORSES: 'bottom-[4px] right-[9px]',
        DOGS: 'bottom-[4px] right-[11px]',
        DOGS8: 'bottom-[4px] right-[11px]',
      },
      textOffset: {
        SOCCER: 'right-[3px]',
        HORSES: 'right-[6px]',
        DOGS: 'right-[6px]',
        DOGS8: 'right-[6px]',
      },
      progressBarHeight: 'h-[6px]',
      eventNameFontSize: 'text-[14px]',
      eventSubtitleFontSize: 'text-[13px]',
      eventSubtitleBottom: 'bottom-[5px]',
    },
    eventBets: {
      eventIdMargin: 'mr-[255px]',
    },
    bettingSlip: {
      combinationsButtonLeft: 'left-[251px] bg-transparent',
    },
    searchEventResults: {
      disciplineSelectLeft: 'left-5',
      disciplineSelectMinWidth: 'min-w-[186px]',
      searchBarPaddingRight: '161px',
    },
  },
  es: {
    carousel: {
      itemBasis: 'basis-1/5',
      imageOffset: {
        SOCCER: 'bottom-[4px] right-[10px]',
        HORSES: 'bottom-[4px] right-[10px]',
        DOGS: 'bottom-[4px] right-[18px]',
        DOGS8: 'bottom-[4px] right-[12px]',
      },
      textOffset: {
        SOCCER: 'right-[3px]',
        HORSES: 'left-[6px]',
        DOGS: 'right-[2px]',
        DOGS8: 'left-[3px]',
      },
      progressBarHeight: 'h-[7px]',
      eventNameFontSize: 'text-[13px]',
      eventSubtitleFontSize: 'text-[12px]',
      eventSubtitleBottom: 'bottom-[4px]',
    },
    eventBets: {
      eventIdMargin: 'mr-[220px]',
    },
    bettingSlip: {
      combinationsButtonLeft: 'left-[238px]',
    },
    searchEventResults: {
      disciplineSelectLeft: 'right-11',
      disciplineSelectMinWidth: 'min-w-[240px]',
      searchBarPaddingRight: '95px',
    },
  },
  it: {
    carousel: {
      itemBasis: 'basis-1/5 min-[1500px]:basis-1/6',
      imageOffset: {
        SOCCER: 'bottom-[4px] right-[10px]',
        HORSES: 'bottom-[4px] right-[13px]',
        DOGS: 'bottom-[4px] right-[13px]',
        DOGS8: 'bottom-[4px] right-[11px]',
      },
      textOffset: {
        SOCCER: 'right-[3px]',
        HORSES: 'left-[5px]',
        DOGS: 'left-[4px]',
        DOGS8: 'right-[6px]',
      },
      progressBarHeight: 'h-[6px]',
      eventNameFontSize: 'text-[14px]',
      eventSubtitleFontSize: 'text-[13px] top-[-4px]',
      eventSubtitleBottom: 'bottom-[5px]',
    },
    eventBets: {
      eventIdMargin: 'mr-[215px]',
    },
    bettingSlip: {
      combinationsButtonLeft: 'left-[255px] bg-transparent',
    },
    searchEventResults: {
      disciplineSelectLeft: 'left-5',
      disciplineSelectMinWidth: 'min-w-[186px]',
      searchBarPaddingRight: '161px',
    },
  },
}
/** Default layout (English) used as fallback for unknown languages */
const defaultLayout = layoutByLanguage.en
export function getLayoutConfig(lang: string): LayoutConfig {
  return layoutByLanguage[lang] ?? defaultLayout
}