import { aiRouter } from './routers/ai'
import { journalRouter } from './routers/journal'
import { rewardRouter } from './routers/reward'
import { taskRouter } from './routers/task'
import { userRouter } from './routers/user'
import { router } from './trpc'

export const appRouter = router({
  user: userRouter,
  task: taskRouter,
  journal: journalRouter,
  ai: aiRouter,
  reward: rewardRouter,
})

export type AppRouter = typeof appRouter
