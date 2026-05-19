import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from 'react-query'
import { getExperiment, getMetrics, updateExperiment, deleteExperiment } from '../utils/api'
import StatusBadge from '../components/StatusBadge'
import MetricChart from '../components/MetricChart'
import { ArrowLeft, Play, CheckCircle, XCircle, Trash2, Zap } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import toast from 'react-hot-toast'

const SectionCard = ({ title, children }) => (
  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 16 }}>
    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, marginBottom: 14, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>{title}</div>
    {children}
  </div>
)

const KV = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{label}</span>
    <span style={{ color: 'var(--text-primary)', fontSize: 11, fontWeight: 500 }}>{value ?? '—'}</span>
  </div>
)

export default function ExperimentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const { data: expData, isLoading } = useQuery(['experiment', id], () => getExperiment(id).then(r => r.data), { refetchInterval: 8000 })
  const { data: metricsData } = useQuery(['metrics', id], () => getMetrics(id).then(r => r.data), { refetchInterval: 5000 })

  const exp = expData
  const metrics = metricsData?.metrics || {}
  const cached = metricsData?.cached

  const setStatus = async (status) => {
    setUpdatingStatus(true)
    try {
      await updateExperiment(id, { status })
      qc.invalidateQueries(['experiment', id])
      qc.invalidateQueries('summary')
      toast.success(`Status updated to ${status}`)
    } catch (e) { toast.error(e.message) }
    finally { setUpdatingStatus(false) }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${exp?.name}"?`)) return
    await deleteExperiment(id)
    navigate('/experiments')
    toast.success('Deleted')
  }

  if (isLoading) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Loading...</div>
  if (!exp) return <div style={{ padding: 40, color: 'var(--red)' }}>Experiment not found</div>

  return (
    <div style={{ padding: 28, maxWidth: 1100 }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 20 }}>
        <Link to="/experiments" style={{ color: 'var(--text-muted)', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <ArrowLeft size={11} /> Experiments
        </Link>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, marginBottom: 6 }}>{exp.name}</h1>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <StatusBadge status={exp.status} />
            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{exp.model_type}</span>
            {cached !== undefined && (
              <span style={{ fontSize: 9, color: cached ? 'var(--green)' : 'var(--text-muted)', background: cached ? 'var(--green-dim)' : 'var(--bg-elevated)', border: `1px solid ${cached ? 'var(--green)' : 'var(--border)'}`, borderRadius: 3, padding: '1px 6px', display: 'flex', alignItems: 'center', gap: 3 }}>
                <Zap size={8} /> {cached ? 'REDIS HIT' : 'CACHE MISS'}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {exp.status === 'queued' && (
            <button onClick={() => setStatus('running')} disabled={updatingStatus} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--green)', background: 'var(--green-dim)', color: 'var(--green)', fontSize: 11, cursor: 'pointer' }}>
              <Play size={11} /> Start
            </button>
          )}
          {exp.status === 'running' && (
            <>
              <button onClick={() => setStatus('completed')} disabled={updatingStatus} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--blue)', background: 'var(--blue-dim)', color: 'var(--blue)', fontSize: 11, cursor: 'pointer' }}>
                <CheckCircle size={11} /> Complete
              </button>
              <button onClick={() => setStatus('failed')} disabled={updatingStatus} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--red)', background: 'var(--red-dim)', color: 'var(--red)', fontSize: 11, cursor: 'pointer' }}>
                <XCircle size={11} /> Fail
              </button>
            </>
          )}
          <button onClick={handleDelete} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'none', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer' }}>
            <Trash2 size={11} /> Delete
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
        {/* Left column */}
        <div>
          <SectionCard title="METADATA">
            <KV label="ID" value={<span style={{ fontSize: 10 }}>{exp.id}</span>} />
            <KV label="Model Type" value={exp.model_type} />
            <KV label="Dataset" value={exp.dataset} />
            <KV label="Created" value={exp.created_at ? format(new Date(exp.created_at), 'MMM d, yyyy HH:mm') : '—'} />
            <KV label="Started" value={exp.started_at ? format(new Date(exp.started_at), 'MMM d, yyyy HH:mm') : '—'} />
            <KV label="Completed" value={exp.completed_at ? format(new Date(exp.completed_at), 'MMM d, yyyy HH:mm') : '—'} />
          </SectionCard>

          {exp.description && (
            <SectionCard title="DESCRIPTION">
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{exp.description}</p>
            </SectionCard>
          )}

          <SectionCard title="HYPERPARAMETERS">
            {Object.entries(exp.hyperparameters || {}).length ? (
              Object.entries(exp.hyperparameters).map(([k, v]) => (
                <KV key={k} label={k} value={String(v)} />
              ))
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>None set</span>
            )}
          </SectionCard>

          {Object.keys(exp.final_metrics || {}).length > 0 && (
            <SectionCard title="FINAL METRICS">
              {Object.entries(exp.final_metrics).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{k}</span>
                  <span style={{ color: 'var(--green)', fontSize: 12, fontWeight: 700 }}>{typeof v === 'number' ? v.toFixed(4) : v}</span>
                </div>
              ))}
            </SectionCard>
          )}

          {exp.tags?.length > 0 && (
            <SectionCard title="TAGS">
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {exp.tags.map(t => (
                  <span key={t} style={{ fontSize: 10, color: 'var(--accent)', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 4, padding: '2px 8px' }}>{t}</span>
                ))}
              </div>
            </SectionCard>
          )}
        </div>

        {/* Right column — charts */}
        <div>
          <MetricChart metrics={metrics} title="Training Curves" />

          {Object.keys(metrics).length > 0 && (
            <div style={{ marginTop: 16, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, marginBottom: 14, color: 'var(--text-secondary)' }}>LATEST VALUES</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                {Object.entries(metrics).map(([name, pts]) => {
                  const latest = pts[pts.length - 1]
                  return (
                    <div key={name} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: 12 }}>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '0.08em' }}>{name.toUpperCase()}</div>
                      <div style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {latest?.value?.toFixed(4)}
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>step {latest?.step}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
