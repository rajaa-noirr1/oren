import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import useTitle from '../lib/useTitle'

export default function NotFound() {
  useTitle('Not found')
  return (
    <div className="wrap lost">
      <span className="lost-code" aria-hidden="true">404</span>
      <h1>Nothing to trade here.</h1>
      <p className="lede">This page does not exist, or the member changed their username.</p>
      <div className="hero-cta">
        <Link to="/explore" className="btn btn-primary">Go to Explore <ArrowRight size={17} /></Link>
        <Link to="/" className="btn btn-ghost">Home</Link>
      </div>
    </div>
  )
}
