import { useEffect } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import Nav from './components/Nav'
import Footer from './components/Footer'
import { Toast, MatchModal } from './components/Overlays'
import Home from './pages/Home'
import Explore from './pages/Explore'
import Profile from './pages/Profile'
import Join from './pages/Join'
import SignIn from './pages/SignIn'
import Swaps from './pages/Swaps'
import Tree from './pages/Tree'
import NotFound from './pages/NotFound'
import { useStore } from './lib/store'

function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' }), 40)
      return () => clearTimeout(t)
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

function Me() {
  const { me } = useStore()
  return me ? <Profile own /> : <Navigate to="/join" replace />
}

export default function App() {
  return (
    <>
      <ScrollManager />
      <div className="backdrop" aria-hidden="true"><span className="glow g1" /><span className="glow g2" /></div>
      <Nav />
      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/u/:handle" element={<Profile />} />
          <Route path="/me" element={<Me />} />
          <Route path="/join" element={<Join />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/swaps" element={<Swaps />} />
          <Route path="/tree" element={<Tree />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <Toast />
      <MatchModal />
    </>
  )
}
