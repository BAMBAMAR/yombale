# Fix report — Cartesian product bug in `GET /api/apporteurs/admin`

## Bug

In `backend/routes/apporteurs.js`, the `GET /admin` route (added in Task 3) joined
both `boutiques` and `commissions_apporteur` onto `utilisateurs` in a single query.
When an apporteur had multiple rows in **both** tables, the joins produced a
Cartesian product: each boutique row was duplicated once per commission row (and
vice versa). E.g. 2 boutiques × 4 commission rows → 8 joined rows, so
`COUNT(b.id)` reported 8 instead of 2, and `SUM(c.montant)` summed each
commission twice (once per boutique) instead of once. Both `nb_boutiques` and
`total_du`/`total_paye` were inflated whenever an apporteur had more than one
boutique and more than one commission — disagreeing with the correct totals
shown elsewhere (`/mes-stats`, `/admin/commissions`), which query
`commissions_apporteur` standalone without this join.

## Before

```sql
SELECT u.id, u.nom, u.email, u.code_apporteur,
       COUNT(b.id) AS nb_boutiques,
       COALESCE(SUM(c.montant) FILTER (WHERE c.statut='du'), 0)   AS total_du,
       COALESCE(SUM(c.montant) FILTER (WHERE c.statut='paye'), 0) AS total_paye
FROM utilisateurs u
LEFT JOIN boutiques b ON b.apporteur_id = u.id
LEFT JOIN commissions_apporteur c ON c.apporteur_id = u.id
WHERE u.est_apporteur = true
GROUP BY u.id, u.nom, u.email, u.code_apporteur
ORDER BY total_du DESC
```

## After

```sql
SELECT u.id, u.nom, u.email, u.code_apporteur,
       (SELECT COUNT(*) FROM boutiques WHERE apporteur_id = u.id) AS nb_boutiques,
       (SELECT COALESCE(SUM(montant),0) FROM commissions_apporteur WHERE apporteur_id=u.id AND statut='du')   AS total_du,
       (SELECT COALESCE(SUM(montant),0) FROM commissions_apporteur WHERE apporteur_id=u.id AND statut='paye') AS total_paye
FROM utilisateurs u
WHERE u.est_apporteur = true
ORDER BY total_du DESC
```

Each aggregate is now computed independently via a correlated subquery, so no
join-based fan-out is possible. `LEFT JOIN`/`GROUP BY` are no longer needed.
Column aliases (`nb_boutiques`, `total_du`, `total_paye`) and the response
shape (`res.json({ apporteurs: rows })`) are unchanged — only the SQL query
text inside the route was edited; no other JS logic (route path, middleware,
error handling) was touched.

## Verification

1. `node -c backend/routes/apporteurs.js` — passed, no syntax errors.
2. `git diff HEAD -- backend/routes/apporteurs.js` reviewed — confirms the
   diff touches only the SQL text of the `GET /admin` query (lines 93-102):
   removes the two `LEFT JOIN`s and the `GROUP BY`, replaces the three
   aggregate columns with correlated subqueries. No other route
   (`/admin/commissions`, etc.) was modified, no response-shape change.
3. No live database was reachable in this sandbox — no `backend/.env` /
   `DATABASE_URL` present, consistent with all prior tasks in this plan. A
   live scratch test (1 apporteur, 2 boutiques, 3+ commission rows across
   those boutiques, confirming `nb_boutiques` = 2 and correct summed
   `total_du`/`total_paye`) was not performed for this reason. Reported
   honestly rather than fabricating a live test result.

## Scope confirmation

Only `backend/routes/apporteurs.js` was modified, and within it, only the SQL
string inside the `GET /admin` route handler (lines ~93-99). No other files,
routes, or JS logic were changed.
