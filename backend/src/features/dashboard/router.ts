import express from 'express'
import { protect } from '../../middlewares/auth'
import { getDashboardStats } from './controller'

const router = express.Router()

router.get('/', protect, getDashboardStats)

// Get AI Insight
// router.post("/insight", protect, generateDashboardInsight);

export default router
