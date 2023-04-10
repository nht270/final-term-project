import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import router from './api/routers/index.js'
dotenv.config()

const app = express()
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || ''

// app.use(cors({ origin: CLIENT_ORIGIN }))
app.use(cors({ origin: '*' }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/', router)

export default app