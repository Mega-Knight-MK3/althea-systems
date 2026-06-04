import { Server as HttpServer } from 'node:http'
import { Server } from 'socket.io'
import type { Socket } from 'socket.io'
import { hashToken } from '#services/token_factory'
import db from '@adonisjs/lucid/services/db'

let io: Server | null = null

export function initializeSocketIO(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
    path: '/socket.io/',
  })

  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token

      if (!token) {
        return next(new Error('Authentication required'))
      }

      const hash = hashToken(token as string)
      const accessToken = await db
        .from('auth_access_tokens')
        .where('hash', hash)
        .where('expires_at', '>', new Date())
        .first()

      if (!accessToken) {
        return next(new Error('Invalid or expired token'))
      }

      const user = await db.from('users').where('id', accessToken.tokenable_id).first()

      if (!user || !user.is_active) {
        return next(new Error('User not found or inactive'))
      }

      socket.data.user = user
      next()
    } catch (error) {
      next(new Error('Authentication failed'))
    }
  })

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user
    console.log(`User connected: ${user.email} (${user.id})`)

    socket.on('join', (room: string) => {
      socket.join(room)
      console.log(`User ${user.email} joined room: ${room}`)
    })

    socket.on('leave', (room: string) => {
      socket.leave(room)
      console.log(`User ${user.email} left room: ${room}`)
    })

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${user.email}`)
    })
  })

  return io
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.IO not initialized')
  }
  return io
}
