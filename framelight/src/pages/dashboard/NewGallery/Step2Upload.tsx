import { useRef, useState, type DragEvent, type ChangeEvent } from 'react'
import { getUploadUrl, uploadToR2 } from '../../../lib/r2'
import { supabase } from '../../../lib/supabase'

interface UploadedPhoto {
  id: string
  url: string
  thumb_url: string
  filename: string
  size_bytes: number
  r2_key: string
}

interface UploadItem {
  id: string
  file: File
  progress: number
  status: 'uploading' | 'done' | 'error'
  preview: string
}

interface Props {
  galleryId: string
  photographerId: string
  photos: UploadedPhoto[]
  onPhotosChange: (photos: UploadedPhoto[]) => void
}

export function Step2Upload({ galleryId, photographerId, photos, onPhotosChange }: Props) {
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function updateUpload(id: string, updates: Partial<UploadItem>) {
    setUploads(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u))
  }

  async function processFiles(files: File[]) {
    const imageFiles = files.filter(f => f.type.startsWith('image/'))
    if (!imageFiles.length) return

    const newUploads: UploadItem[] = imageFiles.map(file => ({
      id: crypto.randomUUID(),
      file,
      progress: 0,
      status: 'uploading' as const,
      preview: URL.createObjectURL(file),
    }))
    setUploads(prev => [...prev, ...newUploads])

    for (const item of newUploads) {
      try {
        const { uploadUrl, publicUrl, key } = await getUploadUrl(
          item.file.name,
          item.file.type,
          galleryId,
          photographerId,
          false
        )

        await uploadToR2(uploadUrl, item.file, (pct) => {
          updateUpload(item.id, { progress: pct })
        })

        // Save to DB
        const { data: photo } = await supabase.from('photos').insert({
          gallery_id: galleryId,
          r2_key: key,
          url: publicUrl,
          thumb_url: publicUrl,
          filename: item.file.name,
          size_bytes: item.file.size,
          position: photos.length,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any).select().single()

        if (photo) {
          onPhotosChange([...photos, photo as UploadedPhoto])
        }
        updateUpload(item.id, { status: 'done', progress: 100 })
      } catch {
        updateUpload(item.id, { status: 'error' })
      }
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    processFiles(Array.from(e.dataTransfer.files))
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files) processFiles(Array.from(e.target.files))
    e.target.value = ''
  }

  function removePhoto(photoId: string) {
    onPhotosChange(photos.filter(p => p.id !== photoId))
  }

  return (
    <div className="bg-white border border-border rounded-[14px] p-7 mb-[18px]">
      <div className="font-display text-[17px] font-medium text-ink mb-5 pb-4 border-b border-teal-pale">
        Upload Photos
      </div>

      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-[14px] py-14 px-10 text-center bg-white transition-all cursor-pointer mb-5 ${dragging ? 'border-teal bg-teal-pale' : 'border-border hover:border-teal hover:bg-teal-pale'}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        <div className="w-[60px] h-[60px] mx-auto mb-4 bg-teal-pale rounded-full flex items-center justify-center">
          <svg className="w-[26px] h-[26px] text-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
            <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
          </svg>
        </div>
        <h3 className="font-display text-[22px] font-light text-[#2a5250] mb-1.5">Drop photos here</h3>
        <p className="text-[13px] text-ink-muted">
          or <span className="text-teal font-medium underline cursor-pointer">browse files</span> — JPG, PNG, WebP
        </p>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
      </div>

      {/* Upload progress list */}
      {uploads.length > 0 && (
        <div className="flex flex-col gap-2 mb-5">
          {uploads.map(item => (
            <div key={item.id} className="bg-white border border-border rounded-[10px] px-3.5 py-3 flex items-center gap-3 animate-[slideIn_0.3s_ease]">
              <img src={item.preview} alt="" className="w-[42px] h-[42px] rounded-md object-cover bg-teal-pale flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-[#2a5250] truncate mb-[5px]">{item.file.name}</div>
                {item.status === 'done' ? (
                  <span className="text-[13px] font-medium text-teal">✓ Done</span>
                ) : item.status === 'error' ? (
                  <span className="text-[13px] text-red">Upload failed</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-[3px] bg-teal-pale rounded-full">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-teal to-teal-light transition-[width_0.4s]"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-ink-muted min-w-[30px] text-right">{item.progress}%</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded photo grid */}
      {photos.length > 0 && (
        <>
          <div className="text-[12px] font-medium text-ink-muted mb-3">{photos.length} photo{photos.length !== 1 ? 's' : ''} uploaded</div>
          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
            {photos.map(photo => (
              <div key={photo.id} className="aspect-square rounded-lg overflow-hidden relative cursor-pointer bg-teal-pale group">
                <img src={photo.url} alt={photo.filename ?? ''} className="w-full h-full object-cover block transition-transform duration-300 group-hover:scale-[1.06]" />
                <div className="absolute inset-0 bg-transparent group-hover:bg-black/28 transition-colors flex items-center justify-center">
                  <button
                    onClick={() => removePhoto(photo.id)}
                    className="w-7 h-7 rounded-full bg-white/92 border-0 cursor-pointer flex items-center justify-center text-ink opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all hover:bg-red hover:text-white"
                  >
                    <svg className="w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
