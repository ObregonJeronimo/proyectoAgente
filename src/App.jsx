import { useState, useEffect, useRef } from 'react'
import { useAgentControl } from './useAgent'
import './index.css'

function fmt(ts) {
  if (!ts) return '--:--:--'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function fmtDate(ts) {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function App() {
  const { status, logs, leads, runs, metrics, sendCommand } = useAgentControl()
  const [config, setConfig] = useState({ niche: '', city: 'Cordoba', target: 25, pause: 45 })
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
            <input type="text" placeholder="Ej: Plomero, Dentista, Gym..." value={config.niche} onChange={e => setConfig(c => ({ ...c, niche: e.target.value }))} />
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
            <label>Pausa entre mensajes (seg) <span style={{color:'var(--muted)',fontWeight:400,fontSize:10}}>Fase 4</span></label>
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
          <div className="metric-label">Leads totales</div>
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
            ? <span style={{ color: 'var(--muted)' }}>Sin actividad aun...</span>
            : logs.map(l =>
              l.level === 'separator'
                ? <hr key={l.id} className="log-separator" />
                : <div key={l.id} className="log-line">
                    <span className="log-time">{fmt(l.timestamp)}</span>
                    <span className={`log-msg ${l.level}`}>{l.message}</span>
                  </div>
            )
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
                <th>Ciudad</th>
                <th>Resenas</th>
                <th>Web</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0
                ? <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 12, padding: '2rem 0' }}>Inicia el agente para ver leads</td></tr>
                : leads.map(l => (
                  <tr key={l.id}>
                    <td>{l.name}</td>
                    <td style={{ color: 'var(--muted)' }}>{l.niche}</td>
                    <td style={{ color: 'var(--muted)' }}>{l.city}</td>
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

      <div className="card">
        <div className="card-title">Historial de corridas</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Nicho</th>
                <th>Ciudad</th>
                <th>Leads encontrados</th>
                <th>Duplicados salteados</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {runs.length === 0
                ? <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 12, padding: '2rem 0' }}>Sin corridas aun</td></tr>
                : runs.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{fmtDate(r.started_at)}</td>
                    <td>{r.niche}</td>
                    <td style={{ color: 'var(--muted)' }}>{r.city}</td>
                    <td style={{ fontFamily: 'var(--mono)' }}>{r.leads_found ?? '—'}</td>
                    <td style={{ fontFamily: 'var(--mono)', color: 'var(--muted)' }}>{r.duplicates_skipped ?? '—'}</td>
                    <td><span className={`badge ${r.completed ? 'analyzed' : 'pending'}`}>{r.completed ? 'completada' : 'interrumpida'}</span></td>
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
