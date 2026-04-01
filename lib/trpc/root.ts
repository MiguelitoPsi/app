import { adminRouter } from './routers/admin'
import { aiRouter } from './routers/ai'
import { analyticsRouter } from './routers/analytics'
import { badgeRouter } from './routers/badge'
import { journalRouter } from './routers/journal'
import { meditationRouter } from './routers/meditation'
import { notificationRouter } from './routers/notification'
import { patientRouter } from './routers/patient'
import { pushRouter } from './routers/push'
import { rewardRouter } from './routers/reward'
import { subscriptionPlansRouter } from './routers/subscription-plans'
import { taskRouter } from './routers/task'
import { therapistAchievementsRouter } from './routers/therapist-achievements'
import { therapistChallengesRouter } from './routers/therapist-challenges'
import { therapistFinancialRouter } from './routers/therapist-financial'
import { therapistProfileRouter } from './routers/therapist-profile'
import { therapistReportsRouter } from './routers/therapist-reports'
import { therapistSubscriptionRouter } from './routers/therapist-subscription'
import { therapistTasksRouter } from './routers/therapist-tasks'
import { therapistXpRouter } from './routers/therapist-xp'
import { transcriptionRouter } from './routers/transcription'
import { uploadJobRouter } from './routers/upload-job'
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
  push: pushRouter,
  transcription: transcriptionRouter,
  uploadJob: uploadJobRouter,
  // Therapist gamification routers
  therapistXp: therapistXpRouter,
  therapistAchievements: therapistAchievementsRouter,
  therapistChallenges: therapistChallengesRouter,
  therapistFinancial: therapistFinancialRouter,
  therapistProfile: therapistProfileRouter,
  therapistReports: therapistReportsRouter,
  therapistTasks: therapistTasksRouter,
  // Subscription system
  subscriptionPlans: subscriptionPlansRouter,
  therapistSubscription: therapistSubscriptionRouter,
})

export type AppRouter = typeof appRouter
