import express from 'express'
import { authorize, protect } from '../../middlewares/auth'
import { UserRole } from '../user/model'
import {
  getExamById,
  getExamResult,
  getExams,
  submitExam,
  toggleExamStatus,
  triggerExamGeneration,
} from './controller'

const router = express.Router()

router.post(
  '/',
  protect,
  authorize(UserRole.TEACHER, UserRole.ADMIN),
  triggerExamGeneration,
)

router.get(
  '/',
  protect,
  authorize(UserRole.STUDENT, UserRole.ADMIN, UserRole.TEACHER),
  getExams,
)
router.post(
  '/:id/submit',
  protect,
  authorize(UserRole.STUDENT, UserRole.ADMIN),
  submitExam,
)

router.patch(
  '/:id/status',
  protect,
  authorize(UserRole.TEACHER, UserRole.ADMIN),
  toggleExamStatus,
)

router.get(
  '/:id/result',
  protect,
  getExamResult,
  authorize(UserRole.STUDENT, UserRole.ADMIN, UserRole.TEACHER),
)

router.get(
  '/:id',
  protect,
  getExamById,
  authorize(UserRole.STUDENT, UserRole.ADMIN, UserRole.TEACHER),
)

export default router
