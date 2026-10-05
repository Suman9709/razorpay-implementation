let checkoutScriptPromise

export function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve()
  if (checkoutScriptPromise) return checkoutScriptPromise

  checkoutScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-razorpay-checkout]')
    if (existingScript) {
      existingScript.addEventListener('load', resolve, { once: true })
      existingScript.addEventListener('error', reject, { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.referrerPolicy = 'no-referrer'
    script.dataset.razorpayCheckout = 'true'
    script.onload = () => {
      if (window.Razorpay) resolve()
      else reject(new Error('Razorpay Checkout loaded without initializing.'))
    }
    script.onerror = () => {
      script.remove()
      checkoutScriptPromise = undefined
      reject(new Error('The secure checkout could not be loaded. Check your connection and try again.'))
    }
    document.body.appendChild(script)
  })

  return checkoutScriptPromise
}

export function createRazorpayCheckout({ checkoutData, onDismiss, onSuccess, onFailure }) {
  let checkoutFinished = false

  const checkout = new window.Razorpay({
    key: checkoutData.keyId,
    order_id: checkoutData.order.id,
    amount: checkoutData.order.amount,
    currency: checkoutData.order.currency,
    name: 'Northstar',
    description: `${checkoutData.product.name} · Secure checkout`,
    theme: { color: '#6d5ae6', backdrop_color: '#17152b' },
    retry: { enabled: true, max_count: 2 },
    modal: {
      animation: true,
      escape: true,
      ondismiss: () => {
        if (!checkoutFinished) onDismiss()
      },
    },
    handler: async (response) => {
      checkoutFinished = true
      await onSuccess(response)
    },
  })

  checkout.on('payment.failed', (response) => {
    checkoutFinished = true
    onFailure(response)
  })

  return checkout
}
