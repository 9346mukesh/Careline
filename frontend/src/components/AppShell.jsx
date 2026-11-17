import { useState } from 'react'
import { Outlet } from 'react-router-dom'

import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <Sidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />

      {menuOpen ? (
        <button
          type="button"
          className="nav-scrim"
          onClick={() => setMenuOpen(false)}
          aria-label="Close navigation"
        />
      ) : null}

      <div className="app-main">
        <Topbar onOpenMenu={() => setMenuOpen(true)} />
        <main id="main-content" className="app-content" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>Careline voice front desk</span>
          <span>Pipecat · FastAPI · WebRTC</span>
        </footer>
      </div>
    </div>
  )
}
