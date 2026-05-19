import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { getExperiments, getMetrics } from '../utils/api'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#6c63ff', '#22d3a0', '#f5c542', '#4fa3ff', '#f05a5a', '#e879f9']

export default function Compare() {
  const [selected, setSelected] = useState([])
  const [metricName, setMetricName] = useState('train_loss')

  const { data } = useQuery('all-experiments', () =>
    getExperiments({ per_page: 50 }).then(r => r.data)
  )
  const experiments = data?.experiments || []

  // Fetch metrics for ALL experiments that have metrics (completed/running)
  // We fetch for all of them and just use the ones that are selected
  const eligibleIds = experiments
    .filter(e => e.status === 'completed' || e.status === 'running')
    .map(e => e.id)

  const { data: allMetricsData } = useQuery(
    ['all-metrics', eligibleIds.join(',')],
    async () => {
      if (!eligibleIds.length) return {}
      const results = await Promise.all(
        eligibleIds.map(id => getMetrics(id).then(r => ({ id, metrics: r.data.metrics })))
      )
      const map = {}
      for (const { id, metrics } of results) {
        map[id] = metrics
      }
      return map
    },
    { enabled: eligibleIds.length > 0 }
  )

  const allMetricsMap = allMetricsData || {}

  const toggle = (id) => {
    setSelected(s =>
      s.includes(id) ? s.filter(x => x !== id) : [...s, id]
    )
  }

  // Collect all metric names across selected experiments
  const allMetricNames = [...new Set(
    selected.flatMap(id => Object.keys(allMetricsMap[id] || {}))
  )]

  // Build chart data for the selected metric
  const allSteps = [...new Set(
    selected.flatMap(id =>
      (allMetricsMap[id]?.[metricName] || []).map(p => p.step)
    )
  )].sort((a, b) => a - b)

  const chartData = allSteps.map(step => {
    const row = { step }
    selected.forEach((id, i) => {
      const pts = allMetricsMap[id]?.[metricName] || []
      const pt = pts.find(p => p.step === step)
      const name = experiments.find(e => e.id === id)?.name || id.slice(0, 8)
      if (pt) row[name] = pt.value
    })
    return row
  })

  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, marginBottom: 4 }}>Compare Experiments</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
          Select completed or running experiments to overlay their training curves
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        {/* Selector */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 16,
          alignSelf: 'start',
        }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 12 }}>
            SELECT EXPERIMENTS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {experiments.map((exp, i) => {
              const isSelected = selected.includes(exp.id)
              const colorIdx = selected.indexOf(exp.id)
              const hasMetrics = exp.status === 'completed' || exp.status === 'running'
              return (
                <button
                  key={exp.id}
                  onClick={() => hasMetrics && toggle(exp.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 10px', borderRadius: 6,
                    border: `1px solid ${isSelected ? COLORS[colorIdx % COLORS.length] : 'var(--border)'}`,
                    background: isSelected ? `${COLORS[colorIdx % COLORS.length]}12` : 'transparent',
                    color: !hasMetrics ? 'var(--text-muted)' : isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    cursor: hasMetrics ? 'pointer' : 'not-allowed',
                    textAlign: 'left', fontSize: 11,
                    opacity: !hasMetrics ? 0.5 : 1,
                  }}
                >
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: isSelected ? COLORS[colorIdx % COLORS.length] : 'var(--border)',
                  }} />
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {exp.name}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>
                      {exp.status}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
          {experiments.length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Loading...</div>
          )}
        </div>

        {/* Chart area */}
        <div>
          {/* Metric selector */}
          {allMetricNames.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {allMetricNames.map(m => (
                <button key={m} onClick={() => setMetricName(m)} style={{
                  padding: '5px 12px', borderRadius: 4, fontSize: 11,
                  border: `1px solid ${metricName === m ? 'var(--accent)' : 'var(--border)'}`,
                  background: metricName === m ? 'var(--accent-dim)' : 'transparent',
                  color: metricName === m ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}>
                  {m}
                </button>
              ))}
            </div>
          )}

          {/* Chart */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: 20,
          }}>
            {selected.length === 0 ? (
              <div style={{
                height: 300, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12,
              }}>
                Select experiments from the left panel to compare
              </div>
            ) : chartData.length === 0 ? (
              <div style={{
                height: 300, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12,
              }}>
                No data for "{metricName}" in selected experiments
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="step"
                    stroke="var(--text-muted)"
                    tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                  />
                  <YAxis
                    stroke="var(--text-muted)"
                    tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                    width={55}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 6, fontSize: 11,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {selected.map((id, i) => {
                    const name = experiments.find(e => e.id === id)?.name || id.slice(0, 8)
                    return (
                      <Line
                        key={id}
                        type="monotone"
                        dataKey={name}
                        stroke={COLORS[i % COLORS.length]}
                        strokeWidth={2}
                        dot={false}
                        connectNulls={false}
                      />
                    )
                  })}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Summary table */}
          {selected.length > 0 && (
            <div style={{
              marginTop: 16,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['EXPERIMENT', 'MODEL', 'STATUS', 'FINAL METRICS'].map(h => (
                      <th key={h} style={{
                        padding: '8px 14px', textAlign: 'left',
                        fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selected.map((id, i) => {
                    const exp = experiments.find(e => e.id === id)
                    if (!exp) return null
                    return (
                      <tr key={id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '9px 14px', fontSize: 12 }}>
                          <span style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: COLORS[i % COLORS.length],
                            display: 'inline-block', marginRight: 8,
                          }} />
                          {exp.name}
                        </td>
                        <td style={{ padding: '9px 14px', fontSize: 11, color: 'var(--text-secondary)' }}>
                          {exp.model_type}
                        </td>
                        <td style={{ padding: '9px 14px', fontSize: 11, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                          {exp.status}
                        </td>
                        <td style={{ padding: '9px 14px', fontSize: 11 }}>
                          {Object.entries(exp.final_metrics || {}).slice(0, 3).map(([k, v]) => (
                            <span key={k} style={{ marginRight: 12 }}>
                              <span style={{ color: 'var(--text-muted)' }}>{k}: </span>
                              <span style={{ color: 'var(--green)', fontWeight: 600 }}>
                                {typeof v === 'number' ? v.toFixed(4) : v}
                              </span>
                            </span>
                          ))}
                          {!Object.keys(exp.final_metrics || {}).length && (
                            <span style={{ color: 'var(--text-muted)' }}>in progress</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
