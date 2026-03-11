import { MongoClient, GridFSBucket } from 'mongodb'
import env from '#start/env'

class MongoService {
  private client: MongoClient | null = null
  private bucket: GridFSBucket | null = null

  async connect() {
    if (this.client) {
      return
    }

    this.client = new MongoClient(env.get('MONGO_URI'))
    await this.client.connect()

    const db = this.client.db(env.get('MONGO_DATABASE'))
    this.bucket = new GridFSBucket(db, { bucketName: 'images' })
  }

  async disconnect() {
    if (!this.client) {
      return
    }

    await this.client.close()
    this.client = null
    this.bucket = null
  }

  getBucket() {
    if (!this.bucket) {
      throw new Error('MongoDB not connected')
    }
    return this.bucket
  }

  getClient() {
    if (!this.client) {
      throw new Error('MongoDB not connected')
    }
    return this.client
  }
}

export default new MongoService()
