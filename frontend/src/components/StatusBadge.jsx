import React from 'react'

const STATUS_CONFIG = {
  running:   { color: '#22d3a0', bg: '#22d3a015', label: 'RUNNING',   dot: true },
  completed: { color: '#4fa3ff', bg: '#4fa3ff15', label: 'DONE',      dot: false },
  failed:    { color: '#f05a5a', bg: '#f05a5a15', label: 'FAILED',    dot: false },
  queued:    { color: '#f5c542', bg: '#f5c54215', label: 'QUEUED',    dot: false },
}

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { color: '#8888a8', bg: '#8888a815', label: status?.toUpperCase(), dot: false }
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      background: cfg.bg,
      color: cfg.color,
      border: `1px solid ${cfg.color}33`,
      borderRadius: 4,
      padding: '2px 8px',
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: '0.08em',
      fontFamily: 'var(--font-mono)',
    }}>
      {cfg.dot && (
        <span style={{
          width: 5, height: 5, borderRadius: '50%',
          background: cfg.color,
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      )}
      {cfg.label}
    </span>
  )
}
