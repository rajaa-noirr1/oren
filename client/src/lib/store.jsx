import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { PERSON, setPeople } from '../data/people'
import { setCounts } from './counts'
import { trade } from './match'
import { api } from './api'
import { skillName } from '../components/SkillIcon'

// The website's state. Everything except the colour theme lives in PostgreSQL and arrives through the API:
// me → users, user_skills · decisions → swipes · sessions → swap_sessions · threads → messages
// growth → skill_tree() (learning_log, endorsements, skill_confidence, lessons) · people → member_cards
const THEME_KEY = 'oren:theme'
const Ctx = createContext(null)

const firstName = (p) => p.name.split(' ')[0]
export const today = () => new Date().toISOString().slice(0, 10)
export const emptyGrowth = () => ({ start: today(), learned: {}, taught: {}, wished: {}, lessons: [] })

export function StoreProvider({ initial, children }) {
  const [me, setMe] = useState(initial.me)
  const [growth, setGrowth] = useState(initial.growth)
  const [people, setPeopleState] = useState(initial.people)
  const [decisions, setDecisions] = useState(initial.decisions)
  const [sessions, setSessions] = useState(initial.sessions)
  const [threads, setThreads] = useState(initial.threads)
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem(THEME_KEY) || 'system' } catch { return 'system' } })
  const [history, setHistory] = useState([])
  const [toastMsg, setToastMsg] = useState(null)
  const [matchWith, setMatchWith] = useState(null)
  const meRef = useRef(me)
  meRef.current = me

  useEffect(() => {
    try { localStorage.setItem(THEME_KEY, theme) } catch { /* storage blocked */ }
    const root = document.documentElement
    if (theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', theme)
  }, [theme])

  const toast = useCallback((msg) => setToastMsg({ msg, id: Date.now() }), [])
  useEffect(() => {
    if (!toastMsg) return undefined
    const t = setTimeout(() => setToastMsg(null), 3400)
    return () => clearTimeout(t)
  }, [toastMsg])
  // Actions show the server's message when something fails and resolve to null, so a form can stay open.
  const fail = useCallback((e) => { toast(e.message); return null }, [toast])

  // A whole new state from the server: after signing in, signing up or signing out.
  const applyState = useCallback((s) => {
    setPeople(s.people)
    setCounts(s.counts)
    setPeopleState(s.people)
    setMe(s.me); setGrowth(s.growth); setDecisions(s.decisions); setSessions(s.sessions); setThreads(s.threads)
    setHistory([]); setMatchWith(null)
    return s.me
  }, [])

  // ── Accounts ──
  const register = useCallback((email, password, card) => api('/auth/register', { method: 'POST', body: { email, password, card } }).then(applyState), [applyState])
  const signIn = useCallback((email, password) => api('/auth/login', { method: 'POST', body: { email, password } }).then(applyState), [applyState])
  const signInDemo = useCallback(() => api('/auth/demo', { method: 'POST' }).then(applyState).catch(fail), [applyState, fail])
  const signOut = useCallback(() => api('/auth/logout', { method: 'POST' }).then(applyState).catch(fail), [applyState, fail])
  const saveCard = useCallback(async (card) => {
    const r = await api('/me', { method: 'PUT', body: { card } })
    setMe(r.me); setGrowth(r.growth)
    return r.me
  }, [])

  // ── Swiping ──
  const statusOf = useCallback((id) => {
    const p = PERSON[id]
    const d = decisions[id]
    if (!p) return null
    if (d === 'swap') return p.likesYou || p.requestedYou ? 'matched' : 'sent'
    if (d === 'pass') return 'passed'
    if (d === 'save') return p.requestedYou ? 'incoming' : 'saved'
    if (p.requestedYou) return 'incoming'
    return null
  }, [decisions])

  // what a sample member says when you match: an offer built from your trade
  const greetingFor = useCallback((p) => {
    const t = trade(meRef.current, p)
    const theirs = t.get[0] ? skillName(t.get[0].skill) : skillName(p.teaches[0].skill)
    const mine = t.give[0] ? skillName(t.give[0].skill) : null
    return mine ? `Hey! Happy to trade: my ${theirs} for your ${mine}. Which evening works for you?` : `Hey! I can help you with ${theirs}. What would you like to start with?`
  }, [])

  const decide = useCallback((p, d) => {
    setDecisions((prev) => ({ ...prev, [p.id]: d }))   // the deck moves on at once; the database confirms
    setHistory((h) => [...h, p.id])
    api(`/decisions/${p.handle}`, { method: 'PUT', body: { decision: d, greeting: greetingFor(p) } }).then((r) => {
      setDecisions(r.decisions); setThreads(r.threads)
      if (d === 'swap') { if (r.matched) setMatchWith(p); else toast(`Swap request sent to ${firstName(p)}.`) }
      else if (d === 'save') toast(`${firstName(p)} saved. Find them in Swaps.`)
    }).catch((e) => {
      setDecisions((prev) => { const n = { ...prev }; delete n[p.id]; return n })
      toast(e.message)
    })
  }, [greetingFor, toast])

  const undoLast = useCallback(() => {
    const last = history[history.length - 1]
    if (!last) return null
    setHistory((h) => h.slice(0, -1))
    setDecisions((prev) => { const n = { ...prev }; delete n[last]; return n })
    api(`/decisions/${last}`, { method: 'DELETE' }).then((r) => setDecisions(r.decisions)).catch((e) => toast(e.message))
    return last
  }, [history, toast])

  const decline = useCallback((p) => {
    setDecisions((prev) => ({ ...prev, [p.id]: 'pass' }))
    api(`/decisions/${p.handle}`, { method: 'PUT', body: { decision: 'pass' } }).then((r) => { setDecisions(r.decisions); toast(`Request from ${firstName(p)} declined.`) }).catch((e) => toast(e.message))
  }, [toast])

  const withdraw = useCallback((p) => {
    setDecisions((prev) => { const n = { ...prev }; delete n[p.id]; return n })
    api(`/decisions/${p.handle}`, { method: 'DELETE' }).then((r) => setDecisions(r.decisions)).catch((e) => toast(e.message))
  }, [toast])

  // ── Sessions and messages ──
  const addSession = useCallback((s) => api('/sessions', { method: 'POST', body: s }).then((r) => {
    setSessions(r.sessions)
    if (r.confirmedBy) setTimeout(() => toast(`${r.confirmedBy} confirmed your session.`), 1800)
    return true
  }).catch(fail), [toast, fail])

  const cancelSession = useCallback((id) => api(`/sessions/${id}`, { method: 'DELETE' }).then((r) => { setSessions(r.sessions); return true }).catch(fail), [fail])

  // Your message shows at once; a sample member's answer appears a moment later.
  const sendMessage = useCallback((personId, text, reply) => {
    setThreads((prev) => ({ ...prev, [personId]: [...(prev[personId] || []), { from: 'me', text, at: Date.now() }] }))
    return api(`/messages/${personId}`, { method: 'POST', body: { text, reply } })
      .then((r) => { setTimeout(() => setThreads(r.threads), 1100); return true })
      .catch(fail)
  }, [fail])

  // A finished session: what you learned grows a cobalt branch, what you taught grows fruit.
  const logSession = useCallback((s, text) => api(`/sessions/${s.id}/log`, { method: 'POST', body: { text } }).then((r) => {
    setGrowth(r.growth); setSessions(r.sessions)
    toast(r.endorsedBy ? `${r.endorsedBy} endorsed your ${skillName(r.skill)}. It grew on your tree.` : `Saved. ${skillName(r.skill)} grew on your tree.`)
    return true
  }).catch(fail), [toast, fail])

  // ── The skill tree ──
  const tree = useCallback((promise) => promise.then((r) => { setGrowth(r.growth); return r.growth }).catch(fail), [fail])
  const addLesson = useCallback((l) => tree(api('/lessons', { method: 'POST', body: l })), [tree])
  const updateLesson = useCallback((id, patch) => tree(api(`/lessons/${id}`, { method: 'PATCH', body: patch })), [tree])
  const removeLesson = useCallback((id) => tree(api(`/lessons/${id}`, { method: 'DELETE' })), [tree])
  const setConfident = useCallback((skill, confident) => tree(api(`/confidence/${skill}`, { method: 'PUT', body: { confident } })), [tree])

  const lists = useMemo(() => {
    const by = (s) => people.filter((p) => statusOf(p.id) === s)
    return { matches: by('matched'), incoming: by('incoming'), sent: by('sent'), saved: by('saved') }
  }, [people, statusOf])

  const value = {
    me, growth, register, signIn, signInDemo, signOut, saveCard,
    logSession, addLesson, updateLesson, removeLesson, setConfident,
    decisions, decide, undo: undoLast, canUndo: history.length > 0, statusOf, decline, withdraw,
    ...lists, sessions, addSession, cancelSession, threads, sendMessage, theme, setTheme,
    toast, toastMsg, matchWith, closeMatch: () => setMatchWith(null), people,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useStore = () => useContext(Ctx)
export { firstName }
