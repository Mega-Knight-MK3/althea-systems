import type { HttpContext } from '@adonisjs/core/http'
import { ObjectId } from 'mongodb'
import { Readable } from 'node:stream'
import Product from '#models/product'
import mongoService from '#services/mongo_service'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export default class ProductImagesController {
  async index({ params }: HttpContext) {
    const product = await Product.findByOrFail('slug', params.slug)
    const files = await mongoService
      .getBucket()
      .find({ 'metadata.productId': product.id })
      .sort({ 'metadata.position': 1, uploadDate: 1 })
      .toArray()

    return files.map(serializeFile)
  }

  async show({ params, response }: HttpContext) {
    const id = parseObjectId(params.id)
    if (!id) return response.notFound()

    const bucket = mongoService.getBucket()
    const [file] = await bucket.find({ _id: id }).limit(1).toArray()
    if (!file) return response.notFound()

    const contentType = (file.metadata?.contentType as string) ?? 'application/octet-stream'
    response.header('Content-Type', contentType)
    response.header('Cache-Control', 'public, max-age=31536000, immutable')
    return response.stream(bucket.openDownloadStream(id))
  }

  async store({ params, request, response }: HttpContext) {
    const product = await Product.findByOrFail('slug', params.slug)
    const file = request.file('image', {
      size: `${MAX_IMAGE_BYTES}b`,
      extnames: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    })

    if (!file || !file.tmpPath) {
      return response.unprocessableEntity({ message: 'image is required' })
    }
    const contentType = `${file.type}/${file.subtype}`
    if (!file.type || !ALLOWED_MIME_TYPES.includes(contentType)) {
      return response.unprocessableEntity({ message: 'unsupported image type' })
    }

    const fs = await import('node:fs')
    const stream = fs.createReadStream(file.tmpPath)
    const metadata = {
      productId: product.id,
      contentType,
      position: Number(request.input('position', 0)),
      alt: request.input('alt', null),
    }
    const uploadStream = mongoService.getBucket().openUploadStream(file.clientName, { metadata })

    await pipe(stream, uploadStream)
    return response.created(
      serializeFile({
        _id: uploadStream.id,
        filename: file.clientName,
        length: file.size ?? 0,
        uploadDate: new Date(),
        metadata,
      })
    )
  }

  async destroy({ params, response }: HttpContext) {
    const id = parseObjectId(params.id)
    if (!id) return response.notFound()

    await mongoService.getBucket().delete(id)
    return response.noContent()
  }
}

function parseObjectId(value: string): ObjectId | null {
  if (!ObjectId.isValid(value)) return null
  return new ObjectId(value)
}

function serializeFile(file: {
  _id: ObjectId | unknown
  filename: string
  length: number
  uploadDate: Date
  metadata?: Record<string, unknown> | null
}) {
  return {
    id: String(file._id),
    filename: file.filename,
    contentType: (file.metadata?.contentType as string | undefined) ?? null,
    size: file.length,
    uploadedAt: file.uploadDate,
    metadata: file.metadata ?? null,
  }
}

function pipe(source: Readable, destination: NodeJS.WritableStream): Promise<void> {
  return new Promise((resolve, reject) => {
    source.on('error', reject)
    destination.on('error', reject)
    destination.on('finish', resolve)
    source.pipe(destination)
  })
}
