import { type Request, type Response } from 'express'
import AppError from '../../errors/AppError'
import { inngest } from '../../inngest'
import logActivity from '../../utils/activityLog.js'
import Subject from '../subject/model'
import Exam from './model'
import Submission from './submission'

export const triggerExamGeneration = async (req: Request, res: Response) => {
  const {
    title,
    subject,
    class: classId,
    duration,
    dueDate,
    topic,
    difficulty,
    count,
  } = req.body
  const subjectDoc = await Subject.findById(subject)
  if (!subjectDoc) throw new AppError('Subject not found', 404)

  const teacherId = (req as any).user._id
  const draftExam = await Exam.create({
    title: title || `Auto-Generated: ${topic}`,
    subject,
    class: classId,
    teacher: teacherId,
    duration: duration || 60,
    dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    isActive: false,
    questions: [],
  })

  if (req.user) {
    await logActivity({
      userId: req.user._id.toString(),
      details: `User triggered exam generation: ${draftExam._id}`,
      action: 'Generate Exam',
    })
  }

  await inngest.send({
    name: 'exam/generate',
    data: {
      examId: draftExam._id,
      topic,
      subjectName: subjectDoc.name,
      difficulty: difficulty || 'Medium',
      count: count || 10,
    },
  })
  res.status(202).json({
    message: 'Exam generation started.',
    examId: draftExam._id,
  })
}

// export const createExam = async (req: Request, res: Response) => {
//   if (!req.user) return
//   const exam = await Exam.create({
//     ...req.body,
//     teacher: req.user._id,
//   })

//   await logActivity({
//     userId: req.user._id.toString(),
//     action: 'User created a new exam',
//   })
//   res.status(201).json(exam)
// }

export const getExams = async (req: Request, res: Response) => {
  if (!req.user) return

  let query = {}

  if (req.user.role === 'student') {
    query = { class: req.user.studentClass, isActive: true }
  } else if (req.user.role === 'teacher') {
    query = { teacher: req.user._id }
  }

  const exams = await Exam.find(query)
    .populate('subject', 'name')
    .populate('class', 'name section')
    .select('-questions.correctAnswer')

  res.json(exams)
}

export const getExamById = async (req: Request, res: Response) => {
  if (!req.user) return
  const examId = req.params.id

  let query = Exam.findById(examId)
    .populate('subject', 'name code')
    .populate('class', 'name section')
    .populate('teacher', 'name email')

  if (req.user.role === 'teacher' || req.user.role === 'admin') {
    query = query.select('+questions.correctAnswer')
  }

  const exam = await query

  if (!exam) {
    throw new AppError('Exam not found', 404)
  }

  if (req.user.role === 'student') {
    const examClassId = exam.class._id
      ? exam.class._id.toString()
      : exam.class.toString()
    const userClassId = req.user.studentClass
      ? req.user.studentClass.toString()
      : ''

    if (examClassId !== userClassId) {
      throw new AppError('You are not authorized to view this exam', 403)
    }
  }

  res.json(exam)
}

export const toggleExamStatus = async (req: Request, res: Response) => {
  if (!req.user) return

  const examId = req.params.id

  const exam = await Exam.findById(examId)

  if (!exam) {
    throw new AppError('Exam not found', 404)
  }

  if (
    req.user.role !== 'admin' &&
    exam.teacher.toString() !== req.user._id.toString()
  ) {
    throw new AppError('Not authorized to modify this exam', 403)
  }
  exam.isActive = !exam.isActive
  await exam.save()
  await logActivity({
    userId: req.user._id.toString(),
    details: 'User toggled exam status',
    action: 'Toggle Exam Status',
  })
  res.json({
    message: `Exam is now ${exam.isActive ? 'Active' : 'Inactive'}`,
    _id: exam._id,
    isActive: exam.isActive,
  })
}

export const submitExam = async (req: Request, res: Response) => {
  if (!req.user) return

  const { answers } = req.body

  const examId = req.params.id

  await inngest.send({
    name: 'exam/submit',
    data: {
      examId,
      studentId: req.user._id,
      answers,
    },
  })

  await logActivity({
    userId: req.user._id.toString(),
    details: 'User submitted an exam',
    action: 'Submit Exam',
  })

  res.status(201).json({
    message: 'Exam submission received and is being processed.',
  })
}

export const getExamResult = async (req: Request, res: Response) => {
  if (!req.user) return

  const examId = req.params.id

  const submission = await Submission.findOne({
    exam: examId,
    student: req.user._id,
  }).populate({
    path: 'exam',
    select: 'title questions._id questions.correctAnswer',
  })
  if (!submission) {
    throw new AppError('No submission found', 404)
  }

  res.json(submission)
}
