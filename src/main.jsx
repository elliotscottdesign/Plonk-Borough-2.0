import React from 'react'
import ReactDOM from 'react-dom/client'
import './i18n/i18n-setup.js'
import App from './App.jsx'
import './index.css'
import { bootstrapDataFromSheet } from './data-bootstrap.js'

const root = ReactDOM.createRoot(document.getElementById('root'))

// Brief loading indicator while we sync from the live Google Sheet.
// If sync takes >4s or fails, we render anyway with data.js defaults.
document.getElementById('root').innerHTML =
  '<div style="height:100vh;display:flex;align-items:center;justify-content:center;' +
  'background:#0A0A0F;color:#9CA3AF;font-family:system-ui,sans-serif;font-size:13px;' +
  'letter-spacing:0.08em">syncing live data…</div>'

bootstrapDataFromSheet().finally(() => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
})
