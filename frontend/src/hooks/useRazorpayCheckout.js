import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  createPaymentOrder,
  getApiErrorMessage,
  verifyPayment,
} from '../lib/paymentApi'
import {
  createRazorpayCheckout,
  loadRazorpayCheckout,
} from '../lib/razorpayCheckout'
import { formatMoney } from '../lib/money'

const labels = {
  preparing: 'Preparing checkout…',
  'checkout-open': 'Checkout is open',
  verifying: 'Verifying payment…',
  success: 'Payment complete',
  pending: 'Confirmation pending',
}

export function useRazorpayCheckout(plan) {
  const [state, setState] = useState('idle')
  const [message, setMessage] = useState('')
  const idempotencyRef = useRef(null)

  const createOrderMutation = useMutation({ mutationFn: createPaymentOrder })
  const verifyPaymentMutation = useMutation({ mutationFn: verifyPayment })

  const isProcessing = createOrderMutation.isPending || verifyPaymentMutation.isPending
  const isBusy = isProcessing || state === 'checkout-open'

  function reset() {
    setState('idle')
    setMessage('')
    idempotencyRef.current = null
  }

  async function handleSuccessfulCheckout(response) {
    setState('verifying')
    setMessage('Confirming the payment securely with Razorpay…')

    try {
      const verification = await verifyPaymentMutation.mutateAsync(response)
      if (verification.status === 'captured') {
        setState('success')
        setMessage('Payment confirmed. You’re all set.')
        idempotencyRef.current = null
        return
      }

      setState('pending')
      setMessage('Payment received and verified. We’re waiting for final capture confirmation.')
    } catch (error) {
      setState('error')
      setMessage(getApiErrorMessage(error, 'We could not verify the payment. Please try verification again.'))
    }
  }

  async function start() {
    if (!plan) {
      setState('error')
      setMessage('The selected plan is unavailable. Refresh the page and try again.')
      return
    }

    setMessage('')
    setState('preparing')

    try {
      await loadRazorpayCheckout()

      if (!idempotencyRef.current || idempotencyRef.current.productId !== plan.id) {
        idempotencyRef.current = {
          productId: plan.id,
          key: crypto.randomUUID(),
        }
      }

      const checkoutData = await createOrderMutation.mutateAsync({
        productId: plan.id,
        idempotencyKey: idempotencyRef.current.key,
      })

      const checkout = createRazorpayCheckout({
        checkoutData,
        onDismiss: () => {
          setState('idle')
          setMessage('Checkout closed. Your order is saved if you want to try again.')
        },
        onSuccess: handleSuccessfulCheckout,
        onFailure: (response) => {
          setState('error')
          setMessage(response.error?.description || 'The payment was not completed. No successful charge was confirmed.')
        },
      })

      setState('checkout-open')
      checkout.open()
    } catch (error) {
      if (error.response?.status === 502) idempotencyRef.current = null
      setState('error')
      setMessage(getApiErrorMessage(error, error.message || 'Checkout could not be started. Please try again.'))
    }
  }

  return {
    state,
    message,
    isBusy,
    isProcessing,
    buttonLabel: labels[state] || (plan
      ? `Pay ${formatMoney(plan.amount, plan.currency)} securely`
      : 'Loading price…'),
    start,
    reset,
  }
}
