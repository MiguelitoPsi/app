import { type NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  asaasWebhookEvents,
  therapistSubscriptions,
  subscriptionPayments,
} from "@/lib/db/schema";
import type { AsaasWebhookPayload } from "@/lib/asaas/types";

/**
 * Asaas Webhook Handler
 *
 * Receives POST webhooks from Asaas for payment and subscription events.
 * Implements idempotency via asaas_webhook_events table.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook token if configured
    const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;
    if (webhookToken) {
      const authHeader = request.headers.get("asaas-access-token");
      if (authHeader !== webhookToken) {
        console.error("[Asaas Webhook] Invalid webhook token");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const payload = (await request.json()) as AsaasWebhookPayload;
    const eventId = payload.id;
    const eventType = payload.event;

    console.log("[Asaas Webhook] Received event:", eventType, "ID:", eventId);

    // Idempotency check — skip if already processed
    const existing = await db
      .select({ id: asaasWebhookEvents.id })
      .from(asaasWebhookEvents)
      .where(eq(asaasWebhookEvents.eventId, eventId))
      .limit(1);

    if (existing.length > 0) {
      console.log("[Asaas Webhook] Event already processed:", eventId);
      return NextResponse.json({ received: true, duplicate: true });
    }

    // Log event (will mark processedAt after processing)
    const [webhookEvent] = await db
      .insert(asaasWebhookEvents)
      .values({
        eventId,
        eventType,
        payload: payload as unknown as Record<string, unknown>,
      })
      .returning({ id: asaasWebhookEvents.id });

    try {
      // Route to appropriate handler
      if (eventType.startsWith("PAYMENT_")) {
        await handlePaymentEvent(payload);
      } else if (eventType.startsWith("SUBSCRIPTION_")) {
        await handleSubscriptionEvent(payload);
      }

      // Mark as processed
      await db
        .update(asaasWebhookEvents)
        .set({ processedAt: new Date() })
        .where(eq(asaasWebhookEvents.id, webhookEvent.id));
    } catch (error) {
      // Log error but still return 200 to avoid retry storm
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("[Asaas Webhook] Processing error:", errorMessage);

      await db
        .update(asaasWebhookEvents)
        .set({ processedAt: new Date(), error: errorMessage })
        .where(eq(asaasWebhookEvents.id, webhookEvent.id));
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Asaas Webhook] Fatal error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// ============================================
// Payment Event Handler
// ============================================

async function handlePaymentEvent(payload: AsaasWebhookPayload) {
  const payment = payload.payment;
  if (!payment) {
    console.warn("[Asaas Webhook] Payment event without payment data");
    return;
  }

  const asaasPaymentId = payment.id;
  const asaasSubscriptionId = payment.subscription;

  // Only process payments that belong to a subscription
  if (!asaasSubscriptionId) {
    console.log(
      "[Asaas Webhook] Payment is not subscription-related, skipping",
    );
    return;
  }

  // Find the subscription in our DB
  const [sub] = await db
    .select({ id: therapistSubscriptions.id })
    .from(therapistSubscriptions)
    .where(eq(therapistSubscriptions.asaasSubscriptionId, asaasSubscriptionId))
    .limit(1);

  if (!sub) {
    console.warn(
      "[Asaas Webhook] No matching subscription for:",
      asaasSubscriptionId,
    );
    return;
  }

  // Map Asaas payment status to our status
  const statusMap: Record<
    string,
    "pending" | "confirmed" | "received" | "overdue" | "refunded" | "deleted"
  > = {
    PENDING: "pending",
    CONFIRMED: "confirmed",
    RECEIVED: "received",
    RECEIVED_IN_CASH: "received",
    OVERDUE: "overdue",
    REFUNDED: "refunded",
    REFUND_REQUESTED: "refunded",
    REFUND_IN_PROGRESS: "refunded",
    PARTIALLY_REFUNDED: "refunded",
  };

  const paymentStatus = statusMap[payment.status] ?? "pending";
  const billingTypeMap: Record<string, "CREDIT_CARD" | "PIX"> = {
    CREDIT_CARD: "CREDIT_CARD",
    PIX: "PIX",
  };
  const billingType = billingTypeMap[payment.billingType] ?? null;

  // Upsert the payment record
  const existingPayment = await db
    .select({ id: subscriptionPayments.id })
    .from(subscriptionPayments)
    .where(eq(subscriptionPayments.asaasPaymentId, asaasPaymentId))
    .limit(1);

  if (existingPayment.length > 0) {
    // Update existing payment
    await db
      .update(subscriptionPayments)
      .set({
        status: paymentStatus,
        paymentDate: payment.paymentDate ? new Date(payment.paymentDate) : null,
        invoiceUrl: payment.invoiceUrl,
        updatedAt: new Date(),
      })
      .where(eq(subscriptionPayments.asaasPaymentId, asaasPaymentId));
  } else {
    // Insert new payment
    await db.insert(subscriptionPayments).values({
      subscriptionId: sub.id,
      asaasPaymentId,
      amount: String(payment.value),
      status: paymentStatus,
      billingType,
      dueDate: payment.dueDate ? new Date(payment.dueDate) : null,
      paymentDate: payment.paymentDate ? new Date(payment.paymentDate) : null,
      invoiceUrl: payment.invoiceUrl,
    });
  }

  // Update subscription status based on payment event
  const event = payload.event;

  if (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") {
    // Payment successful — activate subscription
    const nextPeriodEnd = new Date(payment.dueDate);
    // Determine cycle from subscription to calculate period end
    const [currentSub] = await db
      .select({ cycle: therapistSubscriptions.cycle })
      .from(therapistSubscriptions)
      .where(eq(therapistSubscriptions.id, sub.id))
      .limit(1);

    if (currentSub) {
      if (currentSub.cycle === "MONTHLY") {
        nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);
      } else {
        nextPeriodEnd.setFullYear(nextPeriodEnd.getFullYear() + 1);
      }
    }

    await db
      .update(therapistSubscriptions)
      .set({
        status: "active",
        currentPeriodStart: new Date(payment.dueDate),
        currentPeriodEnd: nextPeriodEnd,
        updatedAt: new Date(),
      })
      .where(eq(therapistSubscriptions.id, sub.id));
  } else if (event === "PAYMENT_OVERDUE") {
    // Payment overdue — mark subscription as past_due
    await db
      .update(therapistSubscriptions)
      .set({
        status: "past_due",
        updatedAt: new Date(),
      })
      .where(eq(therapistSubscriptions.id, sub.id));
  } else if (event === "PAYMENT_REFUNDED") {
    // Refund — could indicate subscription cancellation
    await db
      .update(therapistSubscriptions)
      .set({
        status: "cancelled",
        cancelledAt: new Date(),
        cancelReason: "payment_refunded",
        updatedAt: new Date(),
      })
      .where(eq(therapistSubscriptions.id, sub.id));
  } else if (event === "PAYMENT_DELETED") {
    // Payment deleted (only update payment record, already handled above)
    if (existingPayment.length > 0) {
      await db
        .update(subscriptionPayments)
        .set({ status: "deleted", updatedAt: new Date() })
        .where(eq(subscriptionPayments.asaasPaymentId, asaasPaymentId));
    }
  }
}

// ============================================
// Subscription Event Handler
// ============================================

async function handleSubscriptionEvent(payload: AsaasWebhookPayload) {
  const subscription = payload.subscription;
  if (!subscription) {
    console.warn(
      "[Asaas Webhook] Subscription event without subscription data",
    );
    return;
  }

  const asaasSubscriptionId = subscription.id;

  // Find matching subscription in our DB
  const [sub] = await db
    .select({ id: therapistSubscriptions.id })
    .from(therapistSubscriptions)
    .where(eq(therapistSubscriptions.asaasSubscriptionId, asaasSubscriptionId))
    .limit(1);

  if (!sub) {
    console.warn(
      "[Asaas Webhook] No matching subscription for:",
      asaasSubscriptionId,
    );
    return;
  }

  const event = payload.event;

  if (event === "SUBSCRIPTION_INACTIVATED") {
    await db
      .update(therapistSubscriptions)
      .set({
        status: "expired",
        updatedAt: new Date(),
      })
      .where(eq(therapistSubscriptions.id, sub.id));
  } else if (event === "SUBSCRIPTION_DELETED") {
    await db
      .update(therapistSubscriptions)
      .set({
        status: "cancelled",
        cancelledAt: new Date(),
        cancelReason: "subscription_deleted_asaas",
        updatedAt: new Date(),
      })
      .where(eq(therapistSubscriptions.id, sub.id));
  }
}
