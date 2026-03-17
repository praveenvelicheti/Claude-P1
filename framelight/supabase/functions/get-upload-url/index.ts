import { S3Client, PutObjectCommand } from 'npm:@aws-sdk/client-s3'
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface RequestBody {
  filename: string
  contentType: string
  galleryId: string
  photographerId: string
  isThumb?: boolean
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { filename, contentType, galleryId, photographerId, isThumb = false }: RequestBody = await req.json()

    const ext = filename.split('.').pop() ?? 'jpg'
    const uuid = crypto.randomUUID()
    const key = isThumb
      ? `${photographerId}/${galleryId}/thumbs/${uuid}.jpg`
      : `${photographerId}/${galleryId}/${uuid}.${ext}`

    const client = new S3Client({
      region: 'auto',
      endpoint: `https://${Deno.env.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID') ?? '',
        secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY') ?? '',
      },
    })

    const command = new PutObjectCommand({
      Bucket: Deno.env.get('R2_BUCKET_NAME') ?? 'framelight-photos',
      Key: key,
      ContentType: contentType,
    })

    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 })
    const publicUrl = `${Deno.env.get('R2_PUBLIC_URL')}/${key}`

    return new Response(
      JSON.stringify({ uploadUrl, publicUrl, key }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error(err)
    return new Response(
      JSON.stringify({ error: 'Failed to generate upload URL' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
