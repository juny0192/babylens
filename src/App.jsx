import { Routes, Route, Outlet } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SavedProvider } from './context/SavedContext'
import { LanguageProvider } from './context/LanguageContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import ProductDetail from './pages/ProductDetail'
import Saved from './pages/Saved'
import Discover from './pages/Discover'
import Admin from './pages/Admin'
import Auth from './pages/Auth'
import Account from './pages/Account'
import Settings from './pages/Settings'

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
    <LanguageProvider>
      <AuthProvider>
        <Routes>
          {/* Standalone pages — no navbar */}
          <Route path="/admin" element={<Admin />} />
          <Route path="/auth" element={<Auth />} />

          {/* Main app with layout */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/saved" element={<Saved />} />
            <Route path="/account" element={<Account />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/product/:id" element={<ProductDetail />} />
          </Route>
        </Routes>
      </AuthProvider>
    </LanguageProvider>
  )
}
