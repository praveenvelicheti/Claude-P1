const ZIP_FUNCTION_URL = 'https://vvduriumhgnjbrrzchql.supabase.co/functions/v1/zip-photos'

export async function downloadZip(
  photos: Array<{ url: string; filename?: string }>,
  zipName = 'photos.zip',
) {
  // Strip .zip suffix for the edge function (it appends .zip itself)
  const baseName = zipName.endsWith('.zip') ? zipName.slice(0, -4) : zipName

  const res = await fetch(ZIP_FUNCTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ photos, zipName: baseName }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? `Zip failed: ${res.status}`)
  }

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = zipName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
