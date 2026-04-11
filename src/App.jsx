import { Routes, Route, Outlet } from 'react-router-dom'
import { SavedProvider } from './context/SavedContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import ProductDetail from './pages/ProductDetail'
import Saved from './pages/Saved'
import Discover from './pages/Discover'
import Admin from './pages/Admin'

function AppLayout() {
  return (
    <SavedProvider>
      <div className="max-w-lg mx-auto relative">
        <Navbar />
        <div className="h-14" />
        <Outlet />
      </div>
    </SavedProvider>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Admin — standalone, no navbar */}
      <Route path="/admin" element={<Admin />} />

      {/* Main app with layout */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/saved" element={<Saved />} />
        <Route path="/product/:id" element={<ProductDetail />} />
      </Route>
    </Routes>
  )
}
