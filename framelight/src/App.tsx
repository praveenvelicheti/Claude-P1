import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { ToastProvider } from './components/ui/Toast'
import { Sidebar } from './components/layout/Sidebar'
import { Login } from './pages/auth/Login'
import { Signup } from './pages/auth/Signup'
import { Overview } from './pages/dashboard/Overview'
import { Galleries } from './pages/dashboard/Galleries'
import { NewGallery } from './pages/dashboard/NewGallery'
import { Settings } from './pages/settings/Settings'
import { GalleryPage } from './pages/gallery/GalleryPage'

function DashboardLayout() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-appbg">
        <div className="w-8 h-8 border-[3px] border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="flex h-screen overflow-hidden bg-appbg font-ui">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </div>
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
