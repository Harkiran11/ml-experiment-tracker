import React, { useState } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import { Link } from 'react-router-dom'
import { getExperiments, deleteExperiment } from '../utils/api'
import StatusBadge from '../components/StatusBadge'
import CreateExperimentModal from '../components/CreateExperimentModal'
import { Plus, Trash2, Eye, Search } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

export default function Experiments() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery(
    ['experiments', statusFilter],
    () => getExperiments({ status: statusFilter || undefined }).then(r => r.data),
    { refetchInterval: 15000 }
  )

  const experiments = (data?.experiments || []).filter(e =>
    !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.model_type.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return
    try {
      await deleteExperiment(id)
      toast.success('Deleted')
      qc.invalidateQueries('experiments')
      qc.invalidateQueries('summary')
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, marginBottom: 4 }}>Experiments</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
            {data?.total ?? 0} total experiments tracked
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 16px', borderRadius: 'var(--radius)',
            border: 'none', background: 'var(--accent)',
            color: '#fff', fontSize: 12, cursor: 'pointer',
          }}
        >
          <Plus size={13} /> New Experiment
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
          <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search experiments..."
            style={{
              width: '100%', paddingLeft: 28, padding: '8px 12px 8px 28px',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontSize: 12, outline: 'none',
            }}
          />
        </div>
        {['', 'running', 'completed', 'failed', 'queued'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: '7px 12px', borderRadius: 'var(--radius)',
              border: `1px solid ${statusFilter === s ? 'var(--accent)' : 'var(--border)'}`,
              background: statusFilter === s ? 'var(--accent-dim)' : 'var(--bg-card)',
              color: statusFilter === s ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: 11, cursor: 'pointer', textTransform: 'capitalize',
            }}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['NAME', 'TYPE', 'STATUS', 'DATASET', 'METRICS', 'CREATED', ''].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.1em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</td></tr>
            ) : experiments.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No experiments found</td></tr>
            ) : experiments.map((exp, i) => (
              <tr key={exp.id} style={{ borderBottom: i < experiments.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <td style={{ padding: '10px 16px' }}>
                  <Link to={`/experiments/${exp.id}`} style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: 12 }}>
                    {exp.name}
                  </Link>
                  <div style={{ marginTop: 3 }}>
                    {exp.tags?.slice(0, 3).map(t => (
                      <span key={t} style={{ fontSize: 9, color: 'var(--text-muted)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 3, padding: '1px 5px', marginRight: 4 }}>{t}</span>
                    ))}
                  </div>
                </td>
                <td style={{ padding: '10px 16px', color: 'var(--text-secondary)', fontSize: 12 }}>{exp.model_type}</td>
                <td style={{ padding: '10px 16px' }}><StatusBadge status={exp.status} /></td>
                <td style={{ padding: '10px 16px', color: 'var(--text-secondary)', fontSize: 12 }}>{exp.dataset || '—'}</td>
                <td style={{ padding: '10px 16px' }}>
                  {Object.entries(exp.final_metrics || {}).slice(0, 2).map(([k, v]) => (
                    <div key={k} style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{k}: </span>
                      <span style={{ color: 'var(--green)', fontWeight: 600 }}>{typeof v === 'number' ? v.toFixed(4) : v}</span>
                    </div>
                  ))}
                  {!Object.keys(exp.final_metrics || {}).length && <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>—</span>}
                </td>
                <td style={{ padding: '10px 16px', color: 'var(--text-muted)', fontSize: 11 }}>
                  {exp.created_at ? formatDistanceToNow(new Date(exp.created_at), { addSuffix: true }) : '—'}
                </td>
                <td style={{ padding: '10px 16px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Link to={`/experiments/${exp.id}`} style={{ color: 'var(--text-muted)', display: 'flex' }} title="View">
                      <Eye size={13} />
                    </Link>
                    <button onClick={() => handleDelete(exp.id, exp.name)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }} title="Delete">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <CreateExperimentModal
          onClose={() => setShowModal(false)}
          onCreated={() => {
            qc.invalidateQueries('experiments')
            qc.invalidateQueries('summary')
          }}
        />
      )}
    </div>
  )
}
