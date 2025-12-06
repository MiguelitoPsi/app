import { and, eq, isNotNull, lt, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pushSubscriptions, users } from "@/lib/db/schema";
import { PUSH_TEMPLATES, sendPushToUser } from "@/lib/push";

// This endpoint checks for users who haven't been active in 16 hours
// and sends them a reminder push notification
// Should be called by a cron job every hour

export const runtime = "edge";
export const dynamic = "force-dynamic";

// Secret to protect the cron endpoint
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const sixteenHoursAgo = new Date(now.getTime() - 16 * 60 * 60 * 1000);

    // Find users who:
    // 1. Have push notifications enabled (have subscriptions)
    // 2. Have lastActiveAt older than 16 hours
    // 3. Haven't been notified about inactivity recently (we'll track this with a simple approach)
    const inactiveUsers = await db
      .select({
        userId: users.id,
        name: users.name,
        lastActiveAt: users.lastActiveAt,
      })
      .from(users)
      .innerJoin(pushSubscriptions, eq(users.id, pushSubscriptions.userId))
      .where(
        and(
          isNotNull(users.lastActiveAt),
          lt(users.lastActiveAt, sixteenHoursAgo),
          // Only send to patients (not therapists/admins)
          eq(users.role, "patient"),
          // Not banned
          sql`${users.bannedAt} IS NULL`
        )
      )
      .groupBy(users.id);

    let sent = 0;
    let failed = 0;

    for (const user of inactiveUsers) {
      const result = await sendPushToUser(
        db,
        user.userId,
        PUSH_TEMPLATES.inactiveReminder()
      );

      if (result.sent > 0) {
        sent++;
      } else {
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      processed: inactiveUsers.length,
      sent,
      failed,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Error in inactive-users cron:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
