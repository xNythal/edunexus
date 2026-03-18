import mongoose, { Document, Schema } from 'mongoose'

export interface ISubject extends Document {
  name: string
  code: string
  teachers?: mongoose.Types.ObjectId[]
  isActive: boolean
}

const subjectSchema = new Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    teachers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export default mongoose.model<ISubject>('Subject', subjectSchema)
