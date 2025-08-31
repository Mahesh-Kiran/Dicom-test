import React from 'react'
import ReactDOM from 'react-dom/client'
import { Home } from './pages/Home'
import { TooltipProvider } from '@/components/ui/tooltip'
import './app.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TooltipProvider>
      <Home />
    </TooltipProvider>
  </React.StrictMode>,
)
