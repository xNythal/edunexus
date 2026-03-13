import express from 'express'
import { authorize, protect } from '../../middlewares/auth'
import {
  deleteUser,
  getAllUsers,
  getUserProfile,
  loginUser,
  logoutUser,
  registerUser,
  updateUser,
} from './controller'
import { UserRole } from './model'

const userRoutes = express.Router()

userRoutes.post(
  '/',
  protect,
  authorize(UserRole.ADMIN, UserRole.TEACHER),
  registerUser,
)

userRoutes.patch(
  '/:id',
  protect,
  authorize(UserRole.ADMIN, UserRole.TEACHER),
  updateUser,
)

userRoutes.delete(
  '/:id',
  protect,
  authorize(UserRole.ADMIN, UserRole.TEACHER),
  deleteUser,
)

userRoutes.post('/logout', protect, logoutUser)
userRoutes.get('/profile', protect, getUserProfile)
userRoutes.get(
  '/',
  protect,
  authorize(UserRole.ADMIN, UserRole.TEACHER),
  getAllUsers,
)

userRoutes.post('/login', loginUser)

export default userRoutes
