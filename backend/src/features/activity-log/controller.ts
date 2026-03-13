import { Request, Response } from 'express'
import AppError from '../../errors/AppError'
import ActivityLog from './model'

export async function getAllActivityLogs(req: Request, res: Response) {
  try {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const skip = (page - 1) * limit

    const count = await ActivityLog.countDocuments()

    const logs = await ActivityLog.find()
      .populate('user', 'name email role') // populate user details
      .sort({ createdAt: -1 }) // latest first
      .skip(skip)
      .limit(limit)

    res.json({
      logs,
      page,
      limit,
      pages: Math.ceil(count / limit),
      total: count,
    })
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message })
    }
    console.log(error)
    res.status(500).json({
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    })
  }
}
