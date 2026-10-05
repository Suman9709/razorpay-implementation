import { useState } from 'react'
import Header from './components/Header'
import OrderSummary from './components/OrderSummary'
import PlansSection from './components/PlansSection'
import { DEFAULT_PLAN_ID } from './data/plans'
import { usePaymentPlans } from './hooks/usePaymentPlans'
import { useRazorpayCheckout } from './hooks/useRazorpayCheckout'

function App() {
  const [selectedPlanId, setSelectedPlanId] = useState(DEFAULT_PLAN_ID)
  const plansQuery = usePaymentPlans()
  const plans = plansQuery.data ?? []
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? plans[0] ?? null
  const checkout = useRazorpayCheckout(selectedPlan)

  function handlePlanSelect(planId) {
    if (checkout.isBusy) return
    setSelectedPlanId(planId)
    checkout.reset()
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7f5ef] text-[#17152b]">
      <div className="pointer-events-none absolute -left-48 -top-64 size-[38rem] rounded-full bg-[#dcd2ff]/55 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-80 -right-48 size-[42rem] rounded-full bg-[#bce9d6]/55 blur-3xl" />
      <div className="grain pointer-events-none absolute inset-0 opacity-[0.035]" />

      <Header />

      {plansQuery.isPending ? (
        <main className="relative z-10 mx-auto grid min-h-[60vh] max-w-7xl place-items-center px-5 text-center">
          <div>
            <span className="mx-auto block size-8 animate-spin rounded-full border-2 border-[#6d5ae6]/25 border-t-[#6d5ae6]" />
            <p className="mt-4 text-sm font-semibold text-[#625d55]">Loading secure pricing…</p>
          </div>
        </main>
      ) : plansQuery.isError || !selectedPlan ? (
        <main className="relative z-10 mx-auto grid min-h-[60vh] max-w-7xl place-items-center px-5 text-center">
          <div className="max-w-md rounded-3xl border border-[#e2ddd4] bg-white/80 p-8 shadow-xl">
            <h1 className="text-2xl font-semibold">Pricing is temporarily unavailable</h1>
            <p className="mt-3 text-sm leading-6 text-[#6c675f]">We could not load the plans from the payment server.</p>
            <button type="button" onClick={() => plansQuery.refetch()} className="mt-6 rounded-xl bg-[#17152b] px-5 py-3 text-sm font-bold text-white">
              Try again
            </button>
          </div>
        </main>
      ) : (
        <main className="relative z-10 mx-auto grid w-full max-w-7xl gap-12 px-5 pb-14 pt-8 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:gap-20 lg:px-10 lg:pb-20 lg:pt-14">
          <PlansSection
            plans={plans}
            selectedPlanId={selectedPlan.id}
            onPlanSelect={handlePlanSelect}
          />
          <OrderSummary plan={selectedPlan} checkout={checkout} />
        </main>
      )}
    </div>
  )
}

export default App
