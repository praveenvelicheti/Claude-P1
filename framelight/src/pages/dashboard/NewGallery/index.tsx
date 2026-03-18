import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import { useGalleries } from '../../../hooks/useGalleries'
import { Topbar } from '../../../components/layout/Topbar'
import { Button } from '../../../components/ui/Button'
import { useToast } from '../../../components/ui/Toast'
import { Step1Details } from './Step1Details'
import { Step2Upload } from './Step2Upload'
import { Step3Settings } from './Step3Settings'
import { Step4Design } from './Step4Design'
import { supabase } from '../../../lib/supabase'
import { getUploadUrl, uploadToR2 } from '../../../lib/r2'

const STEPS = [
  { num: 1, label: 'Details' },
  { num: 2, label: 'Photos' },
  { num: 3, label: 'Settings' },
  { num: 4, label: 'Design' },
]

function generateSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Math.random().toString(36).slice(2, 7)
}

export function NewGallery() {
  const { user, profile } = useAuth()
  const { createGallery } = useGalleries(user?.id)
  const navigate = useNavigate()
  const toast = useToast()

  const [step, setStep] = useState(1)
  const [galleryId, setGalleryId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [details, setDetails] = useState({
    title: '',
    clientName: '',
    clientEmail: '',
    eventDate: '',
    galleryType: 'wedding',
    coverFile: null as File | null,
    coverPreview: '',
  })

  const [photos, setPhotos] = useState<Array<{
    id: string; url: string; thumb_url: string; filename: string; size_bytes: number; r2_key: string
  }>>([])

  const [settings, setSettings] = useState({
    pinEnabled: false,
    pinCode: '',
    adminBypass: true,
    downloadsEnabled: true,
    zipEnabled: true,
    favoritesEnabled: true,
    downloadSizes: 'both',
    expiryDate: '',
    expiryReminderDays: 7,
  })

  const [design, setDesign] = useState({
    studioName: profile?.studio_name ?? '',
    logoFile: null as File | null,
    logoPreview: profile?.logo_url ?? '',
    accentColor: profile?.accent_color ?? '#5cbdb9',
    layout: 'masonry',
    theme: 'framelight',
    showPoweredBy: true,
  })

  async function ensureGallery(): Promise<string> {
    if (galleryId) return galleryId

    let coverUrl = ''
    if (details.coverFile && user) {
      try {
        const { uploadUrl, publicUrl } = await getUploadUrl(
          details.coverFile.name,
          details.coverFile.type,
          'covers',
          user.id
        )
        await uploadToR2(uploadUrl, details.coverFile)
        coverUrl = publicUrl
      } catch { /* continue without cover */ }
    }

    const gallery = await createGallery({
      photographer_id: user!.id,
      slug: generateSlug(details.title || 'gallery'),
      title: details.title || 'Untitled Gallery',
      client_name: details.clientName || null,
      client_email: details.clientEmail || null,
      cover_url: coverUrl || null,
      layout: design.layout,
      theme: design.theme,
      pin_enabled: settings.pinEnabled,
      pin_code: settings.pinEnabled ? settings.pinCode : null,
      admin_bypass: settings.adminBypass,
      downloads_enabled: settings.downloadsEnabled,
      zip_enabled: settings.zipEnabled,
      favorites_enabled: settings.favoritesEnabled,
      download_sizes: settings.downloadSizes,
      expiry_date: settings.expiryDate || null,
      expiry_reminder_days: settings.expiryReminderDays,
      status: 'draft',
    })

    setGalleryId(gallery.id)
    return gallery.id
  }

  async function handleNext() {
    if (step === 1 && !details.title.trim()) {
      toast.show('Please enter a gallery name', 'error')
      return
    }

    if (step === 1) {
      setSaving(true)
      try {
        await ensureGallery()
        setStep(2)
      } catch (e) {
        toast.show('Failed to create gallery — check the title and try again', 'error')
      } finally {
        setSaving(false)
      }
      return
    }

    if (step < 4) { setStep(s => s + 1); return }

    // Final publish
    setSaving(true)
    try {
      const gid = await ensureGallery()

      // Update gallery with final settings/design
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateErr } = await (supabase.from('galleries') as any).update({
        layout: design.layout,
        theme: design.theme,
        pin_enabled: settings.pinEnabled,
        pin_code: settings.pinEnabled ? settings.pinCode : null,
        admin_bypass: settings.adminBypass,
        downloads_enabled: settings.downloadsEnabled,
        zip_enabled: settings.zipEnabled,
        favorites_enabled: settings.favoritesEnabled,
        download_sizes: settings.downloadSizes,
        expiry_date: settings.expiryDate || null,
        status: 'published',
      }).eq('id', gid)
      if (updateErr) throw updateErr

      toast.show('Gallery published!')
      navigate(`/dashboard/gallery/${gid}`)
    } catch {
      toast.show('Failed to publish gallery — check your settings and try again', 'error')
    } finally {
      setSaving(false)
    }
  }

  function handleSaveDraft() {
    toast.show('Draft saved')
    navigate('/dashboard/galleries')
  }

  const gid = galleryId ?? 'pending'

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Topbar title="New Gallery" />

      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {/* Step tabs */}
          <div className="flex border-b border-border mb-7">
            {STEPS.map(s => (
              <button
                key={s.num}
                type="button"
                onClick={() => step > s.num && setStep(s.num)}
                className={`flex items-center gap-2 px-5 py-3 text-[13px] font-ui transition-colors border-b-2 -mb-px cursor-pointer bg-transparent ${
                  step === s.num
                    ? 'text-ink font-medium border-teal'
                    : step > s.num
                    ? 'text-teal border-transparent hover:text-ink'
                    : 'text-ink-muted border-transparent cursor-default'
                }`}
              >
                <span className={`w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center text-[10px] font-semibold flex-shrink-0 ${
                  step > s.num
                    ? 'bg-teal border-teal text-white'
                    : step === s.num
                    ? 'border-current text-current'
                    : 'border-current text-current'
                }`}>
                  {step > s.num ? '✓' : s.num}
                </span>
                {s.label}
              </button>
            ))}
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-[1fr_300px] gap-6 items-start">
            <div>
              {step === 1 && <Step1Details data={details} onChange={p => setDetails(prev => ({ ...prev, ...p }))} />}
              {step === 2 && <Step2Upload galleryId={gid} photographerId={user?.id ?? ''} photos={photos} onPhotosChange={setPhotos} />}
              {step === 3 && <Step3Settings data={settings} onChange={p => setSettings(prev => ({ ...prev, ...p }))} />}
              {step === 4 && <Step4Design data={design} onChange={p => setDesign(prev => ({ ...prev, ...p }))} />}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-2">
                <Button
                  variant="secondary"
                  onClick={() => step > 1 ? setStep(s => s - 1) : navigate('/dashboard/galleries')}
                >
                  <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                  {step > 1 ? 'Back' : 'Cancel'}
                </Button>

                <div className="flex gap-2.5">
                  {step === 4 && (
                    <Button variant="secondary" onClick={handleSaveDraft}>Save Draft</Button>
                  )}
                  <Button
                    variant={step === 4 ? 'teal' : 'primary'}
                    onClick={handleNext}
                    loading={saving}
                  >
                    {step === 4 ? 'Publish Gallery' : 'Continue'}
                    {step < 4 && (
                      <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Preview panel */}
            <div className="bg-white border border-border rounded-[14px] p-5 sticky top-6">
              <div className="font-display text-[15px] font-medium text-ink mb-4 pb-3 border-b border-teal-pale">
                Gallery Preview
              </div>
              <div className="flex flex-col gap-0">
                {[
                  { key: 'Title',    val: details.title || '—' },
                  { key: 'Client',   val: details.clientName || '—' },
                  { key: 'Status',   val: 'Draft', color: 'text-ink-muted' },
                  { key: 'Layout',   val: design.layout, color: 'text-teal capitalize' },
                  { key: 'Theme',    val: design.theme, color: 'text-teal capitalize' },
                  { key: 'PIN',      val: settings.pinEnabled ? 'Enabled' : 'Off', color: settings.pinEnabled ? 'text-teal' : undefined },
                  { key: 'Photos',   val: `${photos.length} uploaded` },
                ].map(row => (
                  <div key={row.key} className="flex justify-between items-center py-2 border-b border-teal-pale last:border-none">
                    <span className="text-[12px] text-ink-muted">{row.key}</span>
                    <span className={`text-[13px] font-medium text-[#2a5250] ${row.color ?? ''}`}>{row.val}</span>
                  </div>
                ))}
              </div>

              {galleryId && (
                <div className="mt-3.5 bg-teal-pale rounded-lg px-3 py-2.5 flex items-center gap-2">
                  <span className="text-[12px] text-ink flex-1 truncate font-ui">
                    /g/{galleryId.slice(0, 8)}…
                  </span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/g/${galleryId}`); toast.show('Link copied!') }}
                    className="text-[11px] font-semibold text-teal bg-transparent border-0 cursor-pointer uppercase tracking-[0.04em]"
                  >
                    Copy
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
