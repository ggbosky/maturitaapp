# Zvládni to

Desktopová aplikace pro přípravu na maturitu: český jazyk, matematika, angličtina a taháky ke slohu a ústní zkoušce.

## Stack

- **Electron** – okno desktopové aplikace (`electron/main.cjs`)
- **React 19 + TypeScript + Vite** – rozhraní
- **Tailwind CSS 4** – styly, světlý a tmavý režim
- **React Router** (HashRouter) – navigace, funguje i přes `file://`
- **localStorage** – pokrok studenta a zvolený režim
- **Vitest** – testy vyhodnocování odpovědí a kontrola dat

Obsah je v JSON souborech, aplikace běží celá offline.

## Spuštění

```bash
npm install
npm run dev            # v prohlížeči na http://localhost:5173
npm run electron:dev   # desktopové okno s živým přenačítáním
npm run electron:start # sestaví aplikaci a otevře ji v Electronu
npm test               # testy
npm run dist           # instalátor do složky release/ (electron-builder)
npm run license:keygen # nový pár klíčů pro licence (zneplatní dříve vydané)
```

## Struktura

```
electron/main.cjs         hlavní proces Electronu
src/
  main.tsx, App.tsx       vstup a trasy
  types.ts                tvary dat (Topic, Book, Quiz, Deck, Verb)
  data/
    index.ts              skládá JSON soubory do předmětů
    cestina/              topics.json, books.json, quizzes.json, flashcards.json
    matematika/           topics.json, quizzes.json, flashcards.json
    anglictina/           topics.json, quizzes.json, flashcards.json, irregular-verbs.json
    tahaky/               topics.json, flashcards.json
  license/                licence: ověření klíče, kód zařízení, veřejný klíč
  lib/
    quiz.ts               kontrola odpovědí a skóre
    progress.ts           pokrok v localStorage
    search.ts             hledání napříč obsahem
    theme.ts, subjectStyle.ts
  components/
    layout/               Layout, Sidebar
    SearchBox.tsx         hledání (Ctrl+K)
    TopicContent.tsx      výklad: text, odrážky, vzorce, tabulky, příklady, tipy
    Quiz.tsx              test s okamžitou kontrolou a vyhodnocením
    Flashcards.tsx        kartičky
    IrregularVerbs.tsx    tabulka sloves a zkoušení
  pages/                  Dashboard, SubjectPage, TopicPage, BookPage, QuizPage, LoginPage, AdminPage
```

## Licence

Do aplikace se dostane jen ten, kdo má platný licenční klíč. Jeden klíč platí pro jedno zařízení.

1. Student nebo škola otevře aplikaci a na přihlašovací obrazovce uvidí **kód zařízení** (např. `MV1F-0XTY-NRKH`). Pošle ho správci.
2. Správce otevře **Správu licencí** (odkaz dole na přihlašovací obrazovce, adresa `#/sprava-licenci`), vloží svůj soukromý klíč, vyplní typ účtu, jméno, kód zařízení a platnost a vydá klíč.
3. Držitel klíč vloží na přihlašovací obrazovce. Na jiném zařízení tentýž klíč neprojde.

Jak to funguje: klíč obsahuje typ účtu, jméno, kód zařízení a platnost a je podepsaný soukromým klíčem správce (ECDSA P-256). Aplikace podpis ověřuje veřejným klíčem ze `src/license/publicKey.ts`. Bez soukromého klíče platný klíč vyrobit nejde.

Soukromý klíč patří jen správci a **nesmí se dostat do repozitáře**. Nový pár klíčů vytvoří `npm run license:keygen`; tím přestanou platit všechny dříve vydané licence.

Omezení, se kterými je potřeba počítat:

- Kontrola běží v prohlížeči. Brání běžnému sdílení klíčů, ale technicky zdatný uživatel ji umí obejít a obsah je ve veřejném repozitáři čitelný i bez licence. Neobejitelná ochrana vyžaduje server, který obsah vydá až po ověření.
- Kód zařízení je uložený v datech prohlížeče. Po jejich smazání nebo v jiném prohlížeči vznikne nový kód a je potřeba nový klíč.
- Vydaný klíč nejde na dálku zrušit, jen nechat vypršet. Proto se vyplatí nastavovat platnost.

## Jak přidat obsah

Stačí upravit JSON, kód se měnit nemusí. Tvary popisuje `src/types.ts`.

**Téma** (`topics.json`) – sekce může mít libovolnou kombinaci polí `text`, `bullets`, `formulas`, `table`, `example`, `tip`:

```json
{
  "id": "posloupnosti",
  "title": "Posloupnosti",
  "category": "Funkce",
  "summary": "Aritmetická a geometrická posloupnost.",
  "sections": [
    { "heading": "Aritmetická posloupnost", "formulas": [{ "label": "n-tý člen", "formula": "aₙ = a₁ + (n − 1)·d" }] }
  ]
}
```

**Otázka v testu** (`quizzes.json`) – výběr z možností, nebo doplňovačka s více uznávanými odpověďmi:

```json
{ "type": "choice", "question": "…", "options": ["a", "b", "c"], "answer": 1, "explanation": "…" }
{ "type": "input", "question": "…", "answers": ["is raining", "'s raining"] }
```

U doplňovaček se nerozlišuje velikost písmen, mezery navíc ani desetinná čárka a tečka.

**Kniha** (`cestina/books.json`) – autor, směr, druh, žánr, téma, motivy, časoprostor, kompozice, postavy, jazyk, kontext a volitelná ukázka.

`npm test` ověří, že id jsou jedinečná a že každá otázka má platnou správnou odpověď.
