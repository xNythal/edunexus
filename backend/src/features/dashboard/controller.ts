import { Request, Response } from 'express'
import ActivityLog from '../activity-log/model'
import Class from '../class/model'
import Exam from '../exam/model'
import Submission from '../exam/submission'
import User, { IUser } from '../user/model'

const getTodayName = () =>
  new Date().toLocaleDateString('en-US', { weekday: 'long' })

export async function getDashboardStats(req: Request, res: Response) {
  if (!req.user) return

  let stats = {}

  const activityLogsQuery =
    req.user.role === 'admin' ? {} : { user: req.user._id }
  const recentActivities = await ActivityLog.find(activityLogsQuery)
    .sort({ createdAt: -1 })
    .limit(5)
    .populate<{ user: IUser }>('user', 'name')

  const formattedActivityLogs = recentActivities.map(
    (log) =>
      `${log.user.name}: ${log.action} (${log.createdAt.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })})`,
  )

  if (req.user.role === 'admin') {
    const totalStudents = await User.countDocuments({ role: 'student' })
    const totalTeachers = await User.countDocuments({ role: 'teacher' })
    const activeExams = await Exam.countDocuments({ isActive: true })

    const avgAttendance = '94.5%'

    stats = {
      totalStudents,
      totalTeachers,
      activeExams,
      avgAttendance,
      recentActivityLogs: formattedActivityLogs,
    }
  } else if (req.user.role === 'teacher') {
    const myClassesCount = await Class.countDocuments({
      classTeacher: req.user._id,
    })
    const myExams = await Exam.find({ teacher: req.user._id }).select('_id')
    const myExamIds = myExams.map((exam) => exam._id)
    const pendingGrading = await Submission.countDocuments({
      exam: { $in: myExamIds },
      score: 0,
    })
    const today = getTodayName()
    const nextClass = 'Mathematics - Grade 10'
    const nextClassTime = '10:00 AM'
    stats = {
      myClassesCount,
      pendingGrading,
      nextClass,
      nextClassTime,
      recentActivityLogs: formattedActivityLogs,
    }
  } else if (req.user.role === 'student') {
    const nextExam = await Exam.findOne({
      class: req.user.studentClass,
      dueDate: { $gte: new Date() },
    }).sort({ dueDate: 1 })

    const pendingAssignments = await Exam.countDocuments({
      class: req.user.studentClass,
      isActive: true,
      dueDate: { $gte: new Date() },
    })

    const myAttendance = '98%'

    stats = {
      myAttendance,
      pendingAssignments,
      nextExam: nextExam?.title || 'No upcoming exams',
      nextExamDate: nextExam
        ? new Date(nextExam.dueDate).toLocaleDateString()
        : '',
      recentActivityLogs: formattedActivityLogs,
    }
  }
  res.json(stats)
}
