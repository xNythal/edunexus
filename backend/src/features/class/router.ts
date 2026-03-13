import express from 'express'
import { authorize, protect } from '../../middlewares/auth'
import { UserRole } from '../user/model'
import { createClass, updateClass } from './controller'

const classRouter = express.Router()

classRouter.post('/', protect, authorize(UserRole.ADMIN), createClass)
classRouter.patch('/:id', protect, authorize(UserRole.ADMIN), updateClass)

export default classRouter
