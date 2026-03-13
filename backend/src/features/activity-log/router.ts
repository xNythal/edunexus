import express from 'express'
import { authorize, protect } from '../../middlewares/auth'
import { UserRole } from '../user/model'
import { getAllActivityLogs } from './controller'

const logsRoutes = express.Router()

logsRoutes.get(
  '/',
  protect,
  authorize(UserRole.ADMIN, UserRole.TEACHER),
  getAllActivityLogs,
)

export default logsRoutes
