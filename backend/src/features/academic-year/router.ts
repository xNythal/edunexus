import express from 'express'
import { authorize, protect } from '../../middlewares/auth'
import { UserRole } from '../user/model'
import {
  createAcademicYear,
  deleteAcademicYear,
  getAllAcademicYears,
  getCurrentAcademicYear,
  updateAcademicYear,
} from './controller'

const academicYearRoutes = express.Router()

academicYearRoutes.post(
  '/',
  protect,
  authorize(UserRole.ADMIN),
  createAcademicYear,
)
academicYearRoutes.patch(
  '/:id',
  protect,
  authorize(UserRole.ADMIN),
  updateAcademicYear,
)
academicYearRoutes.delete(
  '/:id',
  protect,
  authorize(UserRole.ADMIN),
  deleteAcademicYear,
)
academicYearRoutes.get(
  '/',
  protect,
  authorize(UserRole.ADMIN),
  getAllAcademicYears,
)
academicYearRoutes.get('/current', protect, getCurrentAcademicYear)

export default academicYearRoutes
