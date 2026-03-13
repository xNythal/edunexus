import mongoose from 'mongoose'

export async function connectDb() {
  try {
    const MONGO_URL = process.env.MONGO_URL
    if (!MONGO_URL) {
      throw new Error('MONGO_URL is not defined')
    }
    const conn = await mongoose.connect(MONGO_URL)
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Error: ${error.message}`)
    } else {
      console.error(`❌ Error: ${error}`)
    }
    process.exit(1)
  }
}
