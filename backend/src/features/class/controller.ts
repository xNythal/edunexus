import { Request, Response } from 'express'
import AppError from '../../errors/AppError'
import logActivity from '../../utils/activityLog'
import Class from './model'

export async function createClass(req: Request, res: Response) {
  try {
    const { name, classTeacher, capacity, academicYear } = req.body

    const existingClass = await Class.findOne({ name, academicYear })
    if (existingClass) {
      throw new AppError(
        'Class with this name already exists for this academic year',
        409,
      )
    }

    const newClass = await Class.create({
      name,
      classTeacher,
      capacity,
      academicYear,
    })

    if (req.user) {
      await logActivity({
        userId: req.user._id.toString(),
        action: 'Create Class',
        details: `Created class: ${name}`,
      })
    }

    res.json({ message: 'Created class successfully', class: newClass })
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

export async function updateClass(req: Request, res: Response) {
  try {
    const classId = req.params.id
    if (Array.isArray(classId)) {
      throw new AppError('Multiple ids not allowed', 400)
    }
    const targetClass = await Class.findById(classId)
    if (!targetClass) throw new AppError('Class not found', 404)
    const { name, classTeacher, academicYear, capacity } = req.body
    const existingClass = await Class.findOne({
      _id: { $ne: classId },
      name: name ?? targetClass.name,
      academicYear: academicYear ?? targetClass.academicYear,
    })
    if (existingClass)
      throw new AppError(
        'Class with this name already exists for this academic year',
        409,
      )

    if (name !== undefined) targetClass.name = name
    if (classTeacher !== undefined) targetClass.classTeacher = classTeacher
    if (academicYear !== undefined) targetClass.academicYear = academicYear
    if (capacity !== undefined) targetClass.capacity = capacity

    targetClass.save({ validateBeforeSave: true })
    if (req.user) {
      await logActivity({
        userId: req.user._id.toString(),
        action: 'Update Class',
        details: `Updated class: ${name}`,
      })
    }
    res.json({ message: 'Updated class successfully', class: targetClass })
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
