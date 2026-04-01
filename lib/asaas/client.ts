import type {
  AsaasCustomerRequest,
  AsaasCustomerResponse,
  AsaasErrorResponse,
  AsaasListResponse,
} from './types'

// ============================================
// Asaas API Client
// ============================================

function getBaseUrl(): string {
  const env = process.env.ASAAS_ENVIRONMENT ?? 'sandbox'
  return env === 'production' ? 'https://api.asaas.com/v3' : 'https://api-sandbox.asaas.com/v3'
}

function getApiKey(): string {
  const key = process.env.ASAAS_API_KEY
  if (!key) {
    throw new Error('ASAAS_API_KEY environment variable is not set')
  }
  return key
}

async function asaasFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getBaseUrl()
  const apiKey = getApiKey()

  const url = `${baseUrl}${path}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    accept: 'application/json',
    access_token: apiKey,
    ...(options.headers as Record<string, string>),
  }

  const maxRetries = 3
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (response.status === 429 || response.status >= 500) {
        const delay = 2 ** attempt * 1000
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as AsaasErrorResponse | null
        const errorMessage =
          errorBody?.errors?.[0]?.description ?? `Asaas API error: ${response.status}`
        throw new Error(errorMessage)
      }

      return (await response.json()) as T
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      if (attempt < maxRetries - 1) {
        const delay = 2 ** attempt * 1000
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError ?? new Error('Asaas API request failed')
}

// ============================================
// Customers
// ============================================

export async function createCustomer(data: AsaasCustomerRequest): Promise<AsaasCustomerResponse> {
  return asaasFetch<AsaasCustomerResponse>('/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getCustomer(id: string): Promise<AsaasCustomerResponse> {
  return asaasFetch<AsaasCustomerResponse>(`/customers/${id}`)
}

export async function findCustomerByExternalRef(
  externalReference: string
): Promise<AsaasCustomerResponse | null> {
  const result = await asaasFetch<AsaasListResponse<AsaasCustomerResponse>>(
    `/customers?externalReference=${encodeURIComponent(externalReference)}`
  )
  return result.data[0] ?? null
}

// ============================================
// Subscriptions
// ============================================

import type {
  AsaasCreateSubscriptionRequest,
  AsaasPaymentResponse,
  AsaasSubscriptionResponse,
} from './types'

export async function createSubscription(
  data: AsaasCreateSubscriptionRequest
): Promise<AsaasSubscriptionResponse> {
  return asaasFetch<AsaasSubscriptionResponse>('/subscriptions', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getSubscription(id: string): Promise<AsaasSubscriptionResponse> {
  return asaasFetch<AsaasSubscriptionResponse>(`/subscriptions/${id}`)
}

export async function updateSubscription(
  id: string,
  data: Partial<AsaasCreateSubscriptionRequest>
): Promise<AsaasSubscriptionResponse> {
  return asaasFetch<AsaasSubscriptionResponse>(`/subscriptions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function cancelSubscription(id: string): Promise<AsaasSubscriptionResponse> {
  return asaasFetch<AsaasSubscriptionResponse>(`/subscriptions/${id}`, {
    method: 'DELETE',
  })
}

export async function getSubscriptionPayments(
  id: string
): Promise<AsaasListResponse<AsaasPaymentResponse>> {
  return asaasFetch<AsaasListResponse<AsaasPaymentResponse>>(`/subscriptions/${id}/payments`)
}

// ============================================
// Payments
// ============================================

import type { AsaasPixQrCodeResponse } from './types'

export async function getPayment(id: string): Promise<AsaasPaymentResponse> {
  return asaasFetch<AsaasPaymentResponse>(`/payments/${id}`)
}

export async function getPaymentPixQrCode(id: string): Promise<AsaasPixQrCodeResponse> {
  return asaasFetch<AsaasPixQrCodeResponse>(`/payments/${id}/pixQrCode`)
}

export async function getPaymentInvoiceUrl(id: string): Promise<string> {
  const payment = await getPayment(id)
  return payment.invoiceUrl
}
