import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Topbar } from '../../components/layout/Topbar'
import { Button } from '../../components/ui/Button'
import { Toggle } from '../../components/ui/Toggle'
import { useToast } from '../../components/ui/Toast'
import { getUploadUrl, uploadToR2 } from '../../lib/r2'

const TABS = ['Profile', 'Branding', 'Billing', 'Gallery Defaults', 'Notifications', 'Security'] as const
type Tab = (typeof TABS)[number]

const PLANS = [
  { id: 'free',     label: 'Free',     price: '$0',  storage: '5 GB',   galleries: 3,   features: ['3 galleries', '5GB storage', 'Basic themes'] },
  { id: 'basic',    label: 'Basic',    price: '$12', storage: '25 GB',  galleries: 20,  features: ['20 galleries', '25GB storage', 'All themes', 'PIN protection'] },
  { id: 'pro',      label: 'Pro',      price: '$29', storage: '100 GB', galleries: 999, features: ['Unlimited galleries', '100GB storage', 'Custom domain', 'Priority support'] },
  { id: 'ultimate', label: 'Ultimate', price: '$79', storage: '1 TB',   galleries: 999, features: ['Everything in Pro', '1TB storage', 'White label', 'API access'] },
]

export function Settings() {
  const { user, profile, updateProfile } = useAuth()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<Tab>('Profile')
  const [sectionKey, setSectionKey] = useState(0)

  function switchTab(tab: Tab) {
    setActiveTab(tab)
    setSectionKey(k => k + 1)
  }
  const [saving, setSaving] = useState(false)
  const [logoUploading, setLogoUploading] = useState<'dark' | 'light' | null>(null)
  const avatarRef = useRef<HTMLInputElement>(null)
  const logoDarkRef = useRef<HTMLInputElement>(null)
  const logoLightRef = useRef<HTMLInputElement>(null)

  const [profileForm, setProfileForm] = useState({
    studioName: profile?.studio_name ?? '',
    email: user?.email ?? '',
    website: '',
    location: '',
  })

  const [branding, setBranding] = useState({
    studioName: profile?.studio_name ?? '',
    accentColor: profile?.accent_color ?? '#5cbdb9',
    defaultTheme: 'framelight',
    customDomain: '',
    logoDarkUrl: profile?.logo_url ?? '',
    logoLightUrl: profile?.logo_url_light ?? '',
  })

  const [defaults, setDefaults] = useState({
    downloadsEnabled: true,
    zipEnabled: true,
    favoritesEnabled: true,
    pinEnabled: false,
    adminBypass: true,
    downloadSizes: 'both',
  })

  const [notifications, setNotifications] = useState({
    galleryViewed: true,
    photoDownloaded: true,
    galleryExpiring: true,
    newClient: false,
  })

  async function saveProfile() {
    setSaving(true)
    try {
      await updateProfile({ studio_name: profileForm.studioName })
      toast.show('Profile saved')
    } catch {
      toast.show('Failed to save profile — check your studio name', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function saveBranding() {
    setSaving(true)
    try {
      await updateProfile({
        studio_name: branding.studioName,
        accent_color: branding.accentColor,
        logo_url: branding.logoDarkUrl || null,
        logo_url_light: branding.logoLightUrl || null,
      })
      toast.show('Branding saved')
    } catch {
      toast.show('Failed to save branding — check your studio name and accent color', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleLogoUpload(file: File, variant: 'dark' | 'light') {
    if (!user) return
    setLogoUploading(variant)
    try {
      const ext = file.name.split('.').pop() ?? 'png'
      const { uploadUrl, publicUrl } = await getUploadUrl(
        `logo_${variant}.${ext}`,
        file.type,
        'logos',
        user.id,
      )
      await uploadToR2(uploadUrl, file)
      if (variant === 'dark') {
        setBranding(b => ({ ...b, logoDarkUrl: publicUrl }))
      } else {
        setBranding(b => ({ ...b, logoLightUrl: publicUrl }))
      }
      toast.show(`${variant === 'dark' ? 'Dark' : 'Light'} logo uploaded`)
    } catch {
      toast.show('Logo upload failed', 'error')
    } finally {
      setLogoUploading(null)
    }
  }

  useEffect(() => {
    if (!profile && !user) return
    setProfileForm(prev => ({
      ...prev,
      studioName: profile?.studio_name ?? '',
      email: user?.email ?? '',
    }))
    setBranding(prev => ({
      ...prev,
      studioName: profile?.studio_name ?? '',
      accentColor: profile?.accent_color ?? '#5cbdb9',
      logoDarkUrl: profile?.logo_url ?? '',
      logoLightUrl: profile?.logo_url_light ?? '',
    }))
  }, [profile, user])

  const initials = (profile?.studio_name ?? user?.email ?? 'U').slice(0, 2).toUpperCase()

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar title="Settings" />

      {/* Mobile pill nav — visible only on mobile */}
      <div className="md:hidden sticky top-[58px] z-40 bg-white border-b border-border px-4 py-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [-webkit-overflow-scrolling:touch]">
        <div className="flex gap-1.5">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => switchTab(tab)}
              className={`px-3.5 py-[7px] rounded-full border font-ui text-[12px] font-medium whitespace-nowrap cursor-pointer transition-all ${
                activeTab === tab
                  ? 'bg-ink text-white border-ink'
                  : 'bg-white text-ink-mid border-border hover:bg-teal-pale hover:border-teal hover:text-teal'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 overflow-y-auto">
        <div className="md:grid md:grid-cols-[210px_1fr] min-h-full">
            {/* Sidebar nav — hidden on mobile */}
            <nav className="hidden md:flex flex-col gap-0.5 border-r border-border px-3.5 py-7 bg-white sticky top-0 self-start">
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => switchTab(tab)}
                  className={`px-3 py-[9px] rounded-lg text-[13px] cursor-pointer text-left font-ui transition-all bg-transparent border-0 ${
                    activeTab === tab
                      ? 'bg-teal-pale text-ink font-medium border-l-[3px] border-teal pl-[9px]'
                      : 'text-ink-mid hover:bg-teal-pale hover:text-ink'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>

            {/* Content */}
            <div key={sectionKey} className="px-4 py-5 md:px-9 md:py-8 section-enter">
              {/* ── Profile ── */}
              {activeTab === 'Profile' && (
                <div>
                  <h2 className="font-display text-[22px] sm:text-[24px] md:text-[28px] font-light text-ink mb-6">My <em className="italic text-teal">Profile</em></h2>

                  {/* Avatar */}
                  <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left gap-5 mb-6 p-5 bg-gradient-to-br from-teal-pale to-white border border-border rounded-xl">
                    <div className="w-[72px] h-[72px] sm:w-[80px] sm:h-[80px] rounded-full bg-teal flex items-center justify-center text-[26px] sm:text-[32px] font-semibold text-white flex-shrink-0 font-display shadow-teal">
                      {initials}
                    </div>
                    <div>
                      <p className="font-display text-[20px] sm:text-[22px] text-ink mb-0.5">{profile?.studio_name || user?.email?.split('@')[0] || 'Your Studio'}</p>
                      <p className="text-[13px] text-ink-muted mb-3">{user?.email}</p>
                      <button
                        onClick={() => avatarRef.current?.click()}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border bg-white font-ui text-[12.5px] font-medium text-ink cursor-pointer hover:border-teal hover:text-teal transition-all"
                      >
                        <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        Change Photo
                      </button>
                    </div>
                    <input ref={avatarRef} type="file" accept="image/*" className="hidden" />
                  </div>

                  <div className="bg-white border border-border rounded-[14px] p-5 md:p-7">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { label: 'Studio / Business Name', key: 'studioName', placeholder: 'Ember & Light Studio' },
                        { label: 'Email', key: 'email', placeholder: 'you@studio.com', type: 'email' },
                        { label: 'Website', key: 'website', placeholder: 'https://yourstudio.com' },
                        { label: 'Location', key: 'location', placeholder: 'New York, NY' },
                      ].map(field => (
                        <div key={field.key} className="mb-[18px]">
                          <label className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-ink-muted mb-[7px]">
                            {field.label}
                          </label>
                          <input
                            type={field.type ?? 'text'}
                            value={profileForm[field.key as keyof typeof profileForm]}
                            onChange={e => setProfileForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                            placeholder={field.placeholder}
                            className="w-full px-[13px] py-[10px] border border-border rounded-lg bg-teal-pale font-ui text-[13.5px] text-ink outline-none focus:border-teal focus:shadow-[0_0_0_3px_rgba(92,189,185,0.15)] focus:bg-white placeholder:text-ink-muted"
                          />
                        </div>
                      ))}
                    </div>
                    <Button variant="teal" loading={saving} onClick={saveProfile}>Save Changes</Button>
                  </div>
                </div>
              )}

              {/* ── Branding ── */}
              {activeTab === 'Branding' && (
                <div>
                  <h2 className="font-display text-[22px] sm:text-[24px] md:text-[28px] font-light text-ink mb-6">Studio <em className="italic text-teal">Branding</em></h2>
                  <div className="bg-white border border-border rounded-[14px] p-5 md:p-7 mb-4">

                    {/* Brand Logos */}
                    <div className="mb-6 pb-6 border-b border-border">
                      <label className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-ink-muted mb-3">Brand Logo</label>
                      <p className="text-[12px] text-ink-muted mb-4">Upload a dark version (for light backgrounds) and a light/white version (for dark backgrounds). PNG with transparency recommended.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Dark logo */}
                        {(['dark', 'light'] as const).map(variant => {
                          const url = variant === 'dark' ? branding.logoDarkUrl : branding.logoLightUrl
                          const ref = variant === 'dark' ? logoDarkRef : logoLightRef
                          const isUploading = logoUploading === variant
                          return (
                            <div key={variant}>
                              <div className="text-[11px] font-medium text-ink-mid mb-2 capitalize">
                                {variant === 'dark' ? 'Dark logo' : 'Light / White logo'}
                                <span className="text-ink-muted font-normal ml-1">
                                  {variant === 'dark' ? '(for light backgrounds)' : '(for dark backgrounds)'}
                                </span>
                              </div>
                              <div
                                className={`relative flex flex-col items-center justify-center gap-2 h-28 rounded-xl border-2 border-dashed cursor-pointer transition-all hover:border-teal group ${url ? 'border-border' : 'border-border'} ${variant === 'light' ? 'bg-ink' : 'bg-teal-pale'}`}
                                onClick={() => ref.current?.click()}
                              >
                                {isUploading ? (
                                  <svg className="w-5 h-5 animate-spin text-teal" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                                ) : url ? (
                                  <>
                                    <img src={url} alt="" className="max-h-16 max-w-full object-contain" />
                                    <span className={`text-[10px] tracking-[0.06em] uppercase opacity-0 group-hover:opacity-100 transition-opacity ${variant === 'light' ? 'text-white/60' : 'text-ink-muted'}`}>Click to replace</span>
                                  </>
                                ) : (
                                  <>
                                    <svg className={`w-5 h-5 ${variant === 'light' ? 'text-white/40' : 'text-ink-muted'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                    <span className={`text-[11px] ${variant === 'light' ? 'text-white/50' : 'text-ink-muted'}`}>Upload PNG</span>
                                  </>
                                )}
                              </div>
                              <input
                                ref={ref}
                                type="file"
                                accept="image/png,image/svg+xml,image/webp"
                                className="hidden"
                                onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f, variant); e.target.value = '' }}
                              />
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className="mb-[18px]">
                      <label className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-ink-muted mb-[7px]">Studio Name</label>
                      <input
                        type="text"
                        value={branding.studioName}
                        onChange={e => setBranding(b => ({ ...b, studioName: e.target.value }))}
                        className="w-full px-[13px] py-[10px] border border-border rounded-lg bg-teal-pale font-ui text-[13.5px] text-ink outline-none focus:border-teal focus:shadow-[0_0_0_3px_rgba(92,189,185,0.15)] focus:bg-white placeholder:text-ink-muted"
                        placeholder="Ember & Light Studio"
                      />
                    </div>
                    <div className="mb-[18px]">
                      <label className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-ink-muted mb-[7px]">Accent Color</label>
                      <div className="flex items-center gap-3">
                        <input type="color" value={branding.accentColor} onChange={e => setBranding(b => ({ ...b, accentColor: e.target.value }))} className="w-10 h-10 rounded-lg border border-border cursor-pointer p-0.5" />
                        <input type="text" value={branding.accentColor} onChange={e => setBranding(b => ({ ...b, accentColor: e.target.value }))} className="w-32 px-[13px] py-[10px] border border-border rounded-lg bg-teal-pale font-ui text-[13.5px] text-ink outline-none focus:border-teal placeholder:text-ink-muted" />
                      </div>
                    </div>
                    <div className="mb-[18px]">
                      <label className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-ink-muted mb-[7px]">Default Gallery Theme</label>
                      <select
                        value={branding.defaultTheme}
                        onChange={e => setBranding(b => ({ ...b, defaultTheme: e.target.value }))}
                        className="w-full px-[13px] py-[10px] border border-border rounded-lg bg-teal-pale font-ui text-[13.5px] text-ink outline-none focus:border-teal"
                      >
                        {['framelight', 'dark', 'minimal', 'terracotta', 'lavender', 'gold'].map(t => (
                          <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-0">
                      <label className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-ink-muted mb-[7px]">Custom Domain</label>
                      <input
                        type="text"
                        value={branding.customDomain}
                        onChange={e => setBranding(b => ({ ...b, customDomain: e.target.value }))}
                        placeholder="galleries.yourstudio.com"
                        className="w-full px-[13px] py-[10px] border border-border rounded-lg bg-teal-pale font-ui text-[13.5px] text-ink outline-none focus:border-teal placeholder:text-ink-muted"
                      />
                    </div>
                  </div>
                  <Button variant="teal" loading={saving} onClick={saveBranding}>Save Branding</Button>
                </div>
              )}

              {/* ── Billing ── */}
              {activeTab === 'Billing' && (
                <div>
                  <h2 className="font-display text-[22px] sm:text-[24px] md:text-[28px] font-light text-ink mb-6">Billing <em className="italic text-teal">&amp; Plan</em></h2>
                  <div className="bg-ink rounded-[14px] px-5 py-5 md:px-7 md:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 relative overflow-hidden">
                    <div className="absolute -top-10 -right-5 w-48 h-48 rounded-full pointer-events-none" style={{background:'radial-gradient(circle,rgba(92,189,185,0.2) 0%,transparent 70%)'}} />
                    <div>
                      <h4 className="font-display text-[20px] font-light text-white mb-1 capitalize">
                        {profile?.plan ?? 'free'} Plan
                      </h4>
                      <p className="text-[13px] text-white/45">
                        {profile?.plan === 'free' ? 'Free forever — upgrade to unlock more' : 'Billed monthly · Cancel anytime'}
                      </p>
                    </div>
                    <button className="px-[22px] py-2.5 bg-teal text-ink rounded-lg font-ui font-semibold text-[13px] cursor-pointer hover:bg-teal-light transition-colors border-0">
                      Upgrade Plan
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {PLANS.map(plan => (
                      <div
                        key={plan.id}
                        className={`border rounded-xl p-5 transition-all ${profile?.plan === plan.id ? 'border-teal bg-teal-pale' : 'border-border bg-white'}`}
                      >
                        <div className="font-display text-[18px] font-medium text-ink mb-0.5">{plan.label}</div>
                        <div className="text-[22px] font-semibold text-teal mb-3">{plan.price}<span className="text-[12px] text-ink-muted font-normal">/mo</span></div>
                        <ul className="space-y-1.5">
                          {plan.features.map(f => (
                            <li key={f} className="flex items-center gap-1.5 text-[12px] text-ink-mid">
                              <svg className="w-3.5 h-3.5 text-teal flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                              {f}
                            </li>
                          ))}
                        </ul>
                        {profile?.plan !== plan.id && (
                          <button className="mt-4 w-full py-2 bg-ink text-white rounded-lg font-ui text-[12px] font-medium cursor-pointer hover:bg-[#0e2828] transition-colors border-0">
                            {plan.id === 'free' ? 'Current' : 'Upgrade'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Gallery Defaults ── */}
              {activeTab === 'Gallery Defaults' && (
                <div>
                  <h2 className="font-display text-[22px] sm:text-[24px] md:text-[28px] font-light text-ink mb-6">Gallery <em className="italic text-teal">Defaults</em></h2>
                  <div className="bg-white border border-border rounded-[14px] p-5 md:p-7">
                    <p className="text-[13px] text-ink-muted mb-5">These settings will be pre-filled when creating a new gallery.</p>
                    <Toggle label="Enable Downloads by default" checked={defaults.downloadsEnabled} onChange={v => setDefaults(d => ({ ...d, downloadsEnabled: v }))} />
                    <Toggle label="Enable ZIP download by default" checked={defaults.zipEnabled} onChange={v => setDefaults(d => ({ ...d, zipEnabled: v }))} />
                    <Toggle label="Enable Favorites by default" checked={defaults.favoritesEnabled} onChange={v => setDefaults(d => ({ ...d, favoritesEnabled: v }))} />
                    <Toggle label="Enable PIN protection by default" checked={defaults.pinEnabled} onChange={v => setDefaults(d => ({ ...d, pinEnabled: v }))} />
                    <Toggle label="Photographer admin bypass by default" checked={defaults.adminBypass} onChange={v => setDefaults(d => ({ ...d, adminBypass: v }))} />
                  </div>
                </div>
              )}

              {/* ── Notifications ── */}
              {activeTab === 'Notifications' && (
                <div>
                  <h2 className="font-display text-[22px] sm:text-[24px] md:text-[28px] font-light text-ink mb-6">Email <em className="italic text-teal">Notifications</em></h2>
                  <div className="bg-white border border-border rounded-[14px] p-5 md:p-7">
                    <Toggle label="Gallery viewed" description="Email when a client views your gallery" checked={notifications.galleryViewed} onChange={v => setNotifications(n => ({ ...n, galleryViewed: v }))} />
                    <Toggle label="Photo downloaded" description="Email when photos are downloaded" checked={notifications.photoDownloaded} onChange={v => setNotifications(n => ({ ...n, photoDownloaded: v }))} />
                    <Toggle label="Gallery expiring" description="Email reminder before a gallery expires" checked={notifications.galleryExpiring} onChange={v => setNotifications(n => ({ ...n, galleryExpiring: v }))} />
                    <Toggle label="New client activity" description="Email when a new client accesses a gallery" checked={notifications.newClient} onChange={v => setNotifications(n => ({ ...n, newClient: v }))} />
                  </div>
                </div>
              )}

              {/* ── Security ── */}
              {activeTab === 'Security' && (
                <div>
                  <h2 className="font-display text-[22px] sm:text-[24px] md:text-[28px] font-light text-ink mb-6">Security <em className="italic text-teal">&amp; Access</em></h2>
                  <div className="bg-white border border-border rounded-[14px] p-5 md:p-7 mb-4">
                    <div className="font-display text-[17px] font-medium text-ink mb-5 pb-4 border-b border-teal-pale">
                      Change Password
                    </div>
                    {['Current Password', 'New Password', 'Confirm New Password'].map(label => (
                      <div key={label} className="mb-[18px]">
                        <label className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-ink-muted mb-[7px]">{label}</label>
                        <input type="password" className="w-full px-[13px] py-[10px] border border-border rounded-lg bg-teal-pale font-ui text-[13.5px] text-ink outline-none focus:border-teal focus:shadow-[0_0_0_3px_rgba(92,189,185,0.15)] placeholder:text-ink-muted" placeholder="••••••••" />
                      </div>
                    ))}
                    <Button variant="primary">Update Password</Button>
                  </div>

                  <div className="bg-white border border-border rounded-[14px] p-5 md:p-7">
                    <div className="font-display text-[17px] font-medium text-ink mb-5 pb-4 border-b border-teal-pale">
                      Two-Factor Authentication
                    </div>
                    <Toggle
                      label="Enable 2FA"
                      description="Add an extra layer of security to your account"
                      checked={false}
                      onChange={() => toast.show('2FA coming soon!', 'error')}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
      </main>
    </div>
  )
}
