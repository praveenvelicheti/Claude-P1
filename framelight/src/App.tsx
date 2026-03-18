import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useGalleries } from './hooks/useGalleries'
import { ToastProvider } from './components/ui/Toast'
import { Sidebar } from './components/layout/Sidebar'
import { MobileTopbar } from './components/layout/MobileTopbar'
import { BottomTabBar } from './components/layout/BottomTabBar'
import { Login } from './pages/auth/Login'
import { Signup } from './pages/auth/Signup'
import { Overview } from './pages/dashboard/Overview'
import { Galleries } from './pages/dashboard/Galleries'
import { NewGallery } from './pages/dashboard/NewGallery'
import { Settings } from './pages/settings/Settings'
import { GalleryPage } from './pages/gallery/GalleryPage'

function DashboardLayout() {
  const { user, loading } = useAuth()
  const { galleries } = useGalleries(user?.id)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Lock body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-appbg">
        <div className="w-8 h-8 border-[3px] border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return (
    /* Mobile: column, natural scroll. Tablet/Desktop: row, fixed height */
    <div className="flex flex-col min-h-screen md:flex-row md:h-screen md:overflow-hidden bg-appbg font-ui">

      {/* Sidebar — drawer on mobile, static on md+ */}
      <Sidebar isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Drawer backdrop — mobile only */}
      <div
        className={[
          'fixed inset-0 z-[200] bg-ink/50 backdrop-blur-[3px] md:hidden',
          'transition-opacity duration-300',
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={() => setDrawerOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col md:overflow-hidden">
        {/* Mobile topbar — hidden on md+ */}
        <MobileTopbar onMenuClick={() => setDrawerOpen(true)} />

        {/* Page outlet */}
        <Outlet />
      </div>

      {/* Bottom tab bar — mobile only */}
      <BottomTabBar galleryCount={galleries.length} />
    </div>
  )
}

function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login"   element={<AuthRedirect><Login /></AuthRedirect>} />
          <Route path="/signup"  element={<AuthRedirect><Signup /></AuthRedirect>} />
          <Route path="/g/:slug" element={<GalleryPage />} />

          {/* Protected dashboard routes */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Overview />} />
            <Route path="galleries" element={<Galleries />} />
            <Route path="new" element={<NewGallery />} />
            <Route path="gallery/:id" element={<NewGallery />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Fallback */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
