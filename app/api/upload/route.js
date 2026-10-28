import { NextResponse } from 'next/server'
import sharp from 'sharp'
import { getSupabaseStorage } from '@/lib/supabase-storage.js'
import { requireUserId } from '@/lib/auth.js'
import { ApiError } from '@/lib/api-error.js'

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024
const MAX_PIXELS = 40_000_000
const uploadAttempts = new Map()

function assertUploadRate(request) {
  const key = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const now = Date.now()
  const current = uploadAttempts.get(key)
  if (uploadAttempts.size > 5000) {
    const cutoff = now - 60_000
    for (const [entryKey, entry] of uploadAttempts) {
      if (entry.startedAt < cutoff) uploadAttempts.delete(entryKey)
    }
  }
  if (!current || now - current.startedAt >= 60_000) {
    uploadAttempts.set(key, { startedAt: now, count: 1 })
    return
  }
  if (current.count >= 10) throw new ApiError(429, 'Too many upload requests', { code: 'RATE_LIMITED' })
  current.count += 1
}

export async function POST(request) {
  try {
    await requireUserId(request)
    assertUploadRate(request)
    const contentLength = Number(request.headers.get('content-length') || 0)
    if (contentLength > MAX_UPLOAD_BYTES + 64 * 1024) {
      return NextResponse.json({ error: 'Image is too large' }, { status: 413 })
    }
    const formData = await request.formData()
    const file = formData.get('image')

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const storage = getSupabaseStorage()

    if (typeof file.size === 'number' && file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'Image is too large' }, { status: 413 })
    }
    if (file.type && !['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported image type' }, { status: 415 })
    }
    const buffer = Buffer.from(await file.arrayBuffer())
    const sharpInstance = sharp(buffer)
    const metadata = await sharpInstance.metadata()
    if (!metadata.width || !metadata.height || metadata.width * metadata.height > MAX_PIXELS) {
      return NextResponse.json({ error: 'Image dimensions are too large' }, { status: 413 })
    }

    const sizes = [
      { width: 400, suffix: '-sm' },
      { width: 800, suffix: '-md' },
      { width: 1200, suffix: '-lg' }
    ]

    const uploadPromises = []
    const baseFileName = `${Date.now()}`

    for (const size of sizes) {
      const webpBuffer = await sharp(buffer)
        .resize(size.width, null, { withoutEnlargement: true, fit: 'inside' })
        .webp({ quality: 80 })
        .toBuffer()

      const webpFileName = `${baseFileName}${size.suffix}.webp`
      uploadPromises.push(
        storage.from('cover').upload(webpFileName, webpBuffer, { contentType: 'image/webp' })
      )
    }

    const compressedImageBuffer = await sharp(buffer)
      .resize(800, null, { withoutEnlargement: true, fit: 'inside' })
      .jpeg({ quality: 85, progressive: true })
      .toBuffer()

    const fileName = `${baseFileName}.jpg`
    const { data, error } = await storage.from('cover').upload(fileName, compressedImageBuffer, { contentType: 'image/jpeg' })

    if (error) {
      throw error
    }

    await Promise.all(uploadPromises)

    const { data: { publicUrl } } = storage.from('cover').getPublicUrl(fileName)

    const webpUrls = sizes.reduce((acc, size) => {
      const webpUrl = storage.from('cover').getPublicUrl(`${baseFileName}${size.suffix}.webp`).data.publicUrl
      acc[size.suffix.replace('-', '')] = webpUrl
      return acc
    }, {})

    return NextResponse.json({
      url: publicUrl,
      webp: webpUrls,
      metadata: { width: metadata.width, height: metadata.height, format: metadata.format }
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message, code: error.details?.code }, { status: error.status })
    }
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}
