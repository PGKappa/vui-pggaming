'use client'
import { createContext, useEffect, useState } from 'react'

export type RootContextType = {
  currentUser?: string
}

export const RootContext = createContext<RootContextType>({})

function getRootContext(): RootContextType {
  try {
    const rootContext = localStorage.getItem('rootContext')
    return rootContext ? (JSON.parse(rootContext) as RootContextType) : {}
  } catch (error) {
    console.error('Failed to parse rootContext from localStorage:', error)
    return {}
  }
}

export default function RootContextProvider(props: {
  children: React.ReactNode
}) {
  const [rootContext, setRootContext] = useState<RootContextType>(getRootContext())

  useEffect(() => {
    localStorage.setItem('rootContext', JSON.stringify(rootContext))
  }, [rootContext])

  return (
    <RootContext.Provider value={rootContext}>
      {props.children}
    </RootContext.Provider>
  )
}
