'use client'

import { RETAIL_VIEWPORT } from '@/retail-lib/viewport-config'
import { useEffect, useState } from 'react'

export default function ResolutionGate({
  children,
}: {
  children: React.ReactNode
}) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const update = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const isSupported =
    dimensions.width >= RETAIL_VIEWPORT.MIN_WIDTH &&
    dimensions.width <= RETAIL_VIEWPORT.MAX_WIDTH &&
    dimensions.height >= RETAIL_VIEWPORT.HEIGHT

  if (!isSupported) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white">
        <div className="border border-gray-200 bg-white px-8 py-6 text-center shadow-md">
          <h1 className="text-3xl font-bold text-red-600">
            Retail Resolution Not Supported
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            This application requires a resolution between{' '}
            {RETAIL_VIEWPORT.MIN_WIDTH}x{RETAIL_VIEWPORT.HEIGHT} and{' '}
            {RETAIL_VIEWPORT.MAX_WIDTH}x{RETAIL_VIEWPORT.HEIGHT}.
          </p>
          <p className="text-lg text-gray-600">
            Current resolution: {dimensions.width}x{dimensions.height}
          </p>
          <p className="mt-2 text-lg text-gray-500">
            Please adjust your device resolution or use a compatible display.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed left-0 top-0 overflow-hidden"
      style={{
        width: dimensions.width,
        height: RETAIL_VIEWPORT.HEIGHT,
      }}
    >
      {children}
    </div>
  )
}
