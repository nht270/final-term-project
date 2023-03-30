import dotenv from 'dotenv'
import { createServer } from 'http'
import app from './src/app.js'
import { initSocketIO } from './src/socketIO.js'

dotenv.config()

const server = createServer(app)
const PORT = process.env.PORT || 8080

initSocketIO(server)

server.listen(PORT, () => {
    console.log('Server running, port', 8080)
})

export default server