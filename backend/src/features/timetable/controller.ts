import { type Request, type Response } from 'express'
import AppError from '../../errors/AppError'
import { inngest } from '../../inngest'
import logActivity from '../../utils/activityLog'
import Timetable from './model'

export const generateTimetable = async (req: Request, res: Response) => {
  const { classId, academicYearId, settings } = req.body

  await inngest.send({
    name: 'timetable/generate',
    data: {
      classId,
      academicYearId,
      settings,
    },
  })

  if (req.user) {
    await logActivity({
      userId: req.user._id.toString(),
      details: `Requested timetable generation for class ID: ${classId}`,
      action: 'Generate Timetable',
    })
  }

  res.status(200).json({ message: 'Timetable generation initiated' })
}

export const getTimetable = async (req: Request, res: Response) => {
  const timetable = await Timetable.findOne({ class: req.params.classId })
    .populate('schedule.periods.subject', 'name code')
    .populate('schedule.periods.teacher', 'name email')

  if (!timetable) throw new AppError('Timetable not found', 404)

  res.json({ timetable })
}
