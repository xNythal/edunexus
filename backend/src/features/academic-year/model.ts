import mongoose, { Document, Schema } from 'mongoose'

export interface IAcademicYear extends Document {
  name: string
  fromYear: Date
  toYear: Date
  isCurrent: boolean
}

const academicYearSchema = new Schema(
  {
    name: { type: String, required: true },
    fromYear: { type: Date, required: true },
    toYear: { type: Date, required: true },
    isCurrent: { type: Boolean, default: false },
  },
  { timestamps: true },
)

export default mongoose.model<IAcademicYear>('AcademicYear', academicYearSchema)
