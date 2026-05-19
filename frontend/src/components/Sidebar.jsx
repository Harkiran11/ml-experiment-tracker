import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FlaskConical, BarChart3, Activity, Settings } from 'lucide-react'

const NAV = [
  { to: '/',            icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/experiments', icon: FlaskConical,    label: 'Experiments' },
  { to: '/compare',     icon: BarChart3,        label: 'Compare' },
]

export default function Sidebar() {
  return (
    <aside style={{
      width: 200,
      background: 'var(--bg-card)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '0',
      flexShrink: 0,
      height: '100vh',
      position: 'sticky',
      top: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 16px 16px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28,
            background: 'var(--accent)',
            borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Activity size={14} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: 'var(--text-primary)' }}>ML TRACKER</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>EXPERIMENT OPS</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '12px 8px', flex: 1 }}>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 10px',
              borderRadius: 'var(--radius)',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: isActive ? 'var(--bg-elevated)' : 'transparent',
              textDecoration: 'none',
              fontSize: 12,
              fontWeight: isActive ? 600 : 400,
              marginBottom: 2,
              transition: 'all 0.15s',
              borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
            })}
          >
            <Icon size={14} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>v1.0.0 · Flask + React</div>
      </div>
    </aside>
  )
}
