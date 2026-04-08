import app from '@adonisjs/core/services/app'
import mongoService from '#services/mongo_service'

await mongoService.connect()

app.terminating(async () => {
  await mongoService.disconnect()
})
