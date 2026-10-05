import { ArrowIcon, CheckIcon, LockIcon, ShieldIcon } from './icons'
import { formatMoney } from '../lib/money'

const paymentMethods = ['UPI', 'Cards', 'Netbanking']

function StatusMessage({ state, message }) {
  if (!message) return null

  const tone = state === 'success'
    ? 'border-[#bde6d4] bg-[#effaf5] text-[#176b4b]'
    : state === 'error'
      ? 'border-[#f0c7c3] bg-[#fff4f2] text-[#9b3930]'
      : 'border-[#ddd5fb] bg-[#f6f3ff] text-[#55439c]'

  return (
    <div
      role={state === 'error' ? 'alert' : 'status'}
      aria-live="polite"
      className={`mb-4 rounded-xl border px-4 py-3 text-sm leading-5 ${tone}`}
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 shrink-0">
          {state === 'success' ? <CheckIcon /> : <ShieldIcon />}
        </span>
        <span>{message}</span>
      </div>
    </div>
  )
}

function CheckoutButton({ checkout }) {
  const isFinished = ['success', 'pending'].includes(checkout.state)

  return (
    <button
      type="button"
      onClick={checkout.start}
      disabled={checkout.isBusy || isFinished}
      className="group flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#17152b] px-5 py-4 text-sm font-bold text-white shadow-[0_12px_28px_rgba(23,21,43,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#28243f] hover:shadow-[0_16px_35px_rgba(23,21,43,0.27)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6d5ae6] disabled:cursor-not-allowed disabled:opacity-65 disabled:hover:translate-y-0"
    >
      {checkout.isProcessing && (
        <span className="size-4 animate-spin rounded-full border-2 border-white/35 border-t-white" aria-hidden="true" />
      )}
      {checkout.buttonLabel}
      {!checkout.isBusy && !isFinished && <ArrowIcon />}
    </button>
  )
}

function OrderSummary({ plan, checkout }) {
  const formattedAmount = formatMoney(plan.amount, plan.currency)

  return (
    <aside className="lg:pt-3">
      <div className="relative mx-auto max-w-[31rem] lg:sticky lg:top-8">
        <div className="absolute -inset-3 -z-10 rounded-[2.2rem] bg-gradient-to-br from-[#6d5ae6]/15 via-transparent to-[#40b88a]/20 blur-xl" />
        <div className="overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/90 shadow-[0_30px_90px_rgba(44,38,73,0.18)] backdrop-blur-xl">
          <div className="border-b border-[#ebe8e1] px-6 py-5 sm:px-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8b857b]">Order summary</p>
                <h2 className="mt-1.5 text-xl font-semibold tracking-[-0.03em]">{plan.name} workspace</h2>
              </div>
              <span className="rounded-full bg-[#eff9f4] px-3 py-1.5 text-[11px] font-bold text-[#23825c]">Test mode</span>
            </div>
          </div>

          <div className="px-6 py-6 sm:px-8 sm:py-7">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-sm font-semibold text-[#312e47]">{plan.name} plan</p>
                <p className="mt-1 text-xs leading-5 text-[#89847c]">One-time payment · {plan.currency}</p>
              </div>
              <p className="text-xl font-semibold tracking-[-0.03em]">{formattedAmount}</p>
            </div>

            <ul className="mt-6 space-y-3 border-y border-[#ebe8e1] py-5">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-[#625d55]">
                  <span className="grid size-5 place-items-center rounded-full bg-[#ede8ff] text-[#6d5ae6]">
                    <CheckIcon className="size-3.5" />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>

            <div className="flex items-end justify-between py-6">
              <div>
                <p className="text-sm font-semibold">Total due today</p>
                <p className="mt-1 text-xs text-[#918c84]">No additional platform fee</p>
              </div>
              <p className="text-4xl font-semibold tracking-[-0.055em]">{formattedAmount}</p>
            </div>

            <StatusMessage state={checkout.state} message={checkout.message} />
            <CheckoutButton checkout={checkout} />

            <div className="mt-5 flex items-center justify-center gap-2 text-center text-[11px] font-medium leading-5 text-[#8b857b]">
              <LockIcon className="size-3.5" />
              Payment details are handled securely by Razorpay
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 border-t border-[#ebe8e1] pt-5">
              {paymentMethods.map((method) => (
                <span key={method} className="rounded-lg border border-[#e4e0d8] bg-[#faf9f6] px-2 py-2 text-center text-[10px] font-bold uppercase tracking-[0.1em] text-[#7b756c]">
                  {method}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-5 text-[11px] font-semibold text-[#8b857b]">
          <span className="flex items-center gap-1.5"><ShieldIcon />Encrypted checkout</span>
          <span className="size-1 rounded-full bg-[#b9b3aa]" />
          <span>Powered by Razorpay</span>
        </div>
      </div>
    </aside>
  )
}

export default OrderSummary
