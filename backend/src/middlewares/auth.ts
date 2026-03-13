import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import User, { UserRole } from '../features/user/model'

export async function protect(req: Request, res: Response, next: NextFunction) {
  let token

  if (req.cookies.token) {
    token = req.cookies.token
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' })
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string
    }
    req.user = await User.findById(decoded.id).select('-password')
    next()
  } catch (error) {
    res.status(500).json({ message: 'An error occured' })
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, user not found' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'You do not have permission to access this route',
      })
    }

    // user has permission to proceed
    next()
  }
}
