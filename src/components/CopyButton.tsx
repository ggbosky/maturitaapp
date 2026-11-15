import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

export default function CopyButton({ text, label = 'Kopírovat', className = 'btn btn-ghost' }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        } catch {
          // Schránka není dostupná: text zůstává na stránce k ručnímu označení.
        }
      }}
    >
      {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
      {copied ? 'Zkopírováno' : label}
    </button>
  )
}
