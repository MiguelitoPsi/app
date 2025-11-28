import { adminRouter } from './routers/admin'
import { aiRouter } from './routers/ai'
import { analyticsRouter } from './routers/analytics'
import { badgeRouter } from './routers/badge'
import { journalRouter } from './routers/journal'
import { meditationRouter } from './routers/meditation'
import { notificationRouter } from './routers/notification'
import { patientRouter } from './routers/patient'
import { rewardRouter } from './routers/reward'
import { taskRouter } from './routers/task'
import { therapistAchievementsRouter } from './routers/therapist-achievements'
import { therapistChallengesRouter } from './routers/therapist-challenges'
import { therapistFinancialRouter } from './routers/therapist-financial'
import { therapistProfileRouter } from './routers/therapist-profile'
import { therapistReportsRouter } from './routers/therapist-reports'
import { therapistTasksRouter } from './routers/therapist-tasks'
import { therapistXpRouter } from './routers/therapist-xp'
import { userRouter } from './routers/user'
import { router } from './trpc'

export const appRouter = router({
  admin: adminRouter,
  user: userRouter,
  task: taskRouter,
  journal: journalRouter,
  ai: aiRouter,
  reward: rewardRouter,
  meditation: meditationRouter,
  badge: badgeRouter,
  notification: notificationRouter,
  patient: patientRouter,
  analytics: analyticsRouter,
  // Therapist gamification routers
  therapistXp: therapistXpRouter,
  therapistAchievements: therapistAchievementsRouter,
  therapistChallenges: therapistChallengesRouter,
  therapistFinancial: therapistFinancialRouter,
  therapistProfile: therapistProfileRouter,
  therapistReports: therapistReportsRouter,
  therapistTasks: therapistTasksRouter,
})

export type AppRouter = typeof appRouter
