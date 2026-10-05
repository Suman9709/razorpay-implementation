export function CheckIcon({ className = 'size-4' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="m5 10.5 3.1 3L15 6.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function LockIcon({ className = 'size-4' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="4.5" y="8.5" width="11" height="8" rx="2.2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 8.5V6.8a3 3 0 0 1 6 0v1.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function ArrowIcon() {
  return (
    <svg className="size-5 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4 10h11m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ShieldIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3 5.5 5.8v4.7c0 4.1 2.6 7.9 6.5 9.5 3.9-1.6 6.5-5.4 6.5-9.5V5.8L12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="m9.1 11.8 2 2 3.8-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function SparkIcon() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m12 2.8 2.1 7.1 7.1 2.1-7.1 2.1-2.1 7.1-2.1-7.1L2.8 12l7.1-2.1L12 2.8Z" fill="currentColor" />
    </svg>
  )
}
