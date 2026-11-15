import { useState } from 'react'
import { Check, RotateCcw, Shuffle, X } from 'lucide-react'
import type { Deck } from '../types'

type Card = Deck['cards'][number]

function shuffled<T>(items: T[]): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Kartičky: otoč, řekni si, jestli umíš. Co neumíš, vrátí se v dalším kole. */
export default function Flashcards({ deck }: { deck: Deck }) {
  const [queue, setQueue] = useState<Card[]>(deck.cards)
  const [again, setAgain] = useState<Card[]>([])
  const [pos, setPos] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const start = (cards: Card[]) => {
    setQueue(cards)
    setAgain([])
    setPos(0)
    setFlipped(false)
  }

  const card = queue[pos]

  if (!card) {
    return (
      <div className="card flex flex-col items-start gap-4 p-6">
        <div>
          <div className="text-lg font-semibold">{again.length === 0 ? 'Všechny kartičky umíš.' : `Kolo je za tebou. Zbývá doučit: ${again.length}`}</div>
          <p className="muted text-sm">Balíček „{deck.title}“ má {deck.cards.length} kartiček.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {again.length > 0 && (
            <button type="button" className="btn btn-primary" onClick={() => start(again)}>
              Projít ty, které neumím
            </button>
          )}
          <button type="button" className="btn btn-ghost" onClick={() => start(deck.cards)}>
            <RotateCcw size={16} /> Celý balíček znovu
          </button>
        </div>
      </div>
    )
  }

  const answer = (known: boolean) => {
    if (!known) setAgain((a) => [...a, card])
    setPos(pos + 1)
    setFlipped(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="muted text-sm tabular-nums">
          {pos + 1} / {queue.length}
        </span>
        <button type="button" className="btn btn-ghost" onClick={() => start(shuffled(queue))}>
          <Shuffle size={16} /> Zamíchat
        </button>
      </div>

      <button
        type="button"
        onClick={() => setFlipped(!flipped)}
        aria-label={flipped ? 'Zobrazit přední stranu' : 'Otočit kartičku'}
        className={`grid min-h-56 cursor-pointer place-items-center rounded-2xl border p-8 text-center transition-colors ${
          flipped
            ? 'border-indigo-600 bg-indigo-600 text-white'
            : 'border-ink-200 bg-white hover:border-indigo-300 dark:border-ink-700 dark:bg-ink-900'
        }`}
      >
        <div>
          <div className={`mb-2 text-xs font-semibold tracking-wider uppercase ${flipped ? 'text-indigo-200' : 'muted'}`}>
            {flipped ? 'Odpověď' : 'Otázka'}
          </div>
          <div className="text-2xl leading-snug font-semibold text-balance">{flipped ? card.back : card.front}</div>
          {!flipped && <div className="muted mt-4 text-sm">Kliknutím otočíš</div>}
        </div>
      </button>

      <div className="flex gap-2">
        <button type="button" className="btn btn-ghost flex-1" disabled={!flipped} onClick={() => answer(false)}>
          <X size={16} /> Ještě neumím
        </button>
        <button type="button" className="btn btn-primary flex-1" disabled={!flipped} onClick={() => answer(true)}>
          <Check size={16} /> Umím
        </button>
      </div>
    </div>
  )
}
