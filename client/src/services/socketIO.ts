import { io, Socket } from 'socket.io-client'
import * as LocalStoargeUtil from '../utils/localStorage'
import { refreshAccessToken } from './general'

const USER_SOCKET_ENDPOINT = 'http://localhost:8080'

interface ServerToClientEvents {
    expiredToken: () => void
    requiredToken: () => void
    newNotification: () => void
}

interface ClientToServerEvents {
}

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(USER_SOCKET_ENDPOINT)

socket.on('expiredToken', async () => {
    await refreshAccessToken()
    refetchToken(socket)
    socket.connect()
})

export function refetchToken(socket: Socket<ServerToClientEvents, ClientToServerEvents>) {
    socket.auth = { token: LocalStoargeUtil.getAccessToken() }
    return socket
}

export function getSoket() {
    return socket
}