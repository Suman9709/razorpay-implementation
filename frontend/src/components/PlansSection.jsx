import { CheckIcon } from './icons'
import PlanCard from './PlanCard'

const benefits = ['Instant activation', 'No hidden charges', 'Secure verification']

function PlansSection({ plans, selectedPlanId, onPlanSelect }) {
  return (
    <section className="max-w-2xl">
      <div className="inline-flex items-center gap-2 rounded-full border border-[#d7d2c7] bg-white/55 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#675f8f]">
        <span className="size-1.5 rounded-full bg-[#6d5ae6] shadow-[0_0_0_4px_rgba(109,90,230,0.12)]" />
        Simple pricing. Serious momentum.
      </div>

      <h1 className="mt-7 max-w-[44rem] font-serif text-[clamp(3rem,7vw,5.7rem)] leading-[0.93] tracking-[-0.055em] text-[#17152b]">
        Make room for your <span className="italic text-[#6d5ae6]">best work.</span>
      </h1>
      <p className="mt-6 max-w-xl text-base leading-7 text-[#625d55] sm:text-lg sm:leading-8">
        Pick the workspace that fits today. You’ll finish payment in Razorpay’s secure checkout and return here for instant verification.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            selected={plan.id === selectedPlanId}
            onSelect={onPlanSelect}
          />
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm font-medium text-[#6c675f]">
        {benefits.map((benefit) => (
          <span key={benefit} className="flex items-center gap-2">
            <span className="text-[#27966a]"><CheckIcon /></span>
            {benefit}
          </span>
        ))}
      </div>
    </section>
  )
}

export default PlansSection
