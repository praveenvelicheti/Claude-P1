import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button'

interface TopbarProps {
  title: string
  titleEm?: string
  showNew?: boolean
  children?: React.ReactNode
}

export function Topbar({ title, titleEm, showNew = false, children }: TopbarProps) {
  const navigate = useNavigate()

  return (
    <header className="hidden md:flex h-[58px] flex-shrink-0 bg-white border-b border-border items-center px-8 gap-4">
      <div className="flex-1 font-display text-[22px] font-medium text-ink">
        {title}
        {titleEm && <em className="italic text-teal"> {titleEm}</em>}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-teal-pale border border-border rounded-lg px-3.5 py-[7px] w-[220px]">
        <svg className="w-3.5 h-3.5 text-ink-muted flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          className="bg-transparent border-none outline-none font-ui text-[13px] text-ink w-full placeholder:text-ink-muted"
          placeholder="Search…"
        />
      </div>

      {children}

      {showNew && (
        <Button variant="primary" onClick={() => navigate('/dashboard/new')}>
          <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Gallery
        </Button>
      )}
    </header>
  )
}
