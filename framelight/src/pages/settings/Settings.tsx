import { useState, useRef } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Topbar } from '../../components/layout/Topbar'
import { Button } from '../../components/ui/Button'
import { Toggle } from '../../components/ui/Toggle'
import { useToast } from '../../components/ui/Toast'

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
  const [saving, setSaving] = useState(false)
  const avatarRef = useRef<HTMLInputElement>(null)

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
      toast.show('Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function saveBranding() {
    setSaving(true)
    try {
      await updateProfile({ studio_name: branding.studioName, accent_color: branding.accentColor })
      toast.show('Branding saved')
    } catch {
      toast.show('Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  const initials = (profile?.studio_name ?? user?.email ?? 'U').slice(0, 2).toUpperCase()

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar title="Settings" />

      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="grid grid-cols-[200px_1fr] gap-7">
            {/* Sidebar nav */}
            <nav className="flex flex-col gap-0.5">
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3.5 py-[9px] rounded-lg text-[13.5px] cursor-pointer text-left font-ui transition-all bg-transparent border-0 ${
                    activeTab === tab
                      ? 'bg-teal-pale text-ink font-medium border-l-[3px] border-teal pl-3'
                      : 'text-ink-mid hover:bg-teal-pale hover:text-ink'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>

            {/* Content */}
            <div>
              {/* ── Profile ── */}
              {activeTab === 'Profile' && (
                <div>
                  <h2 className="font-display text-[24px] font-light text-ink mb-6">Profile</h2>

                  {/* Avatar */}
                  <div className="flex items-center gap-5 mb-6 p-5 bg-teal-pale rounded-xl">
                    <div className="w-[72px] h-[72px] rounded-full bg-teal flex items-center justify-center text-[26px] font-semibold text-white flex-shrink-0 font-display">
                      {initials}
                    </div>
                    <div>
                      <button
                        onClick={() => avatarRef.current?.click()}
                        className="px-4 py-2 rounded-lg border border-border bg-white font-ui text-[12.5px] font-medium text-ink cursor-pointer hover:border-teal hover:text-teal transition-all"
                      >
                        Upload Photo
                      </button>
                      <p className="text-[11.5px] text-ink-muted mt-1.5">JPG, PNG or GIF · Max 2MB</p>
                    </div>
                    <input ref={avatarRef} type="file" accept="image/*" className="hidden" />
                  </div>

                  <div className="bg-white border border-border rounded-[14px] p-7">
                    <div className="grid grid-cols-2 gap-4">
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
                  <h2 className="font-display text-[24px] font-light text-ink mb-6">Branding</h2>
                  <div className="bg-white border border-border rounded-[14px] p-7 mb-4">
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
                  <h2 className="font-display text-[24px] font-light text-ink mb-6">Billing</h2>
                  <div className="bg-ink rounded-[14px] px-7 py-6 flex items-center justify-between mb-6">
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

                  <div className="grid grid-cols-4 gap-3">
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
                  <h2 className="font-display text-[24px] font-light text-ink mb-6">Gallery Defaults</h2>
                  <div className="bg-white border border-border rounded-[14px] p-7">
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
                  <h2 className="font-display text-[24px] font-light text-ink mb-6">Notifications</h2>
                  <div className="bg-white border border-border rounded-[14px] p-7">
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
                  <h2 className="font-display text-[24px] font-light text-ink mb-6">Security</h2>
                  <div className="bg-white border border-border rounded-[14px] p-7 mb-4">
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

                  <div className="bg-white border border-border rounded-[14px] p-7">
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
        </div>
      </main>
    </div>
  )
}
