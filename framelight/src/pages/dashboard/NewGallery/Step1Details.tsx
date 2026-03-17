import { type ChangeEvent, useRef } from 'react'
import { Input, Select } from '../../../components/ui/Input'

interface FormData {
  title: string
  clientName: string
  clientEmail: string
  eventDate: string
  galleryType: string
  coverFile: File | null
  coverPreview: string
}

interface Props {
  data: FormData
  onChange: (updates: Partial<FormData>) => void
}

export function Step1Details({ data, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)

  function handleCoverFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    onChange({ coverFile: file, coverPreview: URL.createObjectURL(file) })
  }

  return (
    <div className="bg-white border border-border rounded-[14px] p-7 mb-[18px]">
      <div className="font-display text-[17px] font-medium text-ink mb-5 pb-4 border-b border-teal-pale">
        Gallery Details
      </div>

      <Input
        label="Gallery Name"
        value={data.title}
        onChange={e => onChange({ title: e.target.value })}
        placeholder="Emma & James Wedding"
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Client Name"
          value={data.clientName}
          onChange={e => onChange({ clientName: e.target.value })}
          placeholder="Emma Johnson"
        />
        <Input
          label="Client Email"
          type="email"
          value={data.clientEmail}
          onChange={e => onChange({ clientEmail: e.target.value })}
          placeholder="emma@email.com"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Event Date"
          type="date"
          value={data.eventDate}
          onChange={e => onChange({ eventDate: e.target.value })}
        />
        <Select
          label="Gallery Type"
          value={data.galleryType}
          onChange={e => onChange({ galleryType: e.target.value })}
        >
          <option value="wedding">Wedding</option>
          <option value="portrait">Portrait</option>
          <option value="family">Family</option>
          <option value="commercial">Commercial</option>
          <option value="event">Event</option>
          <option value="other">Other</option>
        </Select>
      </div>

      {/* Cover upload */}
      <div className="mb-0">
        <label className="block text-[11px] font-semibold tracking-[0.09em] uppercase text-ink-muted mb-[7px]">
          Cover Photo
        </label>
        <div
          className={`border-2 border-dashed border-border rounded-xl aspect-[16/7] flex flex-col items-center justify-center cursor-pointer bg-teal-pale transition-all relative overflow-hidden hover:border-teal hover:bg-[#e0f3f2] ${data.coverPreview ? 'has-image' : ''}`}
          onClick={() => fileRef.current?.click()}
        >
          {data.coverPreview ? (
            <>
              <img src={data.coverPreview} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-[13px] font-medium">Change Cover</span>
              </div>
            </>
          ) : (
            <>
              <div className="w-11 h-11 bg-white rounded-[10px] flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
              <h4 className="font-display text-[17px] font-light text-[#2a5250] mb-1">Drop a cover photo</h4>
              <p className="text-[12px] text-ink-muted">or <span className="text-teal font-medium underline">browse files</span></p>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleCoverFile} />
      </div>
    </div>
  )
}
