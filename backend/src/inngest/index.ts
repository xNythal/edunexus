import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'
import { Inngest, NonRetriableError } from 'inngest'
import Class from '../features/class/model'
import Exam from '../features/exam/model'
import Submission from '../features/exam/submission'
import { ISubject } from '../features/subject/model'
import Timetable from '../features/timetable/model'
import User from '../features/user/model'

export const inngest = new Inngest({ id: 'sms-lms' })

// TODO: THIS WILL BITE ME LATER
const generateTimeTable = inngest.createFunction(
  { id: 'generate-timetable' },
  { event: 'timetable/generate' },
  async ({ event, step }) => {
    const { classId, academicYearId, settings } = event.data

    const contextData = await step.run('fetch-class-context', async () => {
      const classData = await Class.findById(classId).populate<{
        subjects: ISubject[]
      }>('subjects')
      if (!classData) throw new NonRetriableError('Class not found')
      const allTeachers = await User.find({ role: 'teacher' })
      const classSubjectIds = classData.subjects.map((subject) =>
        subject._id.toString(),
      )
      const qualifiedTeachers = allTeachers
        .filter((teacher) => {
          if (!teacher.teacherSubject) return false
          return teacher.teacherSubject.some((subjectId) =>
            classSubjectIds.includes(subjectId.toString()),
          )
        })
        .map((teacher) => ({
          id: teacher._id,
          name: teacher.name,
          subjects: teacher.teacherSubject,
        }))

      const subjectsPayload = classData.subjects.map((subject) => ({
        id: subject._id,
        name: subject.name,
        code: subject.code,
      }))
      return {
        className: classData.name,
        subjects: subjectsPayload,
        teachers: qualifiedTeachers,
      }
    })

    const aiSchedule = await step.run('generate-timetable-logic', async () => {
      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY!
      const allTimetables = await Timetable.find({
        academicYear: academicYearId,
      })
      const prompt = `
        You are a school scheduler. Generate a weekly timetable (Monday to Friday).

        CONTEXT:
        - Class: ${contextData.className}
        - Hours: ${settings.startTime} to ${settings.endTime} (${
          settings.periods
        } periods/day).

        RESOURCES:
        - Subjects: ${JSON.stringify(contextData.subjects)}
        - Teachers: ${JSON.stringify(contextData.teachers)}
        - Other Timetables: ${JSON.stringify(allTimetables)}

        STRICT RULES:
        1. Assign a Teacher to every Subject period.
        2. Teacher MUST have the subject ID in their list.
        3. Break Time/Free Period after every 2 periods(10 minutes), Lunch Time after 5 periods(at 12:00)(30 minutes).
        4. Avoid clashes with other classes(teacher can't be in two classes at the same time).
        5. Output strict JSON only. Schema:
           {
             "schedule": [
               {
                 "day": "Monday",
                 "periods": [
                   { "subject": "SUBJECT_ID", "teacher": "TEACHER_ID", "startTime": "HH:MM", "endTime": "HH:MM" }
                 ]
               }
             ]
           }
        6. Use null values for subject and teacher if period is break or lunch
        7. Never invent ids like "T_12" or "MATH_01". Always use the actual ids provided above.
        8. If the resources themselves are malformed or empty. Reply with an error JSON ({"error":true,"message":"YOUR_MESSAGE"})
      `

      const google = createGoogleGenerativeAI({
        apiKey,
      })

      const activeModel = google('gemini-2.5-flash')

      const { text } = await generateText({
        prompt,
        model: activeModel,
      })
      const cleanJson = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim()
      return JSON.parse(cleanJson)
    })

    await step.run('save-timetable', async () => {
      await Timetable.findOneAndDelete({
        class: classId,
        academicYear: academicYearId,
      })

      await Timetable.create({
        class: classId,
        academicYear: academicYearId,
        schedule: aiSchedule.schedule,
      })

      return { success: true, classId }
    })

    return { message: 'Timetable generated successfully' }
  },
)

const generateExam = inngest.createFunction(
  { id: 'generate-exam' },
  { event: 'exam/generate' },
  async ({ event, step }) => {
    const { examId, topic, subjectName, difficulty, count } = event.data

    const aiExam = await step.run('generate-timetable-logic', async () => {
      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY!

      const prompt = `
        You are a strict teacher. Create a JSON array of ${count} multiple-choice questions for a high school exam.

        CONTEXT:
        - Subject: ${subjectName}
        - Topic: ${topic}
        - Difficulty: ${difficulty}

        STRICT JSON SCHEMA (Array of Objects):
        [
          {
            "questionText": "Question string",
            "type": "MCQ",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "The exact string of the correct option",
            "points": 1
          }
        ]

        RULES:
        1. Output ONLY raw JSON. No Markdown.
        2. Ensure correct answer matches one of the options exactly.
      `

      const google = createGoogleGenerativeAI({
        apiKey,
      })

      const activeModel = google('gemini-2.5-flash')

      const { text } = await generateText({
        prompt,
        model: activeModel,
      })
      const cleanJson = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim()
      return JSON.parse(cleanJson)
    })

    await step.run('save-exam', async () => {
      const exam = await Exam.findById(examId)

      if (!exam) {
        throw new NonRetriableError(`Exam ${examId} not found`)
      }

      exam.questions = aiExam
      exam.isActive = false

      await exam.save()

      return { success: true, count: aiExam.length }
    })

    return { message: 'Timetable generated successfully' }
  },
)

export const handleExamSubmission = inngest.createFunction(
  { id: 'handle-exam-submission' },
  { event: 'exam/submit' },
  async ({ event, step }) => {
    const { examId, studentId, answers } = event.data

    await step.run('process-exam-submission', async () => {
      const existingSubmission = await Submission.findOne({
        exam: examId,
        student: studentId,
      })
      if (existingSubmission) {
        throw new NonRetriableError('Exam already submitted')
      }
      const exam = await Exam.findById(examId).select(
        '+questions.correctAnswer',
      )
      if (!exam) {
        throw new NonRetriableError(`Exam ${examId} not found`)
      }

      let score = 0
      let totalPoints = 0

      exam.questions.forEach((question) => {
        totalPoints += question.points
        const studentAns = answers.find(
          (a: { questionId: string }) =>
            a.questionId === question._id.toString(),
        )
        if (studentAns && studentAns.answer === question.correctAnswer) {
          score += question.points
        }
      })
      await Submission.create({
        exam: examId,
        student: studentId,
        answers,
        score,
      })
    })
    return { message: 'Exam submitted successfully' }
  },
)

// Add the function to the exported array:
export const functions = [generateTimeTable, generateExam]
