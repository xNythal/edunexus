import cookieParser from 'cookie-parser'
import cors from 'cors'
import 'dotenv/config'
import express, { NextFunction, Request, Response } from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import { connectDb } from './config/db'
import academicYearRoutes from './features/academic-year/router'
import logsRoutes from './features/activity-log/router'
import classRouter from './features/class/router'
import userRoutes from './features/user/router'

const PORT = process.env.PORT || 3000

const app = express()

app.use(helmet())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
)

if (process.env.NODE_ENV === 'development') app.use(morgan('dev'))

app.get('/', (_, res) => {
  res.json({ status: 'OK', message: 'Server is healthy.' })
})

app.use('/api/users', userRoutes)
app.use('/api/activity-logs', logsRoutes)
app.use('/api/academic-years', academicYearRoutes)
app.use('/api/classes', classRouter)

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode
  res.status(statusCode)
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  })
})

connectDb().then(() =>
  app.listen(PORT, () => {
    console.log('Server is running on port:', PORT)
  }),
)
