import { zipSync } from 'npm:fflate@^0.8'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface PhotoEntry {
  url: string
  filename?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { photos, zipName = 'photos' }: { photos: PhotoEntry[]; zipName?: string } = await req.json()

    if (!Array.isArray(photos) || photos.length === 0) {
      return new Response(JSON.stringify({ error: 'No photos provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch all photos server-side (no CORS restrictions here)
    const results = await Promise.all(
      photos.map(async (photo, idx) => {
        try {
          const res = await fetch(photo.url)
          if (!res.ok) return null
          const buf = await res.arrayBuffer()
          const name = photo.filename || `photo-${idx + 1}.jpg`
          return { name, data: new Uint8Array(buf) }
        } catch {
          return null
        }
      })
    )

    const files: Record<string, Uint8Array> = {}
    for (const entry of results) {
      if (entry) files[entry.name] = entry.data
    }

    if (Object.keys(files).length === 0) {
      return new Response(JSON.stringify({ error: 'No photos could be fetched' }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const zipped = zipSync(files)

    const safeZipName = zipName.replace(/[^a-zA-Z0-9 _\-]/g, '_')

    return new Response(zipped, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${safeZipName}.zip"`,
      },
    })
  } catch (err) {
    console.error('[zip-photos]', err)
    return new Response(JSON.stringify({ error: 'Failed to create zip' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
