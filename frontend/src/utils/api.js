import axios from 'axios'

const API_BASE = process.env.REACT_APP_API_URL || '/api'

const client = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message || err.message || 'API error'
    return Promise.reject(new Error(msg))
  }
)

// Experiments
export const getExperiments = (params) => client.get('/experiments/', { params })
export const getExperiment = (id) => client.get(`/experiments/${id}`)
export const createExperiment = (data) => client.post('/experiments/', data)
export const updateExperiment = (id, data) => client.patch(`/experiments/${id}`, data)
export const deleteExperiment = (id) => client.delete(`/experiments/${id}`)
export const getSummary = () => client.get('/experiments/summary')

// Metrics
export const getMetrics = (experimentId) => client.get(`/metrics/${experimentId}`)
export const getLatestMetrics = (experimentId) => client.get(`/metrics/${experimentId}/latest`)
export const logMetric = (experimentId, data) => client.post(`/metrics/${experimentId}`, data)

// Health
export const getHealth = () => client.get('/health')
