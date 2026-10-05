import axios from 'axios'

const paymentApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 15_000,
  headers: { Accept: 'application/json' },
})

export async function getPaymentPlans() {
  const response = await paymentApi.get('/api/payments/plans')
  return response.data.plans
}

export async function createPaymentOrder({ productId, idempotencyKey }) {
  const response = await paymentApi.post(
    '/api/payments/orders',
    { productId },
    { headers: { 'Idempotency-Key': idempotencyKey } },
  )
  return response.data
}

export async function verifyPayment(checkoutResponse) {
  const response = await paymentApi.post('/api/payments/verify', {
    razorpay_payment_id: checkoutResponse.razorpay_payment_id,
    razorpay_order_id: checkoutResponse.razorpay_order_id,
    razorpay_signature: checkoutResponse.razorpay_signature,
  })
  return response.data
}

export function getApiErrorMessage(error, fallback) {
  if (!navigator.onLine) return 'You appear to be offline. Reconnect and try again.'
  return error.response?.data?.error || fallback
}
