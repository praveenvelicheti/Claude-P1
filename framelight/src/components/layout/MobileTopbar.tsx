import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

interface MobileTopbarProps {
  onMenuClick: () => void
}

export function MobileTopbar({ onMenuClick }: MobileTopbarProps) {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const initials = (profile?.studio_name ?? 'U').slice(0, 2).toUpperCase()

  return (
    <header className="md:hidden flex-shrink-0 h-[58px] bg-white border-b border-border flex items-center px-4 gap-3 sticky top-0 z-50">
      {/* Hamburger */}
      <button
        onClick={onMenuClick}
        className="w-9 h-9 rounded-[9px] border border-border bg-appbg flex items-center justify-center text-ink cursor-pointer flex-shrink-0"
        aria-label="Open menu"
      >
        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {/* Logo centred */}
      <div className="flex-1 flex justify-center">
        <span className="font-display text-[20px] font-medium text-ink tracking-[0.04em]">
          Frame<em className="text-teal italic">light</em>
        </span>
      </div>

      {/* Avatar → Settings */}
      <div
        onClick={() => navigate('/dashboard/settings')}
        className="w-9 h-9 rounded-full bg-teal flex items-center justify-center text-[11px] font-semibold text-ink cursor-pointer flex-shrink-0"
      >
        {initials}
      </div>
    </header>
  )
}
