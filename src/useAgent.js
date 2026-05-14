import { useState, useEffect } from 'react'
import {
  doc, collection, onSnapshot, setDoc, addDoc,
  query, orderBy, limit, serverTimestamp, writeBatch, getDocs, deleteDoc
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
  const [niches, setNiches] = useState([])

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

    const nichesQ = query(collection(db, 'niches'), orderBy('created_at', 'asc'))
    const unsub5 = onSnapshot(nichesQ, snap => {
      setNiches(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })

    const runsQ = query(collection(db, 'runs'), orderBy('started_at', 'desc'), limit(20))
    const unsub4 = onSnapshot(runsQ, snap => {
      setRuns(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })

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

    return () => { unsub1(); unsub2(); unsub3(); unsub4(); unsub5(); clearInterval(interval) }
  }, [])

  async function sendCommand(command, config = {}) {
    await setDoc(doc(db, 'agent_control', 'status'), {
      running: command === 'start',
      command,
      current_task: command === 'start' ? 'Iniciando...' : 'Detenido',
      config,
      updated_at: serverTimestamp(),
    }, { merge: true })

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

  async function getNiches() {
    const snap = await getDocs(collection(db, 'niches'))
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  }

  async function addNiche(name) {
    await addDoc(collection(db, 'niches'), { name, created_at: serverTimestamp() })
  }

  async function deleteNiche(id) {
    const { deleteDoc, doc: docRef } = await import('firebase/firestore')
    await deleteDoc(docRef(db, 'niches', id))
  }

  async function clearAll() {
    const cols = ['logs', 'runs', 'leads']
    for (const col of cols) {
      const snap = await getDocs(collection(db, col))
      if (snap.empty) continue
      const chunks = []
      let chunk = writeBatch(db)
      let count = 0
      snap.docs.forEach(d => {
        chunk.delete(d.ref)
        count++
        if (count % 400 === 0) {
          chunks.push(chunk)
          chunk = writeBatch(db)
          count = 0
        }
      })
      if (count > 0) chunks.push(chunk)
      for (const b of chunks) await b.commit()
    }
    await setDoc(doc(db, 'agent_control', 'status'), {
      running: false, command: 'idle', current_task: '',
      updated_at: serverTimestamp()
    }, { merge: true })
  }

  return { status, logs, leads, runs, niches, metrics, sendCommand, serverOnline, clearAll, addNiche, deleteNiche: async (id) => { await deleteDoc(doc(db, 'niches', id)) } }
}
