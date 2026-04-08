import { MongoClient, GridFSBucket, type Db } from 'mongodb'
import env from '#start/env'

const IMAGES_BUCKET = 'images'

class MongoService {
  private client: MongoClient | null = null
  private db: Db | null = null
  private bucket: GridFSBucket | null = null

  async connect() {
    if (this.client) return

    const client = new MongoClient(env.get('MONGO_URI'))
    await client.connect()

    this.client = client
    this.db = client.db(env.get('MONGO_DATABASE'))
    this.bucket = new GridFSBucket(this.db, { bucketName: IMAGES_BUCKET })
  }

  async disconnect() {
    if (!this.client) return

    await this.client.close()
    this.client = null
    this.db = null
    this.bucket = null
  }

  getClient() {
    return this.requireConnection(this.client, 'client')
  }

  getDb() {
    return this.requireConnection(this.db, 'database')
  }

  getBucket() {
    return this.requireConnection(this.bucket, 'images bucket')
  }

  private requireConnection<T>(value: T | null, name: string): T {
    if (!value) {
      throw new Error(`MongoDB ${name} is not connected — call connect() first`)
    }
    return value
  }
}

export default new MongoService()
