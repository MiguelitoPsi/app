// ============================================
// Asaas API Type Definitions
// ============================================

export type AsaasBillingType = "UNDEFINED" | "BOLETO" | "CREDIT_CARD" | "PIX";
export type AsaasCycle =
  | "WEEKLY"
  | "BIWEEKLY"
  | "MONTHLY"
  | "BIMONTHLY"
  | "QUARTERLY"
  | "SEMIANNUALLY"
  | "YEARLY";
export type AsaasSubscriptionStatus = "ACTIVE" | "INACTIVE" | "EXPIRED";

export type AsaasPaymentStatus =
  | "PENDING"
  | "RECEIVED"
  | "CONFIRMED"
  | "OVERDUE"
  | "REFUNDED"
  | "RECEIVED_IN_CASH"
  | "REFUND_REQUESTED"
  | "REFUND_IN_PROGRESS"
  | "CHARGEBACK_REQUESTED"
  | "CHARGEBACK_DISPUTE"
  | "AWAITING_CHARGEBACK_REVERSAL"
  | "DUNNING_REQUESTED"
  | "DUNNING_RECEIVED"
  | "AWAITING_RISK_ANALYSIS";

// ============================================
// Customer
// ============================================

export interface AsaasCustomerRequest {
  name: string;
  cpfCnpj: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  externalReference?: string;
  notificationDisabled?: boolean;
}

export interface AsaasCustomerResponse {
  id: string;
  name: string;
  cpfCnpj: string;
  email: string | null;
  phone: string | null;
  mobilePhone: string | null;
  externalReference: string | null;
  notificationDisabled: boolean;
  dateCreated: string;
  deleted: boolean;
  object: "customer";
}

// ============================================
// Subscription
// ============================================

export interface AsaasCreateSubscriptionRequest {
  customer: string;
  billingType: AsaasBillingType;
  value: number;
  nextDueDate: string; // YYYY-MM-DD
  cycle: AsaasCycle;
  description?: string;
  endDate?: string;
  maxPayments?: number;
  externalReference?: string;
  discount?: {
    value: number;
    dueDateLimitDays?: number;
    type: "FIXED" | "PERCENTAGE";
  };
  callback?: {
    successUrl: string;
    autoRedirect: boolean;
  };
}

export interface AsaasSubscriptionResponse {
  id: string;
  customer: string;
  value: number;
  nextDueDate: string;
  cycle: AsaasCycle;
  billingType: AsaasBillingType;
  description: string | null;
  status: AsaasSubscriptionStatus;
  deleted: boolean;
  dateCreated: string;
  externalReference: string | null;
  object: "subscription";
}

// ============================================
// Payment
// ============================================

export interface AsaasPaymentResponse {
  id: string;
  customer: string;
  subscription?: string;
  value: number;
  netValue: number;
  status: AsaasPaymentStatus;
  billingType: AsaasBillingType;
  dueDate: string;
  paymentDate: string | null;
  clientPaymentDate: string | null;
  invoiceUrl: string;
  invoiceNumber: string | null;
  externalReference: string | null;
  deleted: boolean;
  description: string | null;
  object: "payment";
}

export interface AsaasPixQrCodeResponse {
  encodedImage: string;
  payload: string;
  expirationDate: string;
  success: boolean;
}

// ============================================
// Webhook
// ============================================

export type AsaasPaymentEvent =
  | "PAYMENT_CREATED"
  | "PAYMENT_AWAITING_RISK_ANALYSIS"
  | "PAYMENT_APPROVED_BY_RISK_ANALYSIS"
  | "PAYMENT_REPROVED_BY_RISK_ANALYSIS"
  | "PAYMENT_AUTHORIZED"
  | "PAYMENT_UPDATED"
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_RECEIVED"
  | "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED"
  | "PAYMENT_ANTICIPATED"
  | "PAYMENT_OVERDUE"
  | "PAYMENT_DELETED"
  | "PAYMENT_RESTORED"
  | "PAYMENT_REFUNDED"
  | "PAYMENT_PARTIALLY_REFUNDED"
  | "PAYMENT_REFUND_IN_PROGRESS"
  | "PAYMENT_REFUND_DENIED"
  | "PAYMENT_CHARGEBACK_REQUESTED"
  | "PAYMENT_CHARGEBACK_DISPUTE"
  | "PAYMENT_AWAITING_CHARGEBACK_REVERSAL";

export type AsaasSubscriptionEvent =
  | "SUBSCRIPTION_CREATED"
  | "SUBSCRIPTION_UPDATED"
  | "SUBSCRIPTION_INACTIVATED"
  | "SUBSCRIPTION_DELETED";

export type AsaasWebhookEventType = AsaasPaymentEvent | AsaasSubscriptionEvent;

export interface AsaasWebhookPayload {
  id: string;
  event: AsaasWebhookEventType;
  dateCreated: string;
  payment?: AsaasPaymentResponse;
  subscription?: AsaasSubscriptionResponse;
}

// ============================================
// List response
// ============================================

export interface AsaasListResponse<T> {
  object: "list";
  hasMore: boolean;
  totalCount: number;
  limit: number;
  offset: number;
  data: T[];
}

// ============================================
// Error
// ============================================

export interface AsaasErrorResponse {
  errors: Array<{
    code: string;
    description: string;
  }>;
}
