import dotenv from 'dotenv'
import http from 'http'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { Server as SocketServer, Socket } from 'socket.io'

interface ServerToClientEvents {
    expiredToken: () => void
    requiredToken: () => void
    newNotification: () => void
}

interface ClientToServerEvents {
}

dotenv.config()

let socketIO: SocketServer<ClientToServerEvents, ServerToClientEvents> | null = null

export function initSocketIO(server: http.Server) {
    socketIO = socketIO || new SocketServer<ClientToServerEvents, ServerToClientEvents>(server, { cors: { origin: '*' } })
    socketIO.on('connect', connectListener)

    return socketIO
}

export function getSocketIO() {
    if (!socketIO) {
        throw new Error('Socket server not yet initial')
    }

    return socketIO
}


function connectListener(socket: Socket<ClientToServerEvents, ServerToClientEvents>) {
    const token = String(socket.handshake.auth.token || '')

    if (token === '') {
        socket.emit('requiredToken')
        socket.disconnect()
        return
    }

    try {
        const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'token'
        const jwtPayload = jwt.verify(token, JWT_SECRET_KEY) as JwtPayload
        const userAccountId = String(jwtPayload.id)
        socket.join(userAccountId)
    } catch (error) {
        console.log((error as Error).message)
        socket.emit('expiredToken')
        socket.disconnect()
    }
}