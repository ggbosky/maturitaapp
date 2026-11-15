export default function ProgressBar({ value, max, barClass = 'bg-indigo-500' }: { value: number; max: number; barClass?: string }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100)
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800"
    >
      <div className={`h-full rounded-full transition-[width] ${barClass}`} style={{ width: `${pct}%` }} />
    </div>
  )
}
