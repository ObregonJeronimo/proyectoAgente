import { useState, useEffect, useRef } from 'react'
import { useAgentControl } from './useAgent'
import './index.css'

const NICHES = [
  'Plomero', 'Dentista', 'Techista / Roofer', 'Peluqueria / Salon',
  'HVAC / Aire acondicionado', 'Estudio contable', 'Veterinaria', 'Mecanico'
]

function fmt(ts) {
  if (!ts) return '--:--:--'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function App() {
  const { status, logs, leads, metrics, sendCommand } = useAgentControl()
  const [config, setConfig] = useState({ niche: 'Plomero', city: 'Cordoba', target: 25, pause: 45 })
  const logRef = useRef(null)

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [logs])

  async function handleStart() {
    await sendCommand('start', config)
  }

  async function handleStop() {
    await sendCommand('stop')
  }

  const running = status.running

  return (
    <div className="panel">

      <div className="header">
        <div>
          <div className="agent-label">Agente de leads</div>
          <div className="agent-name">LeadBot</div>
        </div>
        <div className={`status-pill ${running ? 'running' : ''}`}>
          <div className={`dot ${running ? 'pulse' : ''}`}></div>
          {running ? 'Corriendo' : 'Detenido'}
        </div>
      </div>

      <div className="card">
        <div className="card-title">Configuracion</div>
        <div className="config-grid">
          <div className="field">
            <label>Nicho</label>
            <select value={config.niche} onChange={e => setConfig(c => ({ ...c, niche: e.target.value }))}>
              {NICHES.map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Ciudad</label>
            <input type="text" value={config.city} onChange={e => setConfig(c => ({ ...c, city: e.target.value }))} />
          </div>
          <div className="field">
            <label>Leads objetivo</label>
            <input type="number" min="5" max="100" value={config.target} onChange={e => setConfig(c => ({ ...c, target: +e.target.value }))} />
          </div>
          <div className="field">
            <label>Pausa entre mensajes (seg)</label>
            <input type="number" min="15" max="300" value={config.pause} onChange={e => setConfig(c => ({ ...c, pause: +e.target.value }))} />
          </div>
        </div>
      </div>

      <div className="controls">
        <button className="btn start" onClick={handleStart} disabled={running}>
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          Iniciar agente
        </button>
        <button className="btn stop" onClick={handleStop} disabled={!running}>
          <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12"/></svg>
          Detener
        </button>
      </div>

      {running && (
        <div className="task-bar">
          <div className="spinner"></div>
          <span>{status.current_task || 'Procesando...'}</span>
        </div>
      )}

      <div className="metrics-grid">
        <div className="metric">
          <div className="metric-label">Leads</div>
          <div className="metric-value">{metrics.leads}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Enviados</div>
          <div className="metric-value amber">{metrics.sent}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Respuestas</div>
          <div className="metric-value green">{metrics.replied}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Log en tiempo real</div>
        <div className="log-box" ref={logRef}>
          {logs.length === 0
            ? <span style={{ color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 12 }}>Sin actividad aun...</span>
            : logs.map(l => (
              <div key={l.id} className="log-line">
                <span className="log-time">{fmt(l.timestamp)}</span>
                <span className={`log-msg ${l.level}`}>{l.message}</span>
              </div>
            ))
          }
        </div>
      </div>

      <div className="card">
        <div className="card-title">Leads ({leads.length})</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Negocio</th>
                <th>Nicho</th>
                <th>Resenas</th>
                <th>Web</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0
                ? <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 12, padding: '2rem 0' }}>Inicia el agente para ver leads</td></tr>
                : leads.map(l => (
                  <tr key={l.id}>
                    <td>{l.name}</td>
                    <td style={{ color: 'var(--muted)' }}>{l.niche}</td>
                    <td style={{ fontFamily: 'var(--mono)' }}>{l.reviews}</td>
                    <td>{l.has_web ? <span className="has-web">Si</span> : <span className="no-web">No</span>}</td>
                    <td><span className={`badge ${l.status}`}>{l.status}</span></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
