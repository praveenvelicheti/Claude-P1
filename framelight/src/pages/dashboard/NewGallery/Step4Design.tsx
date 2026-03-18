import { type ChangeEvent, useRef } from 'react'
import { Toggle } from '../../../components/ui/Toggle'

const THEMES = [
  { id: 'framelight', label: 'Framelight', colors: ['#1a3a3a', '#5cbdb9', '#ebf6f5'] },
  { id: 'dark',       label: 'Dark',       colors: ['#111', '#333', '#555'] },
  { id: 'minimal',    label: 'Minimal',    colors: ['#fff', '#f5f5f5', '#e0e0e0'] },
  { id: 'terracotta', label: 'Terracotta', colors: ['#8b4513', '#d2691e', '#ffd5b2'] },
  { id: 'lavender',   label: 'Lavender',   colors: ['#4a4080', '#9b89c4', '#e8e4f3'] },
  { id: 'gold',       label: 'Gold',       colors: ['#2c2000', '#b8860b', '#fdf5d0'] },
]

const LAYOUTS = [
  { id: 'masonry',   label: 'Masonry',   icon: '⊞' },
  { id: 'justified', label: 'Justified', icon: '≡' },
  { id: 'square',    label: 'Square',    icon: '⊟' },
]

interface DesignData {
  studioName: string
  logoFile: File | null
  logoPreview: string
  accentColor: string
  layout: string
  theme: string
  showPoweredBy: boolean
  gridCols: number
  gridGutter: number
}

interface Props {
  data: DesignData
  onChange: (updates: Partial<DesignData>) => void
}

export function Step4Design({ data, onChange }: Props) {
  const logoRef = useRef<HTMLInputElement>(null)

  function handleLogo(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    onChange({ logoFile: file, logoPreview: URL.createObjectURL(file) })
  }

  return (
    <div className="space-y-[18px]">
      {/* Branding */}
      <div className="bg-white border border-border rounded-[14px] p-7">
        <div className="font-display text-[17px] font-medium text-ink mb-5 pb-4 border-b border-teal-pale">
          Studio Branding
        </div>

        {/* Logo upload */}
        <div className="mb-[18px]">
          <label className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-ink-muted mb-[7px]">
            Studio Logo
          </label>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-teal-pale border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
              {data.logoPreview ? (
                <img src={data.logoPreview} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="font-display text-2xl text-teal font-medium">
                  {data.studioName ? data.studioName[0].toUpperCase() : 'S'}
                </span>
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={() => logoRef.current?.click()}
                className="px-4 py-2 rounded-lg border border-border bg-white font-ui text-[12.5px] font-medium text-ink hover:border-teal hover:text-teal transition-all cursor-pointer"
              >
                {data.logoPreview ? 'Change Logo' : 'Upload Logo'}
              </button>
              <p className="text-[11.5px] text-ink-muted mt-1">PNG or SVG recommended · 1:1 ratio</p>
            </div>
          </div>
          <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
        </div>

        <div className="mb-[18px]">
          <label className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-ink-muted mb-[7px]">
            Studio Name
          </label>
          <input
            type="text"
            value={data.studioName}
            onChange={e => onChange({ studioName: e.target.value })}
            placeholder="Ember & Light Studio"
            className="w-full px-[13px] py-[10px] border border-border rounded-lg bg-teal-pale font-ui text-[13.5px] text-ink outline-none focus:border-teal focus:shadow-[0_0_0_3px_rgba(92,189,185,0.15)] focus:bg-white placeholder:text-ink-muted"
          />
        </div>

        <div className="mb-0">
          <label className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-ink-muted mb-[7px]">
            Accent Color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={data.accentColor}
              onChange={e => onChange({ accentColor: e.target.value })}
              className="w-10 h-10 rounded-lg border border-border cursor-pointer p-0.5 bg-transparent"
            />
            <input
              type="text"
              value={data.accentColor}
              onChange={e => onChange({ accentColor: e.target.value })}
              placeholder="#5cbdb9"
              className="w-32 px-[13px] py-[10px] border border-border rounded-lg bg-teal-pale font-ui text-[13.5px] text-ink outline-none focus:border-teal focus:shadow-[0_0_0_3px_rgba(92,189,185,0.15)] placeholder:text-ink-muted"
            />
            <div className="flex gap-2 ml-2">
              {['#5cbdb9','#1a3a3a','#e07878','#8b4513','#4a4080'].map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onChange({ accentColor: c })}
                  className="w-6 h-6 rounded-full border-2 transition-all cursor-pointer"
                  style={{ backgroundColor: c, borderColor: data.accentColor === c ? '#1a3a3a' : 'transparent' }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="bg-white border border-border rounded-[14px] p-7">
        <div className="font-display text-[17px] font-medium text-ink mb-5 pb-4 border-b border-teal-pale">
          Gallery Layout
        </div>
        <div className="grid grid-cols-3 gap-2.5 mb-[18px]">
          {LAYOUTS.map(l => (
            <button
              key={l.id}
              type="button"
              onClick={() => onChange({ layout: l.id })}
              className={`border-2 rounded-[10px] p-3 cursor-pointer transition-all text-center ${data.layout === l.id ? 'border-teal bg-teal-pale' : 'border-border hover:border-ink-muted'}`}
            >
              <div className="text-[22px] mb-1.5">{l.icon}</div>
              <div className="text-[11px] font-medium text-[#2a5250]">{l.label}</div>
            </button>
          ))}
        </div>

        {/* Grid controls */}
        <div className="border-t border-teal-pale pt-5 space-y-5">
          {/* Images per row */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-[11px] font-semibold tracking-[0.09em] uppercase text-ink-muted">
                Images Per Row
              </label>
              <span className="text-[13px] font-medium text-teal">{data.gridCols}</span>
            </div>
            <div className="flex gap-1.5">
              {[2, 3, 4, 5, 6].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onChange({ gridCols: n })}
                  className={`flex-1 py-2 rounded-lg border text-[12px] font-medium cursor-pointer transition-all ${
                    data.gridCols === n ? 'border-teal bg-teal-pale text-teal' : 'border-border text-ink-muted hover:border-ink-muted'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Gutter */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-[11px] font-semibold tracking-[0.09em] uppercase text-ink-muted">
                Gutter / Gap
              </label>
              <span className="text-[13px] font-medium text-teal">{data.gridGutter}px</span>
            </div>
            <input
              type="range"
              min={0}
              max={24}
              step={2}
              value={data.gridGutter}
              onChange={e => onChange({ gridGutter: Number(e.target.value) })}
              className="w-full h-[3px] appearance-none bg-teal-pale rounded-full outline-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-ink-muted mt-1">
              <span>None</span>
              <span>Small</span>
              <span>Medium</span>
              <span>Large</span>
            </div>
          </div>
        </div>
      </div>

      {/* Theme */}
      <div className="bg-white border border-border rounded-[14px] p-7">
        <div className="font-display text-[17px] font-medium text-ink mb-5 pb-4 border-b border-teal-pale">
          Gallery Theme
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {THEMES.map(theme => (
            <button
              key={theme.id}
              type="button"
              onClick={() => onChange({ theme: theme.id })}
              className={`border-2 rounded-[10px] overflow-hidden cursor-pointer transition-all relative ${data.theme === theme.id ? 'border-teal' : 'border-border hover:border-ink-muted'}`}
            >
              {data.theme === theme.id && (
                <span className="absolute top-1.5 right-1.5 w-[18px] h-[18px] rounded-full bg-teal text-white text-[10px] font-bold grid place-items-center z-10">
                  ✓
                </span>
              )}
              <div className="h-[60px] flex gap-[3px] p-1.5">
                {theme.colors.map((c, i) => (
                  <div key={i} className="flex-1 rounded-[4px]" style={{ backgroundColor: c }} />
                ))}
              </div>
              <div className="px-2 py-1.5 text-[11px] font-medium text-[#2a5250] bg-white text-left">{theme.label}</div>
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-col">
          <Toggle
            label='Show "Powered by Framelight"'
            description="Display a small badge in the gallery footer"
            checked={data.showPoweredBy}
            onChange={v => onChange({ showPoweredBy: v })}
          />
        </div>
      </div>
    </div>
  )
}
