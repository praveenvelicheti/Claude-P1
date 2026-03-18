import { useLocation, useNavigate } from 'react-router-dom'

interface BottomTabBarProps {
  galleryCount?: number
}

export function BottomTabBar({ galleryCount = 0 }: BottomTabBarProps) {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const isOverview  = pathname === '/dashboard'
  const isGalleries = pathname.startsWith('/dashboard/galleries')
  const isNew       = pathname.startsWith('/dashboard/new') || (pathname.startsWith('/dashboard/gallery/'))
  const isSettings  = pathname.startsWith('/dashboard/settings')

  const tab = (active: boolean) =>
    `flex-1 flex flex-col items-center justify-center gap-[3px] cursor-pointer border-none bg-transparent font-ui p-0 relative transition-colors duration-150
     ${active ? 'text-teal' : 'text-ink-muted'}`

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-border flex flex-col"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex h-[60px]">

        {/* Overview */}
        <button className={tab(isOverview)} onClick={() => navigate('/dashboard')}>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
          <span className="text-[10px] font-medium tracking-[0.02em]">Overview</span>
        </button>

        {/* Galleries */}
        <button className={tab(isGalleries)} onClick={() => navigate('/dashboard/galleries')}>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
          </svg>
          <span className="text-[10px] font-medium tracking-[0.02em]">Galleries</span>
          {galleryCount > 0 && (
            <span className="absolute top-1.5 right-[calc(50%-18px)] w-[15px] h-[15px] rounded-full bg-teal text-white text-[8px] font-semibold flex items-center justify-center">
              {galleryCount > 99 ? '99' : galleryCount}
            </span>
          )}
        </button>

        {/* New */}
        <button className={tab(isNew)} onClick={() => navigate('/dashboard/new')}>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="16"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
          <span className="text-[10px] font-medium tracking-[0.02em]">New</span>
        </button>

        {/* Settings */}
        <button className={tab(isSettings)} onClick={() => navigate('/dashboard/settings')}>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
          <span className="text-[10px] font-medium tracking-[0.02em]">Settings</span>
        </button>

      </div>
    </nav>
  )
}
