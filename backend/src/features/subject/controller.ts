import { Request, Response } from 'express'
import AppError from '../../errors/AppError'
import logActivity from '../../utils/activityLog'
import Subject from './model'

export async function createSubject(req: Request, res: Response) {
  const { name, code, teachers, isActive } = req.body
  const subjectExists = await Subject.findOne({ code })
  if (subjectExists) {
    throw new AppError('Subject code already exists', 400)
  }
  const newSubject = await Subject.create({
    name,
    code,
    isActive,
    teachers: Array.isArray(teachers) ? teachers : [],
  })
  if (req.user) {
    await logActivity({
      userId: req.user._id.toString(),
      action: 'Created Subject',
      details: `Created subject: ${newSubject.name}`,
    })
    res
      .status(201)
      .json({ message: 'Subject created successfully', subject: newSubject })
  }
}

export const getAllSubjects = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10
  const search = req.query.search as string

  const query: any = {}
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
    ]
  }

  const [total, subjects] = await Promise.all([
    Subject.countDocuments(query),
    Subject.find(query)
      .populate('teachers', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
  ])

  res.json({
    subjects,
    total,
    page,
    pages: Math.ceil(total / limit),
  })
}

export const updateSubject = async (req: Request, res: Response) => {
  const { name, code, teachers, isActive } = req.body

  const updatedSubject = await Subject.findByIdAndUpdate(
    req.params.id,
    {
      name,
      code,
      isActive,
      teachers: Array.isArray(teachers) ? teachers : [],
    },
    { returnDocument: 'after', runValidators: true },
  )

  if (!updatedSubject) {
    throw new AppError('Subject not found', 404)
  }

  if (req.user) {
    await logActivity({
      userId: req.user._id.toString(),
      details: `Updated subject: ${updatedSubject.name}`,
      action: 'Update Subject',
    })
  }

  res.json({ message: 'Subject updated successfully', subject: updatedSubject })
}

export const deleteSubject = async (req: Request, res: Response) => {
  const deletedSubject = await Subject.findByIdAndDelete(req.params.id)
  if (!deletedSubject) {
    throw new AppError('Subject not found', 404)
  }

  if (req.user) {
    await logActivity({
      userId: req.user._id.toString(),
      details: `Deleted subject: ${deletedSubject?.name}`,
      action: 'Delete Subject',
    })
  }

  res.json({ message: 'Subject deleted successfully' })
}
