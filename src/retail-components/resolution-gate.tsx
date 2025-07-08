'use client'
import { useEffect, useState } from 'react'

export default function ResolutionGate({
  children,
}: {
  children: React.ReactNode
}) {
  
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const update = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      setDimensions({ width, height })
    }

    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  if (dimensions.width !== 1920 || dimensions.height !== 1080) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white">
        <div className="border border-gray-200 bg-white px-8 py-6 text-center shadow-md">
          <h1 className="text-3xl font-bold text-red-600">
            Retail Resolution Not Supported
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            This application requires a 1920x1080 pixel resolution (Full HD).
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
    <div className="fixed left-0 top-0 h-[1080px] w-[1920px] overflow-hidden">
      {children}
    </div>
  )
}
