import bcrypt from 'bcryptjs'
import mongoose, { Document, Schema } from 'mongoose'

export enum UserRole {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student',
  PARENT = 'parent',
}

export interface IUser extends Document {
  name: string
  email: string
  password: string
  role: UserRole
  isActive: boolean
  studentClass?: string | null
  teacherSubject?: string[] | null
  matchPassword: (input: string) => Promise<boolean>
}

const userSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
      default: UserRole.STUDENT,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    studentClass: {
      type: String,
      default: null,
    },
    teacherSubject: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Subject',
    },
  },
  { timestamps: true },
)

userSchema.pre<IUser>('save', async function () {
  if (!this.isModified('password')) return
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

userSchema.methods.matchPassword = async function (input: string) {
  return await bcrypt.compare(input, this.password)
}

export default mongoose.model<IUser>('User', userSchema)
