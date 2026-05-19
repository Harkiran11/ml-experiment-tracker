import React, { useState } from 'react'
import { X, Plus, Minus } from 'lucide-react'
import { createExperiment } from '../utils/api'
import toast from 'react-hot-toast'

const INPUT_STYLE = {
  width: '100%',
  background: 'var(--bg)',
  border: '1px solid var(--border-light)',
  borderRadius: 'var(--radius)',
  padding: '8px 12px',
  color: 'var(--text-primary)',
  fontSize: 12,
  outline: 'none',
}

const LABEL_STYLE = {
  display: 'block',
  fontSize: 10,
  color: 'var(--text-muted)',
  marginBottom: 5,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
}

const DEFAULT_HYPERPARAMS = [
  { key: 'lr', value: '0.001' },
  { key: 'batch_size', value: '32' },
  { key: 'epochs', value: '50' },
]

export default function CreateExperimentModal({ onClose, onCreated }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    model_type: 'CNN',
    dataset: '',
    tags: '',
  })
  const [params, setParams] = useState(DEFAULT_HYPERPARAMS)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const addParam = () => setParams(p => [...p, { key: '', value: '' }])
  const removeParam = (i) => setParams(p => p.filter((_, idx) => idx !== i))
  const updateParam = (i, field, val) => setParams(p => p.map((row, idx) => idx === i ? { ...row, [field]: val } : row))

  const submit = async () => {
    if (!form.name.trim() || !form.model_type.trim()) {
      toast.error('Name and model type are required')
      return
    }
    setLoading(true)
    try {
      const hyperparameters = {}
      for (const { key, value } of params) {
        if (key.trim()) hyperparameters[key.trim()] = isNaN(value) ? value : Number(value)
      }
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
      await createExperiment({ ...form, hyperparameters, tags })
      toast.success('Experiment created')
      onCreated?.()
      onClose()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-lg)',
        padding: 28,
        width: '100%',
        maxWidth: 500,
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16 }}>New Experiment</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={LABEL_STYLE}>Name *</label>
            <input style={INPUT_STYLE} value={form.name} onChange={e => set('name', e.target.value)} placeholder="ResNet-50 Baseline" />
          </div>

          <div>
            <label style={LABEL_STYLE}>Description</label>
            <textarea
              style={{ ...INPUT_STYLE, resize: 'vertical', minHeight: 60 }}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Brief description of this run..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={LABEL_STYLE}>Model Type *</label>
              <select style={INPUT_STYLE} value={form.model_type} onChange={e => set('model_type', e.target.value)}>
                {['CNN', 'Transformer', 'RNN', 'LLM', 'GAN', 'RL', 'Object Detection', 'Other'].map(t => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={LABEL_STYLE}>Dataset</label>
              <input style={INPUT_STYLE} value={form.dataset} onChange={e => set('dataset', e.target.value)} placeholder="ImageNet" />
            </div>
          </div>

          <div>
            <label style={LABEL_STYLE}>Tags (comma separated)</label>
            <input style={INPUT_STYLE} value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="baseline, resnet, production" />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ ...LABEL_STYLE, margin: 0 }}>Hyperparameters</label>
              <button onClick={addParam} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', gap: 4, alignItems: 'center', fontSize: 11 }}>
                <Plus size={11} /> Add
              </button>
            </div>
            {params.map((row, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 6, marginBottom: 6 }}>
                <input style={INPUT_STYLE} placeholder="key" value={row.key} onChange={e => updateParam(i, 'key', e.target.value)} />
                <input style={INPUT_STYLE} placeholder="value" value={row.value} onChange={e => updateParam(i, 'value', e.target.value)} />
                <button onClick={() => removeParam(i)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer' }}>
                  <Minus size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '8px 16px', borderRadius: 'var(--radius)',
            border: '1px solid var(--border-light)', background: 'none',
            color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer',
          }}>
            Cancel
          </button>
          <button onClick={submit} disabled={loading} style={{
            padding: '8px 20px', borderRadius: 'var(--radius)',
            border: 'none', background: 'var(--accent)',
            color: '#fff', fontSize: 12, cursor: 'pointer',
            opacity: loading ? 0.6 : 1,
          }}>
            {loading ? 'Creating...' : 'Create Experiment'}
          </button>
        </div>
      </div>
    </div>
  )
}
