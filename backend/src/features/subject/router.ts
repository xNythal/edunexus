import express from 'express'
import { authorize, protect } from '../../middlewares/auth'
import { UserRole } from '../user/model'
import {
  createSubject,
  deleteSubject,
  getAllSubjects,
  updateSubject,
} from './controller'

const router = express.Router()

router.post('/', protect, authorize(UserRole.ADMIN), createSubject)
router.get(
  '/',
  protect,
  authorize(UserRole.ADMIN, UserRole.TEACHER),
  getAllSubjects,
)
router.patch('/:id', protect, authorize(UserRole.ADMIN), updateSubject)
router.delete('/:id', protect, authorize(UserRole.ADMIN), deleteSubject)

export default router
