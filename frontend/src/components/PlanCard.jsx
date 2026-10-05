import { CheckIcon } from './icons'
import { formatMoney } from '../lib/money'

function PlanCard({ plan, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(plan.id)}
      aria-pressed={selected}
      className={`group relative w-full overflow-hidden rounded-[1.4rem] border p-5 text-left transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6d5ae6] ${
        selected
          ? 'border-[#6d5ae6] bg-white shadow-[0_18px_50px_rgba(55,42,111,0.12)]'
          : 'border-[#dedbd2] bg-white/55 hover:-translate-y-0.5 hover:border-[#bdb5df] hover:bg-white'
      }`}
    >
      {plan.popular && (
        <span className="absolute right-4 top-4 rounded-full bg-[#ede8ff] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#5942bd]">
          Most popular
        </span>
      )}

      <div className="flex items-start gap-4 pr-24">
        <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border transition-colors ${selected ? 'border-[#6d5ae6] bg-[#6d5ae6] text-white' : 'border-[#b8b3aa] text-transparent'}`}>
          <CheckIcon className="size-3.5" />
        </span>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.17em] text-[#8b857b]">{plan.eyebrow}</p>
          <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#17152b]">{plan.name}</h3>
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between gap-4 pl-9">
        <p className="max-w-[17rem] text-sm leading-6 text-[#6c675f]">{plan.description}</p>
        <p className="shrink-0 text-right">
          <span className="text-2xl font-semibold tracking-[-0.04em] text-[#17152b]">{formatMoney(plan.amount, plan.currency)}</span>
          <span className="block text-[11px] font-medium text-[#8b857b]">one time</span>
        </p>
      </div>
    </button>
  )
}

export default PlanCard
