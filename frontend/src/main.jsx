import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import App from './App.jsx'

axios.interceptors.request.use((config) => {
  if (
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    typeof config.url === 'string' &&
    config.url.startsWith('http://')
  ) {
    config.url = config.url.replace(/^http:\/\//, 'https://')
  }

  return config
})


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
)
