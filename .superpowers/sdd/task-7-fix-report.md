# Task 7 — Fix report (code review finding: ad-hoc money formatting)

## What changed

`frontend-next/src/app/compte/apporteur/ApporteurClient.tsx` used ad-hoc
`.toLocaleString('fr-FR')` calls plus a manually appended `' FCFA'` string in
three places, instead of using the shared `fcfa()` helper from
`frontend-next/src/lib/format.ts` (already used elsewhere, e.g.
`BoutiqueClient.tsx`).

Fix:
1. Added `import { fcfa } from '@/lib/format'` alongside the existing imports.
2. Replaced all three ad-hoc formatting call sites with `fcfa(...)`, passing
   the raw numeric value and removing the redundant manual `' FCFA'` suffix
   (since `fcfa()` already appends it).

## Before / after for each of the 3 call sites

**1. Commission due (`stats.total_du`)**
- Before: `{stats.total_du.toLocaleString('fr-FR')} FCFA`
- After: `{fcfa(stats.total_du)}`

**2. Déjà payé (`stats.total_paye`)**
- Before: `{stats.total_paye.toLocaleString('fr-FR')} FCFA`
- After: `{fcfa(stats.total_paye)}`

**3. Seuil de paiement (`stats.seuil_paiement`)**
- Before: `Règlement à partir de {stats.seuil_paiement.toLocaleString('fr-FR')} FCFA cumulés`
- After: `Règlement à partir de {fcfa(stats.seuil_paiement)} cumulés`

## Type-check output

```
cd frontend-next && npx tsc --noEmit -p tsconfig.json
```
Produced no output (exit code 0) — zero errors, zero new errors introduced.

## Diff scope verification

`git diff HEAD` confirmed the change touches only
`frontend-next/src/app/compte/apporteur/ApporteurClient.tsx`:
- the new `import { fcfa } from '@/lib/format'` line
- the three replaced JSX expressions listed above

No other file was modified.

## Reasoning on the zero-value case

`fcfa()` in `frontend-next/src/lib/format.ts` is:

```ts
export function fcfa(prix: number | string | null): string {
  if (!prix) return '—';
  return new Intl.NumberFormat('fr-FR').format(Number(prix)) + ' FCFA';
}
```

For a brand-new apporteur, `stats.total_du` and `stats.total_paye` will both
be `0`. With `fcfa()`, this renders as `'—'` instead of the previous
`'0 FCFA'`.

I judged this acceptable and did not special-case zero:
- `'—'` is a standard, well-understood "nothing yet" empty-state indicator
  and reads at least as well as `'0 FCFA'` for "Commission due" / "Déjà payé"
  on a dashboard for someone with no activity yet.
- This is exactly the guard's intended purpose (it's already relied upon
  elsewhere in the codebase, e.g. `BoutiqueClient.tsx`), so keeping the
  behavior consistent avoids introducing a one-off exception just for this
  page.
- `stats.seuil_paiement` is a configured payout threshold (e.g. from
  `settings`), not a per-user cumulative value — it should never realistically
  be `0`/falsy in practice, so the guard has no practical effect there.

No special-casing was added; `fcfa()` is used as-is for consistency with the
rest of the codebase.
