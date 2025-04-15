'use client'

import { useStore as useZustandStore } from './StoreProvider'

// Re-export the store hook with any additional functionality if needed
export const useStore = () => {
  const store = useZustandStore()
  return store
} 