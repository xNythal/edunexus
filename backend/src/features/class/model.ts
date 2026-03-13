import mongoose, { Document, Schema } from 'mongoose'

export interface IClass extends Document {
  name: string
  academicYear: mongoose.Types.ObjectId
  classTeacher: mongoose.Types.ObjectId
  subjects: mongoose.Types.ObjectId[]
  students: mongoose.Types.ObjectId[]
  capacity: number
}

const classSchema = new Schema<IClass>(
  {
    name: {
      type: String,
      required: [true, 'Class name is required'],
      trim: true,
    },
    academicYear: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: true,
    },
    classTeacher: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    subjects: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Subject',
      },
    ],

    students: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    capacity: {
      type: Number,
      default: 40,
    },
  },
  {
    timestamps: true,
  },
)

classSchema.index({ name: 1, academicYear: 1 }, { unique: true })

export default mongoose.model<IClass>('Class', classSchema)
