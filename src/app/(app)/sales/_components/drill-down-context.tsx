'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { DrillDownConfig } from './drill-down-utils'

interface DrillDownState {
  isOpen: boolean
  config: DrillDownConfig | null
}

interface DrillDownContextValue {
  state: DrillDownState
  openDrillDown: (config: DrillDownConfig) => void
  closeDrillDown: () => void
}

const DrillDownContext = createContext<DrillDownContextValue | null>(null)

export function DrillDownProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DrillDownState>({
    isOpen: false,
    config: null,
  })

  const openDrillDown = useCallback((config: DrillDownConfig) => {
    setState({
      isOpen: true,
      config,
    })
  }, [])

  const closeDrillDown = useCallback(() => {
    setState({
      isOpen: false,
      config: null,
    })
  }, [])

  return (
    <DrillDownContext.Provider value={{ state, openDrillDown, closeDrillDown }}>
      {children}
    </DrillDownContext.Provider>
  )
}

export function useDrillDown() {
  const context = useContext(DrillDownContext)
  if (!context) {
    throw new Error('useDrillDown must be used within a DrillDownProvider')
  }
  return context
}
