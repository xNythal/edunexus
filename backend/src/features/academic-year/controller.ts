import { Request, Response } from 'express'
import AppError from '../../errors/AppError'
import logActivity from '../../utils/activityLog'
import AcademicYear from './model'

export async function createAcademicYear(req: Request, res: Response) {
  try {
    const { name, fromYear, toYear, isCurrent } = req.body

    const existingYear = await AcademicYear.findOne({ fromYear, toYear })
    if (existingYear) throw new AppError('Academic year already exists', 409)

    if (isCurrent) {
      await AcademicYear.updateMany({}, { isCurrent: false })
    }

    const academicYear = await AcademicYear.create({
      name,
      fromYear,
      toYear,
      isCurrent: isCurrent || false,
    })

    if (req.user) {
      await logActivity({
        userId: req.user._id.toString(),
        action: 'Create Academic Year',
        details: `Created academic year: ${name}`,
      })
    }
    res.status(201).json({
      message: 'Academic year created successfully',
      academicYear,
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

export async function getCurrentAcademicYear(req: Request, res: Response) {
  try {
    const currentYear = await AcademicYear.findOne({ isCurrent: true })
    if (!currentYear) throw new AppError('No current academic year found', 404)
    res.json({ currentYear })
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

export async function updateAcademicYear(req: Request, res: Response) {
  try {
    const { isCurrent, name, fromYear, toYear } = req.body
    const academicYear = await AcademicYear.findById(req.params.id)
    if (!academicYear) throw new AppError('Academic year not found', 404)
    if (isCurrent) await AcademicYear.updateMany({}, { isCurrent: false })
    academicYear.name = name || academicYear.name
    academicYear.fromYear = fromYear || academicYear.fromYear
    academicYear.toYear = toYear || academicYear.toYear
    academicYear.isCurrent = isCurrent || academicYear.isCurrent

    const updatedAcademicYear = await academicYear.save()

    if (req.user) {
      await logActivity({
        userId: req.user._id.toString(),
        action: 'Update Academic Year',
        details: `Updated academic year: ${updatedAcademicYear.name}`,
      })
    }

    res.json({
      message: 'Academic year updated successfully',
      academicYear: updatedAcademicYear,
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

export async function deleteAcademicYear(req: Request, res: Response) {
  try {
    const year = await AcademicYear.findById(req.params.id)
    if (!year) {
      throw new AppError('Academic year not found', 404)
    }
    if (year) {
      // Prevent deletion if it's the current academic year to avoid system breakage
      if (year.isCurrent) {
        throw new AppError('Cannot delete the current academic year', 400)
      }
    }
    await year.deleteOne()

    if (req.user) {
      await logActivity({
        userId: req.user._id.toString(),
        details: `Deleted academic year ${year.name}`,
        action: 'Delete Academic Year',
      })
    }
    res.json({ message: 'Academic Year deleted successfully' })
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

export async function getAllAcademicYears(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const search = req.query.search as string

    // Build Search Query (Search by Name)
    const query: any = {}
    if (search) {
      query.name = { $regex: search, $options: 'i' }
    }

    const [total, years] = await Promise.all([
      AcademicYear.countDocuments(query),
      AcademicYear.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ])

    res.json({
      academicYears: years,
      total,
      page,
      pages: Math.ceil(total / limit),
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
