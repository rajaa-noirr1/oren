import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import SkillTree from './SkillTree'
import { DEMO_ME, DEMO_GROWTH } from '../data/people'
import { useStore } from '../lib/store'

// Home page preview: the demo tree grows when it scrolls into view.
export default function TreeTeaser() {
  const { me } = useStore()
  const ref = useRef(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect() } }, { threshold: 0.25 })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [])
  return (
    <section className="section" id="tree">
      <div className="wrap teaser">
        <div className="teaser-copy">
          <p className="eyebrow">Your skill tree · private to you</p>
          <h2>Every swap grows your tree.</h2>
          <p className="lede">After each session you write down what you learned. Your tree keeps it: what you brought, what others taught you, and who you taught in return.</p>
          <ul className="teaser-key">
            <li><i className="k-teach" /> Orange lanterns: skills you already knew</li>
            <li><i className="k-want" /> Cobalt lanterns: skills other people taught you</li>
            <li><i className="k-wish" /> Dashed lanterns: skills on your wish list</li>
            <li><i className="k-root" /> Roots: lessons from things that went wrong</li>
            <li><i className="k-soul" /> Inner self: your AI companion, coming in spring</li>
          </ul>
          <Link to={me ? '/tree' : '/join'} className="btn btn-primary">{me ? 'Open my tree' : 'Plant your tree'} <ArrowRight size={17} /></Link>
        </div>
        <div className="teaser-art night" ref={ref}>
          {seen ? <SkillTree me={DEMO_ME} growth={DEMO_GROWTH} interactive={false} animate label="Example skill tree" /> : <div style={{ aspectRatio: '16 / 11' }} />}
        </div>
      </div>
    </section>
  )
}
