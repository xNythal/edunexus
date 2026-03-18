import cookieParser from 'cookie-parser'
import cors from 'cors'
import 'dotenv/config'
import express, { NextFunction, Request, Response } from 'express'
import helmet from 'helmet'
import { serve } from 'inngest/express'
import morgan from 'morgan'
import { connectDb } from './config/db'
import AppError from './errors/AppError'
import academicYearRoutes from './features/academic-year/router'
import logsRoutes from './features/activity-log/router'
import classRouter from './features/class/router'
import dashboardRouter from './features/dashboard/router'
import examRouter from './features/exam/router'
import subjectRouter from './features/subject/router'
import timeTableRouter from './features/timetable/router'
import userRoutes from './features/user/router'
import { functions, inngest } from './inngest'

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
app.use('/api/subjects', subjectRouter)
app.use('/api/timetables', timeTableRouter)
app.use('/api/exams', examRouter)
app.use('/api/dashboard', dashboardRouter)
app.use(
  '/api/inngest',
  serve({
    client: inngest,
    functions,
  }),
)

app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ message: error.message })
  }
  console.log(error)
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? error : undefined,
  })
})

connectDb().then(() =>
  app.listen(PORT, () => {
    console.log('Server is running on port:', PORT)
  }),
)
