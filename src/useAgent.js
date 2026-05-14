import { useState, useEffect } from 'react'
import {
  doc, collection, onSnapshot, setDoc, addDoc,
  query, orderBy, limit, serverTimestamp
} from 'firebase/firestore'
import { db } from './firebase'

const LOCAL_SERVER = 'http://localhost:7842'

export function useAgentControl() {
  const [status, setStatus] = useState({ running: false, current_task: '', command: 'idle' })
  const [logs, setLogs] = useState([])
  const [leads, setLeads] = useState([])
  const [runs, setRuns] = useState([])
  const [metrics, setMetrics] = useState({ leads: 0, sent: 0, replied: 0 })
  const [serverOnline, setServerOnline] = useState(false)

  useEffect(() => {
    const unsub1 = onSnapshot(doc(db, 'agent_control', 'status'), snap => {
      if (snap.exists()) setStatus(snap.data())
    })

    const logsQ = query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(500))
    const unsub2 = onSnapshot(logsQ, snap => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse())
    })

    const leadsQ = query(collection(db, 'leads'), orderBy('created_at', 'desc'), limit(200))
    const unsub3 = onSnapshot(leadsQ, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setLeads(data)
      setMetrics({
        leads: data.length,
        sent: data.filter(l => ['sent', 'replied'].includes(l.status)).length,
        replied: data.filter(l => l.status === 'replied').length,
      })
    })

    const runsQ = query(collection(db, 'runs'), orderBy('started_at', 'desc'), limit(20))
    const unsub4 = onSnapshot(runsQ, snap => {
      setRuns(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })

    // Chequear servidor local cada 3 segundos
    const checkServer = async () => {
      try {
        const r = await fetch(LOCAL_SERVER, { signal: AbortSignal.timeout(1500) })
        setServerOnline(r.ok)
      } catch {
        setServerOnline(false)
      }
    }
    checkServer()
    const interval = setInterval(checkServer, 3000)

    return () => { unsub1(); unsub2(); unsub3(); unsub4(); clearInterval(interval) }
  }, [])

  async function sendCommand(command, config = {}) {
    // Escribir en Firestore (para que el agente lea la config)
    await setDoc(doc(db, 'agent_control', 'status'), {
      running: command === 'start',
      command,
      current_task: command === 'start' ? 'Iniciando...' : 'Detenido',
      config,
      updated_at: serverTimestamp(),
    }, { merge: true })

    // Hablar con servidor local para lanzar/matar el proceso
    if (serverOnline) {
      try {
        await fetch(LOCAL_SERVER, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: command }),
        })
      } catch {}
    }
  }

  return { status, logs, leads, runs, metrics, sendCommand, serverOnline }
}
