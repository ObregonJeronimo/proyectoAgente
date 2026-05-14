import { useState, useEffect } from 'react'
import {
  doc, collection, onSnapshot, setDoc, addDoc,
  query, orderBy, limit, serverTimestamp
} from 'firebase/firestore'
import { db } from './firebase'

export function useAgentControl() {
  const [status, setStatus] = useState({ running: false, current_task: '', command: 'idle' })
  const [logs, setLogs] = useState([])
  const [leads, setLeads] = useState([])
  const [metrics, setMetrics] = useState({ leads: 0, sent: 0, replied: 0 })

  useEffect(() => {
    const unsub1 = onSnapshot(doc(db, 'agent_control', 'status'), snap => {
      if (snap.exists()) setStatus(snap.data())
    })

    const logsQ = query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(100))
    const unsub2 = onSnapshot(logsQ, snap => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse())
    })

    const leadsQ = query(collection(db, 'leads'), orderBy('created_at', 'desc'), limit(50))
    const unsub3 = onSnapshot(leadsQ, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setLeads(data)
      setMetrics({
        leads: data.length,
        sent: data.filter(l => ['sent', 'replied'].includes(l.status)).length,
        replied: data.filter(l => l.status === 'replied').length,
      })
    })

    return () => { unsub1(); unsub2(); unsub3() }
  }, [])

  async function sendCommand(command, config = {}) {
    await setDoc(doc(db, 'agent_control', 'status'), {
      running: command === 'start',
      command,
      current_task: command === 'start' ? 'Iniciando...' : 'Detenido',
      config,
      updated_at: serverTimestamp(),
    }, { merge: true })
  }

  async function addLog(message, level = 'info') {
    await addDoc(collection(db, 'logs'), {
      message,
      level,
      timestamp: serverTimestamp(),
    })
  }

  return { status, logs, leads, metrics, sendCommand, addLog }
}
