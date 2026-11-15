import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource-variable/unbounded'
import '@fontsource-variable/instrument-sans'
import '@fontsource-variable/jetbrains-mono'
import './styles/global.css'
import './styles/chrome.css'
import './styles/cards.css'
import './styles/pages.css'
import './styles/explore.css'
import './styles/profile.css'
import './styles/join.css'
import './styles/swaps.css'
import './styles/tree.css'
import './styles/grove.css'
import './styles/refresh.css'
import App from './App'
import { StoreProvider } from './lib/store'
import { api, BROWSER_DB } from './lib/api'
import { setPeople } from './data/people'
import { setCounts } from './lib/counts'
import { SwapMark } from './components/Logo'

const root = ReactDOM.createRoot(document.getElementById('root'))
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

// While the database starts. On GitHub Pages it starts inside the browser, which takes a few seconds the first time.
function Starting() {
  return (
    <div className="wrap page auth" aria-busy="true">
      <div className="auth-card">
        <SwapMark size={40} />
        <div>
          <p className="eyebrow">{BROWSER_DB ? 'First visit takes a moment' : 'Loading'}</p>
          <h1>{BROWSER_DB ? 'Starting OREN’s database in your browser' : 'Loading OREN'}</h1>
        </div>
        {BROWSER_DB && <p className="muted">This online version runs the real PostgreSQL database inside this page. Anything you do stays in this browser.</p>}
      </div>
    </div>
  )
}

// Shown when the API or the database is not running.
function Offline({ message, onRetry }) {
  return (
    <div className="wrap page auth">
      <div className="auth-card">
        <SwapMark size={40} />
        <div>
          <p className="eyebrow">{BROWSER_DB ? 'Database did not start' : 'Server offline'}</p>
          <h1>{BROWSER_DB ? 'OREN could not start its database' : 'OREN cannot reach its server'}</h1>
        </div>
        <p className="muted">{message}</p>
        {BROWSER_DB
          ? <p className="small muted">Try a recent version of Chrome, Edge, Firefox or Safari. Adding ?reset-demo to the address starts the demo over.</p>
          : <p className="small muted">From the OREN folder run <code>npm run dev</code>. It starts the API and the website together; PostgreSQL must be running too.</p>}
        <button className="btn btn-primary" onClick={onRetry}>Try again</button>
      </div>
    </div>
  )
}

// Everything on the first screen comes from one request to the API.
function start() {
  root.render(<Starting />)
  api('/state').then((state) => {
    setPeople(state.people)
    setCounts(state.counts)
    root.render(
      <React.StrictMode>
        <StoreProvider initial={state}>
          <BrowserRouter basename={basename}>
            <App />
          </BrowserRouter>
        </StoreProvider>
      </React.StrictMode>,
    )
  }).catch((e) => root.render(<Offline message={e.message} onRetry={start} />))
}
start()
