import { aiRouter } from "./routers/ai";
import { analyticsRouter } from "./routers/analytics";
import { badgeRouter } from "./routers/badge";
import { journalRouter } from "./routers/journal";
import { meditationRouter } from "./routers/meditation";
import { notificationRouter } from "./routers/notification";
import { patientRouter } from "./routers/patient";
import { rewardRouter } from "./routers/reward";
import { taskRouter } from "./routers/task";
import { userRouter } from "./routers/user";
import { router } from "./trpc";

export const appRouter = router({
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
});

export type AppRouter = typeof appRouter;
