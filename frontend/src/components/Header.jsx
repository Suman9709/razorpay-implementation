import { LockIcon, SparkIcon } from './icons'

function Header() {
  return (
    <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6 sm:px-8 lg:px-10">
      <a href="#" className="flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6d5ae6]" aria-label="Northstar home">
        <span className="grid size-10 place-items-center rounded-xl bg-[#17152b] text-white shadow-[0_8px_22px_rgba(23,21,43,0.2)]">
          <SparkIcon />
        </span>
        <span>
          <span className="block text-[15px] font-bold tracking-[-0.02em]">Northstar</span>
          <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#8b857b]">Workspace</span>
        </span>
      </a>

      <div className="flex items-center gap-2 rounded-full border border-[#ddd9cf] bg-white/65 px-3.5 py-2 text-xs font-semibold text-[#625d55] shadow-sm backdrop-blur">
        <span className="text-[#27966a]"><LockIcon /></span>
        Secure checkout
      </div>
    </header>
  )
}

export default Header
