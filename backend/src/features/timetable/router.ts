import express from 'express'
import { authorize, protect } from '../../middlewares/auth'
import { UserRole } from '../user/model'
import { generateTimetable, getTimetable } from './controller'

const router = express.Router()

router.post('/', protect, authorize(UserRole.ADMIN), generateTimetable)

router.get('/:classId', protect, getTimetable)

export default router
