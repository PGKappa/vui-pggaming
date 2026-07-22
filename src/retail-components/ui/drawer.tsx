'use client'

import * as React from 'react'
import { Drawer as DrawerPrimitive } from 'vaul'

import { useRetailCompactHeight } from '@/retail-lib/use-retail-compact-height'
import { RETAIL_VIEWPORT } from '@/retail-lib/viewport-config'
import { cn } from '@/retail-lib/utils'

function useDrawerPortalContainer() {
  const [container, setContainer] = React.useState<HTMLElement | undefined>(
    undefined,
  )

  React.useLayoutEffect(() => {
    setContainer(document.body)
  }, [])

  return container
}

const Drawer = ({
  shouldScaleBackground = false,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root
    shouldScaleBackground={shouldScaleBackground}
    {...props}
  />
)
Drawer.displayName = 'Drawer'

const DrawerTrigger = DrawerPrimitive.Trigger

const DrawerPortal = DrawerPrimitive.Portal

const DrawerClose = DrawerPrimitive.Close

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn('fixed inset-0 z-50 bg-black/80', className)}
    {...props}
  />
))
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, style, ...props }, ref) => {
  const isCompactHeight = useRetailCompactHeight()
  const portalContainer = useDrawerPortalContainer()
  const topOffset = isCompactHeight
    ? RETAIL_VIEWPORT.COMPACT_DRAWER_TOP_OFFSET
    : RETAIL_VIEWPORT.DRAWER_TOP_OFFSET
  const bottomOffset = RETAIL_VIEWPORT.DRAWER_BOTTOM_OFFSET

  return (
    <DrawerPortal container={portalContainer}>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        ref={ref}
        className={cn(
          'pointer-events-auto fixed inset-x-0 z-50 flex h-auto flex-col border bg-background',
          className,
        )}
        style={
          {
            bottom: `${bottomOffset}px`,
            maxHeight: `calc(var(--retail-app-height, 100dvh) - ${bottomOffset + topOffset}px)`,
            ...style,
          } as React.CSSProperties
        }
        {...props}
      >
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
})
DrawerContent.displayName = 'DrawerContent'

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('grid gap-1.5 p-4  text-center sm:text-left h-[45px]', className)}
    {...props}
  />
)
DrawerHeader.displayName = 'DrawerHeader'

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('mt-auto flex flex-col gap-2 p-4', className)}
    {...props}
  />
)
DrawerFooter.displayName = 'DrawerFooter'

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn(
      'text-[15px] font-semibold leading-none tracking-tight relative bottom-[5px] uppercase',
      className,
    )}
    {...props}
  />
))
DrawerTitle.displayName = DrawerPrimitive.Title.displayName

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
DrawerDescription.displayName = DrawerPrimitive.Description.displayName

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
