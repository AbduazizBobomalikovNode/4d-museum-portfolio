import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/global.css'
import App from './App'
import { perfMode } from '@/lib/perfFlags'

// ?perf=1 only: start the measurement collector (longtask observer, marks) as early as possible
if (perfMode) {
  performance.mark('perf:app-boot')
  void import('@/perf/perfCore').then((m) => {
    m.install()
    m.mark('app-boot', undefined, performance.getEntriesByName('perf:app-boot')[0]?.startTime)
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
