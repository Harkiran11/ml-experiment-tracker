import React, { useEffect, useState } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { getSummary, getExperiments } from '../utils/api'
import StatusBadge from '../components/StatusBadge'
import { FlaskConical, Activity, CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const StatCard = ({ label, value, color, icon: Icon }) => (
  <div style={{
    background: 'var(--bg-card)',
    border: `1px solid ${color}33`,
    borderRadius: 'var(--radius-lg)',
    padding: '16px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }}>
    <div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 800, color }}>{value}</div>
    </div>
    <div style={{ width: 36, height: 36, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={16} color={color} />
    </div>
  </div>
)

export default function Dashboard() {
  const { data: summary, isLoading: summaryLoading } = useQuery('summary', () => getSummary().then(r => r.data), { refetchInterval: 10000 })
  const { data: expsData } = useQuery('recentExps', () => getExperiments({ per_page: 8 }).then(r => r.data))

  const experiments = expsData?.experiments || []

  return (
    <div style={{ padding: 28 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, marginBottom: 4 }}>Command Center</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
          Real-time visibility into all training runs · Redis-cached metrics · sub-100ms reads
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        <StatCard label="TOTAL EXPERIMENTS" value={summary?.total ?? '—'} color="var(--accent)" icon={FlaskConical} />
        <StatCard label="RUNNING NOW" value={summary?.running ?? '—'} color="var(--green)" icon={Activity} />
        <StatCard label="COMPLETED" value={summary?.completed ?? '—'} color="var(--blue)" icon={CheckCircle} />
        <StatCard label="FAILED" value={summary?.failed ?? '—'} color="var(--red)" icon={XCircle} />
      </div>

      {/* Recent Experiments */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
      }}>
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>Recent Experiments</span>
          <Link to="/experiments" style={{ fontSize: 11, color: 'var(--accent)', display: 'flex', gap: 4, alignItems: 'center' }}>
            View all <ArrowRight size={11} />
          </Link>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['NAME', 'MODEL', 'STATUS', 'DATASET', 'CREATED'].map(h => (
                <th key={h} style={{
                  padding: '8px 16px', textAlign: 'left',
                  fontSize: 9, color: 'var(--text-muted)', fontWeight: 600,
                  letterSpacing: '0.1em',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {experiments.map((exp, i) => (
              <tr key={exp.id} style={{
                borderBottom: i < experiments.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <td style={{ padding: '10px 16px' }}>
                  <Link to={`/experiments/${exp.id}`} style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: 12 }}>
                    {exp.name}
                  </Link>
                  {exp.tags?.length > 0 && (
                    <div style={{ marginTop: 2 }}>
                      {exp.tags.slice(0, 2).map(t => (
                        <span key={t} style={{
                          fontSize: 9, color: 'var(--text-muted)',
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border)',
                          borderRadius: 3, padding: '1px 5px', marginRight: 4,
                        }}>{t}</span>
                      ))}
                    </div>
                  )}
                </td>
                <td style={{ padding: '10px 16px', color: 'var(--text-secondary)', fontSize: 12 }}>{exp.model_type}</td>
                <td style={{ padding: '10px 16px' }}><StatusBadge status={exp.status} /></td>
                <td style={{ padding: '10px 16px', color: 'var(--text-secondary)', fontSize: 12 }}>{exp.dataset || '—'}</td>
                <td style={{ padding: '10px 16px', color: 'var(--text-muted)', fontSize: 11 }}>
                  {exp.created_at ? formatDistanceToNow(new Date(exp.created_at), { addSuffix: true }) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {experiments.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
            No experiments yet. Create one to get started.
          </div>
        )}
      </div>
    </div>
  )
}
