import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { SeasonDashboard } from './SeasonDashboard'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SeasonDashboard />
  </StrictMode>,
)
