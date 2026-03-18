import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const navItems = [
  {
    section: 'Workspace',
    items: [
      { to: '/dashboard', label: 'Overview', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
      )},
      { to: '/dashboard/galleries', label: 'Galleries', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
        </svg>
      )},
    ]
  },
  {
    section: 'Account',
    items: [
      { to: '/dashboard/settings', label: 'Settings', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
        </svg>
      )},
    ]
  }
]

export function Sidebar() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const storageGB = ((profile?.storage_used_bytes ?? 0) / 1e9)
  const storageLimit = 5
  const storagePct = Math.min((storageGB / storageLimit) * 100, 100)

  const initials = (profile?.studio_name ?? 'U').slice(0, 2).toUpperCase()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <aside className="w-[232px] flex-shrink-0 bg-ink flex flex-col overflow-hidden">
      {/* Logo */}
      <div className="h-[58px] flex items-center px-[22px] border-b border-white/[0.07] flex-shrink-0">
        <span className="font-display text-[22px] font-medium text-white tracking-[0.04em]">
          Frame<em className="text-teal-light italic">light</em>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto">
        {navItems.map(section => (
          <div key={section.section} className="px-3.5 pt-5 pb-2">
            <div className="text-[9px] font-semibold tracking-[0.14em] uppercase text-white/[0.28] px-2 mb-1.5">
              {section.section}
            </div>
            {section.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/dashboard'}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-[9px] rounded-lg text-[13.5px] font-normal mb-px transition-all duration-150 select-none cursor-pointer
                  ${isActive
                    ? 'bg-teal/[0.18] text-white font-medium [&_svg]:text-teal-light [&_svg]:opacity-100'
                    : 'text-white/50 hover:bg-white/[0.07] hover:text-white/85 [&_svg]:opacity-60 hover:[&_svg]:opacity-100'
                  }`
                }
              >
                <span className="w-4 h-4 flex-shrink-0 [&_svg]:w-4 [&_svg]:h-4">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="mt-auto px-3.5 py-4 border-t border-white/[0.07]">
        {/* Storage */}
        <div className="px-3.5 py-3.5 bg-white/[0.05] rounded-[10px] mb-3.5">
          <div className="flex justify-between text-[11px] text-white/40 mb-2">
            <span>Storage</span>
            <span className="text-white/70">{storageGB.toFixed(1)} / {storageLimit} GB</span>
          </div>
          <div className="h-[3px] bg-white/10 rounded-full">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal to-teal-light"
              style={{ width: `${storagePct}%` }}
            />
          </div>
          <button
            onClick={() => navigate('/dashboard/settings')}
            className="mt-2.5 text-[11px] text-teal-light font-medium cursor-pointer block bg-transparent border-0 p-0"
          >
            Upgrade plan →
          </button>
        </div>

        {/* User row */}
        <div
          className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors hover:bg-white/[0.06]"
          onClick={() => navigate('/dashboard/settings')}
        >
          <div className="w-[30px] h-[30px] rounded-full bg-teal flex items-center justify-center text-xs font-semibold text-ink flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] text-white/75 truncate">{profile?.studio_name ?? 'My Studio'}</div>
            <div className="text-[10px] text-white/35 mt-px capitalize">{profile?.plan ?? 'free'} plan</div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); handleSignOut() }}
            title="Sign out"
            className="p-1 rounded opacity-40 hover:opacity-100 transition-opacity bg-transparent border-0 cursor-pointer flex-shrink-0"
          >
            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}
