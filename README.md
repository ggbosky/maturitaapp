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
  license/                licence školy a žáků, kód zařízení, veřejný klíč
  lib/
    quiz.ts               kontrola odpovědí a skóre
    school.ts             obsah od učitele a podepsaný balíček pro žáky
    practice.ts           dvojice pro hry z témat
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
    Practice.tsx          panel Procvič si u každého tématu
    games/                přiřazování, rychlovka, hry k četbě
  pages/                  Dashboard, předměty, témata, četba, testy, přihlášení,
                          správa licencí, Správa školy (učitel), editor témat, Moje škola (žák)
```

## Licence a školy

Aplikace se prodává školám. Každá škola má jednu licenci, učitel z ní vydává klíče žákům.

1. **Učitel** otevře aplikaci, zvolí *Škola (učitel)* a pošle správci **kód zařízení** (např. `G537-SHT7-EV4P`).
2. **Správce** otevře *Správu licencí* (odkaz dole na přihlašovací obrazovce, adresa `#/sprava-licenci`), vloží soukromý klíč, vyplní název školy, kód zařízení učitele a počet míst pro žáky. Platnost je předvyplněná do konce další maturity (30. 6.). Vydá licenci, která začíná `ZTS2-`.
3. Učitel licenci aktivuje. V sekci **Správa školy** pak:
   - vydává klíče žákům (žák mu pošle kód svého zařízení, klíč začíná `ZTZ2-`), nejvýš tolik, kolik má škola míst,
   - přidává vlastní témata do předmětů a zakládá odborné předměty, včetně dvojic pro hry a otázek do kvízu,
   - stahuje **balíček pro žáky** (soubor `.json`) a sdílí ho třeba přes Teams nebo Bakaláře.
4. **Žák** se přihlásí svým klíčem a v sekci **Moje škola** načte balíček od učitele.

**Prodloužení:** ve Správě licencí u školy klikni na *Prodloužit*. Nová licence má stejné klíče školy, takže žákům dál platí jejich klíče. Učitel aktivuje novou licenci a pošle žákům nový balíček, který prodlouží platnost i jim. 30 dní před koncem platnosti aplikace upozorňuje.

**Jak to funguje:** licence školy je certifikát podepsaný soukromým klíčem správce (ECDSA P-256) a nese veřejný klíč školy. Klíče žáků i balíčky podepisuje klíč školy. Aplikace ověří celý řetězec jen s veřejným klíčem správce ze `src/license/publicKey.ts`. Soukromý klíč správce **nesmí do repozitáře**; nový pár vytvoří `npm run license:keygen` (tím přestanou platit všechny dříve vydané licence).

Omezení, se kterými je potřeba počítat:

- Kontrola běží v aplikaci, ne na serveru. Brání běžnému sdílení klíčů, ale technicky zdatný uživatel ji umí obejít a obsah je ve veřejném repozitáři čitelný i bez licence.
- Obsah od učitele se k žákům dostane jen balíčkem, ne automaticky. Okamžitá synchronizace by vyžadovala server.
- Počet míst hlídá aplikace učitele. Vydaný klíč nejde na dálku zrušit, platí do konce licence školy.
- Kód zařízení je uložený v datech prohlížeče. Po jejich smazání nebo v jiném prohlížeči vznikne nový kód a je potřeba nový klíč.

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

**Kniha** (`cestina/books.json`) – povinně název, autor, rok, skupina seznamu četby (1–4), forma, druh, žánr, období a téma; volitelně motivy, časoprostor, kompozice, postavy, jazyk, kontext a ukázka. Dílo s údaji k ověření má `"overit": true`.

**Hry k tématu** se tvoří samy z tabulek a vzorců. Další dvojice a otázky jdou do pole `practice`:

```json
"practice": {
  "pairs": [{ "a": "Metafora", "b": "přenesení na základě podobnosti" }],
  "questions": [{ "type": "choice", "question": "…", "options": ["a", "b"], "answer": 0 }]
}
```

`npm test` ověří, že id jsou jedinečná a že každá otázka má platnou správnou odpověď.
