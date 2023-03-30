import dotenv from 'dotenv'
import mysql from 'mysql2/promise'

dotenv.config()

// mysql configs
const MYSQL_HOST = process.env.MYSQL_HOST || 'localhost'
const MYSQL_USER = process.env.MYSQL_USER || 'root'
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || 'root'
const MYSQL_DB = process.env.MYSQL_DB || 'ace_coffee_db'
const CONNECTION_LIMIT = 10

const MYSQL_POOL_OPTIONS: mysql.PoolOptions = {
    host: MYSQL_HOST,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DB,
    connectionLimit: CONNECTION_LIMIT
}

const pool = mysql.createPool(MYSQL_POOL_OPTIONS)

export default pool