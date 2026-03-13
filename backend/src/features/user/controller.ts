import { Request, Response } from 'express'
import AppError from '../../errors/AppError'
import logActivity from '../../utils/activityLog'
import generateToken from '../../utils/generateToken'
import User from './model'

// @desc   Register a new user
// @route  POST /api/users
// @access Admin & Teacher Only
export async function registerUser(req: Request, res: Response) {
  try {
    const { email, name, password, role, studentClass, teacherSubject } =
      req.body

    const existingUser = await User.findOne({ email })
    if (existingUser) throw new AppError('Email already exists', 409)

    const newUser = await User.create({
      name,
      email,
      password,
      role,
      studentClass,
      teacherSubject,
    })

    if (!newUser) {
      throw new AppError('Invalid user data', 400)
    }

    if (req.user) {
      await logActivity({
        userId: req.user._id.toString(),
        action: 'Register User',
        details: `Registered user with email: ${email}`,
      })
    }

    res.status(201).json({
      message: 'User was created successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isActive: newUser.isActive,
        studentClass: newUser.studentClass,
        teacherSubject: newUser.teacherSubject,
      },
    })
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message })
    }
    console.log(error)
    res.status(500).json({
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    })
  }
}

// @desc Authenticate a user and get a token
// @route POST /api/users/login
// @access Public
export async function loginUser(req: Request, res: Response) {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user || !user?.matchPassword(password)) {
      throw new AppError('Invalid email or password', 401)
    }
    res.cookie('token', generateToken(user._id.toString()), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/',
    })
    logActivity({
      userId: user._id.toString(),
      action: 'Login User',
      details: `User logged in with email: ${email}`,
    })
    res.json({
      message: 'Logged in successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        studentClass: user.studentClass,
        teacherSubject: user.teacherSubject,
      },
    })
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message })
    }
    console.log(error)
    res.status(500).json({
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    })
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const user = await User.findById(req.params.id)
    if (!user) throw new AppError('User not found', 404)

    user.name = req.body.name || user.name
    user.email = req.body.email || user.email
    user.role = req.body.role || user.role
    user.isActive =
      req.body.isActive !== undefined ? req.body.isActive : user.isActive
    user.studentClass = req.body.studentClass || user.studentClass
    user.teacherSubject = req.body.teacherSubject || user.teacherSubject
    if (req.body.password) {
      user.password = req.body.password
    }

    const updatedUser = await user.save()

    if (req.user) {
      // here we passing userId as objectId instead of string
      // we also have other problem
      await logActivity({
        userId: req.user._id.toString(),
        action: 'Update User',
        details: `Updated user with email: ${updatedUser.email}`,
      })
    }

    res.json({
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        studentClass: updatedUser.studentClass,
        teacherSubject: updatedUser.teacherSubject,
      },
      message: 'User updated successfully',
    })
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message })
    }
    console.log(error)
    res.status(500).json({
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    })
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const user = await User.findById(req.params.id)
    if (!user) throw new AppError('User not found', 404)

    await user.deleteOne()

    if (req.user) {
      await logActivity({
        userId: req.user._id.toString(),
        action: 'Delete User',
        details: `Deleted user with email: ${user.email}`,
      })
    }

    res.json({ message: 'User deleted successfully' })
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message })
    }
    console.log(error)
    res.status(500).json({
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    })
  }
}

export async function getUserProfile(req: Request, res: Response) {
  try {
    if (!req.user) throw new AppError('User not authorized', 401)
    res.json({
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
    })
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message })
    }
    console.log(error)
    res.status(500).json({
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    })
  }
}

export function logoutUser(req: Request, res: Response) {
  try {
    res.cookie('token', '', {
      httpOnly: true,
      expires: new Date(0), //expire the cookie immediately
    })
    res.json({ message: 'Logged out successfully' })
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message })
    }
    console.log(error)
    res.status(500).json({
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    })
  }
}

export async function getAllUsers(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const role = req.query.role as string
    const search = req.query.search as string

    const skip = (page - 1) * limit

    const filter: any = {}

    if (role && role !== 'all' && role !== '') {
      filter.role = role
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ]
    }

    const [total, users] = await Promise.all([
      User.countDocuments(filter), // Get total count for pagination logic
      User.find(filter)
        .select('-password')
        // .populate("studentClass", "_id name section") // Added section for context
        // .populate("teacherSubjects", "_id name code")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ])

    res.json({
      users,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    })
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message })
    }
    console.log(error)
    res.status(500).json({
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    })
  }
}
