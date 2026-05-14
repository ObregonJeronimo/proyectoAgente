import React, { useState } from 'react'
import { useAgentControl } from './useAgent'
import './index.css'

function fmt(ts) {
  if (!ts) return '--:--:--'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function fmtFull(ts) {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function LeadDetail({ lead }) {
  function copy(text) {
    navigator.clipboard.writeText(text).catch(() => {})
  }
  return (
    <tr className="lead-detail">
      <td colSpan={7}>
        <div className="lead-detail-inner">
          <div className="lead-detail-block">
            <div className="lead-detail-label">Diagnostico</div>
            {lead.diagnosis
              ? <div className="lead-detail-text">{lead.diagnosis}</div>
              : <div className="pending-text">Sin analisis todavia</div>
            }
          </div>
          <div className="lead-detail-block">
            <div className="lead-detail-label">Brief del sitio</div>
            {lead.site_brief
              ? <div className="lead-detail-text">{lead.site_brief}</div>
              : <div className="pending-text">Sin analisis todavia</div>
            }
          </div>
          <div className="lead-detail-block">
            <div className="lead-detail-label">Mensaje de outreach</div>
            {lead.outreach_message
              ? <>
                  <div className="lead-detail-text">{lead.outreach_message}</div>
                  <button className="copy-btn" onClick={() => copy(lead.outreach_message)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:11,height:11}}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                    Copiar mensaje
                  </button>
                </>
              : <div className="pending-text">Sin analisis todavia</div>
            }
          </div>
        </div>
      </td>
    </tr>
  )
}

function SessionCard({ run, logs, isActive }) {
  const [open, setOpen] = useState(isActive)
  const sessionLogs = logs.filter(l => l.run_id === run.id)
  const hasError = sessionLogs.some(l => l.level === 'error')

  return (
    <div className={`session-block ${isActive ? 'active' : ''} ${hasError ? 'has-error' : ''}`}>
      <div className="session-header" onClick={() => setOpen(o => !o)}>
        <div className="session-header-left">
          <div className="dot" style={{ color: isActive ? 'var(--green)' : hasError ? 'var(--red)' : 'var(--muted)' }}></div>
          <div>
            <div className="session-title">{run.niche || '—'} / {run.city || '—'}</div>
            <div className="session-meta">{fmtFull(run.started_at)} · {run.leads_found ?? 0} leads · {run.duplicates_skipped ?? 0} duplicados</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {run.completed && <span className="badge sent">completada</span>}
          {!run.completed && !isActive && <span className="badge pending">interrumpida</span>}
          {isActive && <span className="badge analyzed">activa</span>}
          {hasError && <span className="badge" style={{background:'rgba(239,68,68,0.1)',color:'var(--red)',border:'1px solid rgba(239,68,68,0.3)'}}>error</span>}
          <span className="session-chevron">{open ? '▲' : '▼'}</span>
        </div>
      </div>
      {open && (
        <div className="log-box" style={{ borderTop: '1px solid var(--border)', borderRadius: '0 0 8px 8px' }}>
          {sessionLogs.length === 0
            ? <span style={{ color: 'var(--muted)' }}>Sin logs...</span>
            : sessionLogs.map(l => (
              <div key={l.id} className="log-line">
                <span className="log-time">{fmt(l.timestamp)}</span>
                <span className={`log-msg ${l.level}`}>{l.message}</span>
              </div>
            ))
          }
        </div>
      )}
    </div>
  )
}

function NicheManager({ niches, onAdd, onDelete, onSelect }) {
  const [input, setInput] = useState('')
  function handleAdd() {
    const trimmed = input.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setInput('')
  }
  return (
    <div className="card">
      <div className="card-title">Nichos guardados</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Ej: Plomero, Dentista, Gym..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border-strong)', color: 'var(--text)', borderRadius: 8, padding: '8px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
        />
        <button className="btn start" onClick={handleAdd} style={{ padding: '8px 16px' }}>
          + Agregar
        </button>
      </div>
      {niches.length === 0
        ? <span style={{ color: 'var(--muted)', fontSize: 12, fontFamily: 'var(--mono)' }}>Sin nichos — agregá uno arriba</span>
        : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {niches.map(n => (
              <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px 5px 14px', borderRadius: 99, border: '1px solid var(--border-strong)', background: 'var(--surface)', fontSize: 13 }}>
                <span
                  style={{ color: 'var(--text)', cursor: 'pointer' }}
                  onClick={() => onSelect(n.name)}
                  title="Usar este nicho"
                >
                  {n.name}
                </span>
                <button
                  onClick={() => onDelete(n.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 14, lineHeight: 1, padding: '0 2px' }}
                  title="Eliminar"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
      }
      {niches.length > 0 && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>Tocá un nicho para usarlo en la configuración</div>}
    </div>
  )
}

export default function App() {
  const { status, logs, leads, runs, niches, metrics, sendCommand, serverOnline, clearAll, addNiche, deleteNiche } = useAgentControl()
  const [config, setConfig] = useState({ niche: '', city: 'Cordoba', target: 25, pause: 45, max_reviews: 80, min_rating: 3.9 })
  const [clearing, setClearing] = useState(false)
  const [expandedLead, setExpandedLead] = useState(null)

  const running = status.running
  const activeRunId = runs.length > 0 && running ? runs[0].id : null

  async function handleStart() {
    await sendCommand('start', config)
  }

  async function handleStop() {
    await sendCommand('stop')
  }

  async function handleClear() {
    if (!confirm('Borrar todos los leads, sesiones y logs?')) return
    setClearing(true)
    await clearAll()
    setClearing(false)
  }

  return (
    <div className="panel">

      <div className="header">
        <div>
          <div className="agent-label">Agente de leads</div>
          <div className="agent-name">LeadBot</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <div className={`status-pill ${running ? 'running' : ''}`}>
            <div className={`dot ${running ? 'pulse' : ''}`}></div>
            {running ? 'Corriendo' : 'Detenido'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: serverOnline ? 'var(--green)' : 'var(--red)' }}>
            <div className="dot" style={{ width: 5, height: 5, color: serverOnline ? 'var(--green)' : 'var(--red)' }}></div>
            {serverOnline ? 'Servidor online' : 'Servidor offline — abrí LeadBot.bat'}
          </div>
        </div>
      </div>

      <NicheManager
        niches={niches}
        onAdd={addNiche}
        onDelete={deleteNiche}
        onSelect={name => setConfig(c => ({ ...c, niche: name }))}
      />

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
          <div className="field">
            <label>Resenas maximas</label>
            <input type="number" min="1" max="500" value={config.max_reviews} onChange={e => setConfig(c => ({ ...c, max_reviews: +e.target.value }))} />
          </div>
          <div className="field">
            <label>Estrellas minimas</label>
            <input type="number" min="1" max="5" step="0.1" value={config.min_rating} onChange={e => setConfig(c => ({ ...c, min_rating: +e.target.value }))} />
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
        <button className="btn" onClick={handleClear} disabled={clearing} style={{ marginLeft: 'auto', color: 'var(--red)', borderColor: 'rgba(239,68,68,0.4)' }}>
          <svg viewBox="0 0 24 24" fill="currentColor" style={{width:14,height:14}}><path d="M9 3h6l1 1h4v2H4V4h4L9 3zm-2 5h10l-1 13H8L7 8zm5 2v9m-3-9v9m6-9v9"/></svg>
          {clearing ? 'Limpiando...' : 'Limpiar datos'}
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
        <div className="card-title">Sesiones ({runs.length})</div>
        {runs.length === 0
          ? <span style={{ color: 'var(--muted)', fontSize: 12, fontFamily: 'var(--mono)' }}>Sin sesiones — inicia el agente</span>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {runs.map(run => (
                <SessionCard key={run.id} run={run} logs={logs} isActive={run.id === activeRunId} />
              ))}
            </div>
        }
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
                <th>Telefono</th>
                <th>Web</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0
                ? <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 12, padding: '2rem 0' }}>Inicia el agente para ver leads</td></tr>
                : leads.map(l => (
                  <React.Fragment key={l.id}>
                    <tr className="lead-row" onClick={() => setExpandedLead(expandedLead === l.id ? null : l.id)}>
                      <td>{l.name} <span style={{fontSize:10,color:'var(--muted)',marginLeft:4}}>{expandedLead === l.id ? '▲' : '▼'}</span></td>
                      <td style={{ color: 'var(--muted)' }}>{l.niche}</td>
                      <td style={{ color: 'var(--muted)' }}>{l.city}</td>
                      <td style={{ fontFamily: 'var(--mono)' }}>{l.reviews}</td>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{l.phone || <span style={{color:'var(--muted)'}}>—</span>}</td>
                      <td>{l.has_web ? <span className="has-web">Si</span> : <span className="no-web">No</span>}</td>
                      <td><span className={`badge ${l.status}`}>{l.status}</span></td>
                    </tr>
                    {expandedLead === l.id && <LeadDetail lead={l} />}
                  </React.Fragment>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
