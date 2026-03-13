import mongoose, { Document } from 'mongoose'

export interface IActivityLog extends Document {
  user: mongoose.Types.ObjectId
  action: string
  details?: string
  createdAt: Date
}

const activityLogSchema = new mongoose.Schema<IActivityLog>(
  {
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    details: {
      type: String,
    },
  },
  { timestamps: true },
)

export default mongoose.model<IActivityLog>('ActivityLog', activityLogSchema)
