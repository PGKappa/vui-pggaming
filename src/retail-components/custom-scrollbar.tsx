'use client'
import { useEffect, useRef, useState } from 'react'

interface CustomScrollbarProps {
  contentRef: React.RefObject<HTMLDivElement | null>
}

export default function CustomScrollbar({ contentRef }: CustomScrollbarProps) {
  const [scrollHeight, setScrollHeight] = useState(0)
  const [clientHeight, setClientHeight] = useState(0)
  const [scrollTop, setScrollTop] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const thumbRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)


  const thumbHeight = clientHeight > 0 
    ? Math.max((clientHeight / scrollHeight) * clientHeight, 40) 
    : 0
  const thumbTop = clientHeight > 0 && scrollHeight > clientHeight
    ? (scrollTop / (scrollHeight - clientHeight)) * (clientHeight - thumbHeight)
    : 0


  useEffect(() => {
    const updateDimensions = () => {
      if (contentRef.current) {
        const newScrollHeight = contentRef.current.scrollHeight
        const newClientHeight = contentRef.current.clientHeight
        const newScrollTop = contentRef.current.scrollTop

        setScrollHeight(newScrollHeight)
        setClientHeight(newClientHeight)
        setScrollTop(newScrollTop)
      }
    }


    updateDimensions()


    const timeoutId = setTimeout(updateDimensions, 100)

    const resizeObserver = new ResizeObserver(updateDimensions)
    const mutationObserver = new MutationObserver(() => {
      setTimeout(updateDimensions, 50)
    })
    
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current)
      mutationObserver.observe(contentRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      })
    }


    const intervalId = setInterval(updateDimensions, 200)

    return () => {
      clearTimeout(timeoutId)
      clearInterval(intervalId)
      resizeObserver.disconnect()
      mutationObserver.disconnect()
    }
  }, [contentRef])


  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current && !isDragging) {
        setScrollTop(contentRef.current.scrollTop)
      }
    }

    const content = contentRef.current
    content?.addEventListener('scroll', handleScroll, { passive: true })
    return () => content?.removeEventListener('scroll', handleScroll)
  }, [contentRef, isDragging])


  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!trackRef.current || !contentRef.current) return

      const trackRect = trackRef.current.getBoundingClientRect()
      const relativeY = e.clientY - trackRect.top
      const scrollRatio = relativeY / (clientHeight - thumbHeight)
      const newScrollTop = scrollRatio * (scrollHeight - clientHeight)

      contentRef.current.scrollTop = Math.max(0, Math.min(newScrollTop, scrollHeight - clientHeight))
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, clientHeight, scrollHeight, thumbHeight, contentRef])

  // Click sul track
  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current || !contentRef.current) return
    if (e.target === thumbRef.current) return

    const trackRect = trackRef.current.getBoundingClientRect()
    const relativeY = e.clientY - trackRect.top - thumbHeight / 2
    const scrollRatio = relativeY / (clientHeight - thumbHeight)
    const newScrollTop = scrollRatio * (scrollHeight - clientHeight)

    contentRef.current.scrollTop = Math.max(0, Math.min(newScrollTop, scrollHeight - clientHeight))
  }

  const needsScrollbar = scrollHeight > clientHeight + 2
  
  if (!needsScrollbar || clientHeight === 0) {
    return null
  }

  return (
    <div
      ref={trackRef}
      className="w-[8px] h-full bg-[#e5e7eb] cursor-pointer pointer-events-auto"
      onClick={handleTrackClick}
    >
      <div
        ref={thumbRef}
        className="w-full bg-[#94a3b8]/30 cursor-grab active:cursor-grabbing hover:bg-[#64748b]/35 transition-colors"
        style={{
          height: `${thumbHeight}px`,
          transform: `translateY(${thumbTop}px)`,
        }}
        onMouseDown={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
      />
    </div>
  )
}