import { Toggle } from '../../../components/ui/Toggle'
import { Input } from '../../../components/ui/Input'

interface SettingsData {
  pinEnabled: boolean
  pinCode: string
  adminBypass: boolean
  downloadsEnabled: boolean
  zipEnabled: boolean
  favoritesEnabled: boolean
  downloadSizes: string
  expiryDate: string
  expiryReminderDays: number
}

interface Props {
  data: SettingsData
  onChange: (updates: Partial<SettingsData>) => void
}

export function Step3Settings({ data, onChange }: Props) {
  return (
    <div className="space-y-[18px]">
      {/* Privacy */}
      <div className="bg-white border border-border rounded-[14px] p-5 md:p-7">
        <div className="font-display text-[17px] font-medium text-ink mb-5 pb-4 border-b border-teal-pale">
          Privacy & Access
        </div>
        <div className="flex flex-col">
          <Toggle
            label="Enable PIN Protection"
            description="Clients must enter a 4-digit PIN to view the gallery"
            checked={data.pinEnabled}
            onChange={v => onChange({ pinEnabled: v })}
          />
          {data.pinEnabled && (
            <div className="py-3 pl-0">
              <label className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-ink-muted mb-2">
                PIN Code (4 digits)
              </label>
              <div className="flex gap-2">
                {[0,1,2,3].map(i => (
                  <input
                    key={i}
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={data.pinCode[i] ?? ''}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(-1)
                      const chars = data.pinCode.split('')
                      chars[i] = val
                      onChange({ pinCode: chars.join('') })
                      if (val && e.target.nextElementSibling) {
                        (e.target.nextElementSibling as HTMLInputElement).focus()
                      }
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Backspace' && !data.pinCode[i] && e.currentTarget.previousElementSibling) {
                        (e.currentTarget.previousElementSibling as HTMLInputElement).focus()
                      }
                    }}
                    className="flex-1 min-w-0 h-[46px] border border-border rounded-lg bg-teal-pale text-center font-display text-[22px] text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/20 focus:ring-inset"
                  />
                ))}
              </div>
            </div>
          )}
          <Toggle
            label="Photographer Admin Bypass"
            description="You can view gallery without PIN when logged in"
            checked={data.adminBypass}
            onChange={v => onChange({ adminBypass: v })}
          />
        </div>
      </div>

      {/* Downloads */}
      <div className="bg-white border border-border rounded-[14px] p-5 md:p-7">
        <div className="font-display text-[17px] font-medium text-ink mb-5 pb-4 border-b border-teal-pale">
          Downloads & Interactions
        </div>
        <div className="flex flex-col">
          <Toggle
            label="Enable Downloads"
            description="Clients can download individual photos"
            checked={data.downloadsEnabled}
            onChange={v => onChange({ downloadsEnabled: v })}
          />
          <Toggle
            label="Enable ZIP Download"
            description="Clients can download all photos as a ZIP file"
            checked={data.zipEnabled}
            onChange={v => onChange({ zipEnabled: v })}
          />
          <Toggle
            label="Enable Favorites"
            description="Clients can heart photos to create a favorites list"
            checked={data.favoritesEnabled}
            onChange={v => onChange({ favoritesEnabled: v })}
          />
          {data.downloadsEnabled && (
            <div className="py-3">
              <label className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-ink-muted mb-2">
                Download Size
              </label>
              <select
                value={data.downloadSizes}
                onChange={e => onChange({ downloadSizes: e.target.value })}
                className="w-full px-[13px] py-[10px] border border-border rounded-lg bg-teal-pale font-ui text-[13.5px] text-ink outline-none focus:border-teal focus:shadow-[0_0_0_3px_rgba(92,189,185,0.15)]"
              >
                <option value="web">Web resolution only</option>
                <option value="hires">High resolution only</option>
                <option value="both">Both (client chooses)</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Expiry */}
      <div className="bg-white border border-border rounded-[14px] p-5 md:p-7">
        <div className="font-display text-[17px] font-medium text-ink mb-5 pb-4 border-b border-teal-pale">
          Gallery Expiry
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Expiry Date"
            type="date"
            value={data.expiryDate}
            onChange={e => onChange({ expiryDate: e.target.value })}
          />
          <div className="mb-[18px]">
            <label className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-ink-muted mb-[7px]">
              Reminder (days before)
            </label>
            <input
              type="number"
              min={1}
              max={30}
              value={data.expiryReminderDays}
              onChange={e => onChange({ expiryReminderDays: parseInt(e.target.value) || 7 })}
              className="w-full px-[13px] py-[10px] border border-border rounded-lg bg-teal-pale font-ui text-[13.5px] text-ink outline-none focus:border-teal focus:shadow-[0_0_0_3px_rgba(92,189,185,0.15)]"
            />
          </div>
        </div>
        <div className="bg-pink border border-pink-dark rounded-xl px-5 py-[14px] mt-2">
          <p className="text-[13px] text-ink-mid">
            <strong className="font-medium text-ink">Tip:</strong> We'll send your client a reminder email {data.expiryReminderDays} days before the gallery expires.
          </p>
        </div>
      </div>
    </div>
  )
}
