import { Request, Response } from 'express'
import mongoose from 'mongoose'
import AppError from '../../errors/AppError'
import logActivity from '../../utils/activityLog'
import Class from './model'

export async function createClass(req: Request, res: Response) {
  const { name, classTeacher, capacity, academicYear, subjects } = req.body

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
    subjects,
  })

  if (req.user) {
    await logActivity({
      userId: req.user._id.toString(),
      action: 'Create Class',
      details: `Created class: ${name}`,
    })
  }

  res.json({ message: 'Created class successfully', class: newClass })
}

export async function updateClass(req: Request, res: Response) {
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
}

export async function deleteClass(req: Request, res: Response) {
  if (Array.isArray(req.params.id)) {
    throw new AppError('Multiple ids not allowed', 400)
  }
  if (!req.params.id) {
    throw new AppError("id can't be empty", 400)
  }
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw new AppError('Invalid class ID', 400)
  }
  const deletedClass = await Class.findByIdAndDelete(req.params.id)
  if (!deletedClass) {
    throw new AppError('Class not found', 404)
  }
  if (req.user) {
    await logActivity({
      userId: req.user._id.toString(),
      details: `Deleted class ${deletedClass.name}`,
      action: `Delete class`,
    })
  }

  res.json({ message: 'Class removed' })
}

export async function getAllClasses(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10
  const search = req.query.search as string

  const query: any = {}
  if (search) {
    query.name = { $regex: search, $options: 'i' }
  }

  const [total, classes] = await Promise.all([
    Class.countDocuments(query),
    Class.find(query)
      .populate('academicYear', 'name')
      .populate('classTeacher', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
  ])

  res.json({
    classes,
    total,
    page,
    pages: Math.ceil(total / limit),
  })
}
