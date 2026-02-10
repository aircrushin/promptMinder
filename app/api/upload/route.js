import { NextResponse } from 'next/server'
import sharp from 'sharp'
import { getSupabaseStorage } from '@/lib/supabase-storage.js'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('image')

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const storage = getSupabaseStorage()

    const buffer = Buffer.from(await file.arrayBuffer())
    const sharpInstance = sharp(buffer)
    const metadata = await sharpInstance.metadata()

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
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}
