type CarouselOffsetAtBreakpoints = {
  /** < 1400px — 4 card per riga nel carousel */
  below1400: string
  /** ≥ 1400px — 5 card per riga. Se omesso, resta il valore di below1400. */
  from1400?: string
  /** ≥ 1920px. Se omesso, resta il valore di from1400 (o below1400). */
  from1920?: string
}

type CarouselOffsetsByDiscipline = Record<
  'SOCCER' | 'HORSES' | 'DOGS' | 'DOGS8',
  CarouselOffsetAtBreakpoints
>

type CarouselLayoutSource = {
  itemBasis: string
  imageOffset: CarouselOffsetsByDiscipline
  textOffset: CarouselOffsetsByDiscipline
  /** Offset testo fissi da ≥1400px (layout originale, senza wrapper centrato). */
  textOffsetFrom1400?: CarouselOffsetsByDiscipline
  /** Allineamento blocco testo nel tasto carousel (per lingua). */
  textContainerClass?: CarouselOffsetAtBreakpoints
  /** Larghezza/allineamento gruppo titolo + sottotitolo + timer. */
  textInnerClass?: CarouselOffsetAtBreakpoints
  /** Classi solo sul titolo evento (es. centrato a basse risoluzioni). */
  eventTitleClass?: CarouselOffsetAtBreakpoints
  progressBarHeight: string
  eventNameFontSize: string
  eventSubtitleFontSize: string
  eventSubtitleBottom: string
}

type CarouselLayoutConfig = {
  itemBasis: string
  imageOffset: Record<string, string>
  textOffset: Record<string, string>
  textOffsetFrom1400: Record<string, string>
  textContainerClass: string
  textInnerClass: string
  eventTitleClass: string
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

function prefixTailwindClasses(classes: string, prefix: string): string {
  return classes
    .split(/\s+/)
    .filter(Boolean)
    .map((cls) => `${prefix}${cls}`)
    .join(' ')
}

function resolveOffsetClasses(offset: CarouselOffsetAtBreakpoints): string {
  const at1400 = offset.from1400 ?? offset.below1400
  const at1920 = offset.from1920 ?? at1400

  const parts: string[] = []
  if (offset.below1400) parts.push(offset.below1400)
  if (at1400 && at1400 !== offset.below1400) {
    parts.push(prefixTailwindClasses(at1400, 'min-[1400px]:'))
  }
  if (at1920 && at1920 !== at1400) {
    parts.push(prefixTailwindClasses(at1920, 'min-[1920px]:'))
  }
  return parts.join(' ')
}

function resolveOffsetsByDiscipline(
  offsets: CarouselOffsetsByDiscipline,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(offsets).map(([discipline, breakpointOffset]) => [
      discipline,
      resolveOffsetClasses(breakpointOffset),
    ]),
  )
}

const defaultTextContainerClass: CarouselOffsetAtBreakpoints = {
  below1400: 'items-start text-left',
}

const defaultTextInnerClass: CarouselOffsetAtBreakpoints = {
  below1400: 'w-full',
}

const defaultEventTitleClass: CarouselOffsetAtBreakpoints = {
  below1400: '',
}

function resolveOffsetsFrom1400(
  offsets: CarouselOffsetsByDiscipline,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(offsets).map(([discipline, breakpointOffset]) => [
      discipline,
      breakpointOffset.from1920 ??
        breakpointOffset.from1400 ??
        breakpointOffset.below1400,
    ]),
  )
}

function buildCarouselLayout(source: CarouselLayoutSource): CarouselLayoutConfig {
  return {
    itemBasis: source.itemBasis,
    progressBarHeight: source.progressBarHeight,
    eventNameFontSize: source.eventNameFontSize,
    eventSubtitleFontSize: source.eventSubtitleFontSize,
    eventSubtitleBottom: source.eventSubtitleBottom,
    imageOffset: resolveOffsetsByDiscipline(source.imageOffset),
    textOffset: resolveOffsetsByDiscipline(source.textOffset),
    textOffsetFrom1400: resolveOffsetsFrom1400(
      source.textOffsetFrom1400 ?? source.textOffset,
    ),
    textContainerClass: resolveOffsetClasses(
      source.textContainerClass ?? defaultTextContainerClass,
    ),
    textInnerClass: resolveOffsetClasses(
      source.textInnerClass ?? defaultTextInnerClass,
    ),
    eventTitleClass: resolveOffsetClasses(
      source.eventTitleClass ?? defaultEventTitleClass,
    ),
  }
}

const carouselItemBasis =
  'box-border min-w-0 shrink-0 grow-0 flex-[0_0_var(--carousel-slide-size)]'

const layoutByLanguage: Record<string, LayoutConfig> = {
  en: {
    carousel: buildCarouselLayout({
      itemBasis: carouselItemBasis,
      imageOffset: {
        // Esempio offset responsive per disciplina:
        // DOGS: {
        //   below1400: 'bottom-[4px] right-[8px]',
        //   from1400: 'bottom-[4px] right-[11px]',
        //   from1920: 'bottom-[4px] right-[14px]',
        // },
        SOCCER: { below1400: 'bottom-[4px] right-[10px]' },
        HORSES: { below1400: 'bottom-[4px] right-[9px]' },
        DOGS: { below1400: 'bottom-[4px] right-[11px]' },
        DOGS8: { below1400: 'bottom-[4px] right-[11px]' },
      },
      textOffset: {
        SOCCER: { below1400: 'right-[3px]' },
        HORSES: { below1400: 'right-[6px]' },
        DOGS: { below1400: 'right-[6px]' },
        DOGS8: { below1400: 'right-[6px]' },
      },
      progressBarHeight: 'h-[6px]',
      eventNameFontSize: 'text-[14px]',
      eventSubtitleFontSize: 'text-[13px]',
      eventSubtitleBottom: 'bottom-[5px]',
    }),
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
    carousel: buildCarouselLayout({
      itemBasis: carouselItemBasis,
      imageOffset: {
        SOCCER: { below1400: 'bottom-[4px] right-[40px]' },
        HORSES: { below1400: 'bottom-[4px] right-[10px]' },
        DOGS: { below1400: 'bottom-[4px] right-[18px]' },
        DOGS8: { below1400: 'bottom-[4px] right-[18px]' },
      },
      textOffset: {
        SOCCER: { below1400: '' },
        HORSES: { below1400: '' },
        DOGS: { below1400: '' },
        DOGS8: { below1400: '' },
      },
      textOffsetFrom1400: {
        SOCCER: { below1400: 'right-[25px]' },
        HORSES: { below1400: 'left-[6px]' },
        DOGS: { below1400: 'right-[2px]' },
        DOGS8: { below1400: 'right-[2px]' },
      },
      textContainerClass: {
        below1400: 'items-center',
        from1400: 'items-start text-left',
      },
      textInnerClass: {
        below1400: 'relative w-fit max-w-full -left-[3px]',
        from1400: 'w-full',
      },
      progressBarHeight: 'h-[7px]',
      eventNameFontSize: 'text-[13px]',
      eventSubtitleFontSize: 'text-[12px]',
      eventSubtitleBottom: 'bottom-[4px]',
    }),
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
    carousel: buildCarouselLayout({
      itemBasis: carouselItemBasis,
      imageOffset: {
        SOCCER: { below1400: 'bottom-[4px] right-[10px]' },
        HORSES: { below1400: 'bottom-[4px] right-[13px]' },
        DOGS: { below1400: 'bottom-[4px] right-[13px]' },
        DOGS8: { below1400: 'bottom-[4px] right-[13px]' },
      },
      textOffset: {
        SOCCER: { below1400: 'right-[3px]' },
        HORSES: { below1400: 'left-[5px]' },
        DOGS: { below1400: 'left-[4px]' },
        DOGS8: { below1400: 'left-[4px]' },
      },
      progressBarHeight: 'h-[6px]',
      eventNameFontSize: 'text-[14px]',
      eventSubtitleFontSize: 'text-[13px] top-[-4px]',
      eventSubtitleBottom: 'bottom-[5px]',
    }),
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
