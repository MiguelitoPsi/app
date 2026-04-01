import type { PlanFeatures } from '@shared/db/schema'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { psychologistPatients, subscriptionPlans, therapistSubscriptions } from '@/lib/db/schema'

// ============================================
// Subscription Guard — Server-Side Functions
// ============================================

export interface ActiveSubscriptionInfo {
  subscriptionId: string
  planId: string
  planName: string
  planSlug: string
  status: 'active' | 'past_due' | 'cancelled' | 'expired' | 'pending'
  cycle: 'MONTHLY' | 'YEARLY'
  billingType: 'CREDIT_CARD' | 'PIX'
  amount: string
  currentPeriodEnd: Date | null
  features: PlanFeatures
  maxPatients: number | null
}

/**
 * Get the active subscription for a therapist.
 * Returns null if no subscription or all subscriptions are cancelled/expired.
 */
export async function getActiveSubscription(
  therapistId: string
): Promise<ActiveSubscriptionInfo | null> {
  const results = await db
    .select({
      subscriptionId: therapistSubscriptions.id,
      planId: subscriptionPlans.id,
      planName: subscriptionPlans.name,
      planSlug: subscriptionPlans.slug,
      status: therapistSubscriptions.status,
      cycle: therapistSubscriptions.cycle,
      billingType: therapistSubscriptions.billingType,
      amount: therapistSubscriptions.amount,
      currentPeriodEnd: therapistSubscriptions.currentPeriodEnd,
      features: subscriptionPlans.features,
      maxPatients: subscriptionPlans.maxPatients,
    })
    .from(therapistSubscriptions)
    .innerJoin(subscriptionPlans, eq(therapistSubscriptions.planId, subscriptionPlans.id))
    .where(eq(therapistSubscriptions.therapistId, therapistId))
    .orderBy(therapistSubscriptions.createdAt)
    .limit(1)

  const sub = results[0]
  if (!sub) return null

  return sub as ActiveSubscriptionInfo
}

/**
 * Check if a specific boolean feature is enabled for a therapist's plan.
 */
export async function checkFeature(
  therapistId: string,
  featureKey: string
): Promise<boolean | number> {
  const subscription = await getActiveSubscription(therapistId)

  // No subscription = no features
  if (!subscription) return false

  // Expired / cancelled = no features
  if (subscription.status === 'expired' || subscription.status === 'cancelled') {
    return false
  }

  const features = subscription.features
  if (!features) return false

  const value = features[featureKey]
  if (value === undefined) return false

  return value
}

/**
 * Check if the therapist has reached the patient limit for their plan.
 * Returns { allowed: boolean, current: number, max: number | null }
 */
export async function checkPatientLimit(
  therapistId: string
): Promise<{ allowed: boolean; current: number; max: number | null }> {
  const subscription = await getActiveSubscription(therapistId)

  if (!subscription || subscription.status === 'expired' || subscription.status === 'cancelled') {
    return { allowed: false, current: 0, max: 0 }
  }

  // Get max patients from plan features or plan-level setting
  const maxFromFeatures = subscription.features?.max_patients
  const maxFromPlan = subscription.maxPatients
  const max = typeof maxFromFeatures === 'number' ? maxFromFeatures : maxFromPlan

  // 0 or null = unlimited
  if (!max || max === 0) {
    return { allowed: true, current: 0, max: null }
  }

  // Count current patients
  const patients = await db
    .select({ id: psychologistPatients.id })
    .from(psychologistPatients)
    .where(eq(psychologistPatients.psychologistId, therapistId))

  const current = patients.length
  return { allowed: current < max, current, max }
}

/**
 * Check if the therapist has an active (or past_due) subscription.
 */
export async function isSubscriptionActive(therapistId: string): Promise<boolean> {
  const subscription = await getActiveSubscription(therapistId)
  if (!subscription) return false
  return subscription.status === 'active' || subscription.status === 'past_due'
}

export type SubscriptionStatusInfo =
  | { status: 'active'; subscription: ActiveSubscriptionInfo }
  | {
      status: 'past_due'
      subscription: ActiveSubscriptionInfo
      daysRemaining: number
    }
  | { status: 'expired'; subscription: ActiveSubscriptionInfo }
  | { status: 'cancelled'; subscription: ActiveSubscriptionInfo }
  | { status: 'pending'; subscription: ActiveSubscriptionInfo }
  | { status: 'none' }

/**
 * Get detailed subscription status for a therapist.
 */
export async function getSubscriptionStatus(therapistId: string): Promise<SubscriptionStatusInfo> {
  const subscription = await getActiveSubscription(therapistId)

  if (!subscription) {
    return { status: 'none' }
  }

  if (subscription.status === 'past_due') {
    const now = new Date()
    const end = subscription.currentPeriodEnd
    const daysRemaining = end
      ? Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0
    return { status: 'past_due', subscription, daysRemaining }
  }

  return {
    status: subscription.status,
    subscription,
  } as SubscriptionStatusInfo
}
