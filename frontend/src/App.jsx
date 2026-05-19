import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Toaster } from 'react-hot-toast'
import Sidebar from './components/Sidebar.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Experiments from './pages/Experiments.jsx'
import ExperimentDetail from './pages/ExperimentDetail.jsx'
import Compare from './pages/Compare.jsx'
import './styles/global.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 5000 },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
          <Sidebar />
          <main style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/experiments" element={<Experiments />} />
              <Route path="/experiments/:id" element={<ExperimentDetail />} />
              <Route path="/compare" element={<Compare />} />
            </Routes>
          </main>
        </div>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-light)',
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
            },
          }}
        />
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `}</style>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
