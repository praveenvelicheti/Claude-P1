import JSZip from 'jszip'

export async function downloadZip(
  photos: Array<{ url: string; filename?: string }>,
  zipName = 'photos.zip',
  onProgress?: (pct: number) => void
) {
  const zip = new JSZip()
  const folder = zip.folder('photos')!

  let done = 0
  await Promise.all(
    photos.map(async (photo, idx) => {
      try {
        const res = await fetch(photo.url)
        const blob = await res.blob()
        const name = photo.filename || `photo-${idx + 1}.jpg`
        folder.file(name, blob)
      } catch {
        // skip failed photos
      } finally {
        done++
        onProgress?.(Math.round((done / photos.length) * 100))
      }
    })
  )

  const blob = await zip.generateAsync({ type: 'blob' }, (meta) => {
    onProgress?.(Math.round(meta.percent))
  })

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = zipName
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
