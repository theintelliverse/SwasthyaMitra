import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'
import { API_BASE_URL } from './config/runtime'

axios.interceptors.request.use((config) => {
  const sessionToken = typeof window !== 'undefined'
    ? (window.sessionStorage.getItem('token') || window.localStorage.getItem('token'))
    : null

  if (sessionToken) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${sessionToken}`
  }

  if (typeof config.url === 'string') {
    const isAbsoluteHttpUrl = /^https?:\/\//i.test(config.url)

    if (!isAbsoluteHttpUrl && API_BASE_URL) {
      const normalizedPath = config.url.startsWith('/') ? config.url : `/${config.url}`
      config.url = `${API_BASE_URL}${normalizedPath}`
    }
  }

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
    <App />
  </StrictMode>,
)
