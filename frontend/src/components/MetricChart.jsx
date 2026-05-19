import React, { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

const COLORS = ['#6c63ff', '#22d3a0', '#f5c542', '#4fa3ff', '#f05a5a', '#e879f9']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-light)',
      borderRadius: 'var(--radius)',
      padding: '8px 12px',
      fontSize: 11,
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Step {label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, display: 'flex', gap: 8, justifyContent: 'space-between' }}>
          <span>{p.name}</span>
          <span style={{ fontWeight: 600 }}>{p.value?.toFixed(4)}</span>
        </div>
      ))}
    </div>
  )
}

export default function MetricChart({ metrics = {}, title }) {
  const metricNames = Object.keys(metrics)
  const [activeMetrics, setActiveMetrics] = useState(metricNames.slice(0, 3))

  if (!metricNames.length) {
    return (
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 24,
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: 12,
      }}>
        No metrics logged yet.
      </div>
    )
  }

  // Build unified data array by step
  const allSteps = [...new Set(
    Object.values(metrics).flatMap(pts => pts.map(p => p.step))
  )].sort((a, b) => a - b)

  const chartData = allSteps.map(step => {
    const row = { step }
    for (const [name, points] of Object.entries(metrics)) {
      const pt = points.find(p => p.step === step)
      if (pt) row[name] = pt.value
    }
    return row
  })

  const toggle = (name) => {
    setActiveMetrics(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    )
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: 20,
    }}>
      {title && (
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16, fontSize: 14 }}>
          {title}
        </div>
      )}

      {/* Metric toggles */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {metricNames.map((name, i) => (
          <button
            key={name}
            onClick={() => toggle(name)}
            style={{
              padding: '3px 10px',
              borderRadius: 4,
              border: `1px solid ${activeMetrics.includes(name) ? COLORS[i % COLORS.length] : 'var(--border)'}`,
              background: activeMetrics.includes(name) ? `${COLORS[i % COLORS.length]}18` : 'transparent',
              color: activeMetrics.includes(name) ? COLORS[i % COLORS.length] : 'var(--text-muted)',
              fontSize: 11,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {name}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="step"
            stroke="var(--text-muted)"
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
            label={{ value: 'Step', position: 'insideBottom', offset: -2, fill: 'var(--text-muted)', fontSize: 10 }}
          />
          <YAxis
            stroke="var(--text-muted)"
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
            width={50}
          />
          <Tooltip content={<CustomTooltip />} />
          {metricNames.map((name, i) =>
            activeMetrics.includes(name) ? (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ) : null
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
