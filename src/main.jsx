import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

async function start() {
  if (import.meta.env.DEV && import.meta.env.VITE_DEMO_MOCKS === 'true') {
    const { installMockApi } = await import('@/dev/mockApi')
    installMockApi()
  }
  ReactDOM.createRoot(document.getElementById('root')).render(<App />)
}

start()
