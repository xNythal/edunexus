import express from 'express'
import { authorize, protect } from '../../middlewares/auth'
import { UserRole } from '../user/model'
import {
  createClass,
  deleteClass,
  getAllClasses,
  updateClass,
} from './controller'

const classRouter = express.Router()

classRouter.post('/', protect, authorize(UserRole.ADMIN), createClass)
classRouter.patch('/:id', protect, authorize(UserRole.ADMIN), updateClass)
classRouter.delete('/:id', protect, authorize(UserRole.ADMIN), deleteClass)
classRouter.get('/', protect, authorize(UserRole.ADMIN), getAllClasses)

export default classRouter
