import { Routes, Route } from 'react-router-dom'
import { SavedProvider } from './context/SavedContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import ProductDetail from './pages/ProductDetail'
import Saved from './pages/Saved'
import Discover from './pages/Discover'

export default function App() {
  return (
    <SavedProvider>
      <div className="max-w-lg mx-auto relative">
        <Navbar />
        {/* Top nav spacer */}
        <div className="h-14" />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/product/:id" element={<ProductDetail />} />
        </Routes>
      </div>
    </SavedProvider>
  )
}
