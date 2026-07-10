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
  filterControlClass: string
  filterButtonClass: string
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
      itemBasis:
        'box-border min-w-0 shrink-0 grow-0 flex-[0_0_var(--carousel-slide-size)]',
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
      filterControlClass:
        'h-[48px] w-full min-w-0 border-none bg-background pl-[16px] pr-[5px] text-[14px] text-foreground [&>span]:truncate min-[1400px]:text-[15px] min-[1600px]:pl-[17px] min-[1600px]:text-[16px] min-[1920px]:min-w-[186px]',
      filterButtonClass:
        'h-[48px] min-w-0 flex-1 basis-0 text-[14px] font-bold min-[1400px]:text-[15px] min-[1600px]:text-[16px] min-[1920px]:min-w-[186px]',
      searchBarPaddingRight: '161px',
    },
  },
  es: {
    carousel: {
      itemBasis:
        'box-border min-w-0 shrink-0 grow-0 flex-[0_0_var(--carousel-slide-size)]',
      imageOffset: {
        SOCCER: 'bottom-[4px] right-[40px]',
        HORSES: 'bottom-[4px] right-[10px]',
        DOGS: 'bottom-[4px] right-[18px]',
        DOGS8: 'bottom-[4px] right-[12px]',
      },
      textOffset: {
        SOCCER: 'right-[25px]',
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
      combinationsButtonLeft: 'left-[245px]',
    },
    searchEventResults: {
      disciplineSelectLeft: 'right-11',
      filterControlClass:
        'h-[48px] w-full min-w-0 border-none bg-background pl-[16px] pr-[5px] text-[13px] text-foreground [&>span]:truncate min-[1400px]:text-[14px] min-[1600px]:pl-[17px] min-[1600px]:text-[15px] min-[1920px]:min-w-[240px] min-[1920px]:text-[16px]',
      filterButtonClass:
        'h-[48px] min-w-0 flex-1 basis-0 text-[13px] font-bold min-[1400px]:text-[14px] min-[1600px]:text-[15px] min-[1920px]:min-w-[240px] min-[1920px]:text-[16px]',
      searchBarPaddingRight: '95px',
    },
  },
  it: {
    carousel: {
      itemBasis:
        'box-border min-w-0 shrink-0 grow-0 flex-[0_0_var(--carousel-slide-size)]',
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
      filterControlClass:
        'h-[48px] w-full min-w-0 border-none bg-background pl-[16px] pr-[5px] text-[14px] text-foreground [&>span]:truncate min-[1400px]:text-[15px] min-[1600px]:pl-[17px] min-[1600px]:text-[16px] min-[1920px]:min-w-[186px]',
      filterButtonClass:
        'h-[48px] min-w-0 flex-1 basis-0 text-[14px] font-bold min-[1400px]:text-[15px] min-[1600px]:text-[16px] min-[1920px]:min-w-[186px]',
      searchBarPaddingRight: '161px',
    },
  },
}
/** Default layout (English) used as fallback for unknown languages */
const defaultLayout = layoutByLanguage.en
export function getLayoutConfig(lang: string): LayoutConfig {
  return layoutByLanguage[lang] ?? defaultLayout
}