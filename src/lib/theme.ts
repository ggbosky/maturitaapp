import { useEffect, useState } from 'react'

const KEY = 'zt:theme'

export function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try {
      localStorage.setItem(KEY, dark ? 'dark' : 'light')
    } catch {
      // bez úložiště se volba jen nezapamatuje
    }
  }, [dark])

  return { dark, toggle: () => setDark((d) => !d) }
}
