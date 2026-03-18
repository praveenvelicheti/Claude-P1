/**
 * R2 upload helpers.
 * The frontend requests a presigned URL from a Supabase Edge Function,
 * then PUTs the file directly to Cloudflare R2.
 */

export interface UploadUrlResponse {
  uploadUrl: string
  publicUrl: string
  key: string
}

/** Request a presigned upload URL from our Edge Function */
export async function getUploadUrl(
  filename: string,
  contentType: string,
  galleryId: string,
  photographerId: string,
  isThumb = false
): Promise<UploadUrlResponse> {
  const { supabase } = await import('./supabase')
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')
  const { data, error } = await supabase.functions.invoke('get-upload-url', {
    body: { filename, contentType, galleryId, photographerId, isThumb },
    headers: { Authorization: `Bearer ${session.access_token}` },
  })
  if (error) throw error
  return data as UploadUrlResponse
}

/** Upload a file directly to R2 via presigned PUT URL with progress reporting */
export async function uploadToR2(
  uploadUrl: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', uploadUrl)
    xhr.setRequestHeader('Content-Type', file.type)

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100))
        }
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`))
      }
    }
    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.send(file)
  })
}
