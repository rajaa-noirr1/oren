import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Wand2 } from 'lucide-react'
import { SwapMark } from '../components/Logo'
import { useStore } from '../lib/store'
import useTitle from '../lib/useTitle'

export default function SignIn() {
  useTitle('Sign in')
  const { signIn, signInDemo, toast } = useStore()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(false)

  const welcome = (card) => { toast(`Signed in as ${card.name.split(' ')[0]}.`); nav('/explore') }
  const submit = async (e) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr('Enter the email address you joined with.')
    if (password.length < 8) return setErr('Passwords have at least 8 characters.')
    setBusy(true)
    try { welcome(await signIn(email.trim(), password)) } catch (er) { setErr(er.message) } finally { setBusy(false) }
  }
  const demo = async () => {
    setBusy(true)
    const card = await signInDemo()
    setBusy(false)
    if (card) welcome(card)
  }

  return (
    <div className="wrap page auth">
      <div className="auth-card">
        <SwapMark size={40} />
        <div>
          <p className="eyebrow">Welcome back</p>
          <h1>Sign in to trade</h1>
        </div>
        <form onSubmit={submit} noValidate>
          <div className="field"><label htmlFor="s-email">Email</label><input id="s-email" type="email" className="input" value={email} onChange={(e) => { setEmail(e.target.value); setErr(null) }} autoComplete="email" placeholder="you@example.com" /></div>
          <div className="field"><label htmlFor="s-pass">Password</label><input id="s-pass" type="password" className="input" value={password} onChange={(e) => { setPassword(e.target.value); setErr(null) }} autoComplete="current-password" /></div>
          {err && <p className="form-err" role="alert">{err}</p>}
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <div className="or-line">or</div>
        <button type="button" className="btn btn-ghost" onClick={demo} disabled={busy}><Wand2 size={17} /> Try the demo member</button>
        <p className="small">New here? <Link to="/join" className="link">Build your card</Link></p>
      </div>
    </div>
  )
}
