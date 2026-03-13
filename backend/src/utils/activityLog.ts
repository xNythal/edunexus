import ActivityLog from '../features/activity-log/model'

export default async function logActivity({
  userId,
  action,
  details,
}: {
  userId: string
  action: string
  details?: string
}) {
  try {
    await ActivityLog.create({
      user: userId,
      action,
      details,
    })
  } catch (error) {
    console.error('Failed to log activity:', error)
  }
}
