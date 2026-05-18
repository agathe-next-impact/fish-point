# Stratégie de tests

> État au 2026-04-26 (onboarding).

## Harness en place

- **Unit / integration légère** : Vitest 4 + jsdom + `@testing-library/react`
  - Config : `vitest.config.ts`
  - Setup : `tests/setup.ts`
  - Pattern : `tests/**/*.test.{ts,tsx}`
  - Run : `npx vitest run`
- **E2E** : Playwright 1.58 (chromium + Mobile Chrome / Pixel 5)
  - Config : `playwright.config.ts`
  - Pattern : `tests/e2e/*.spec.ts`
  - Run : `npx playwright test`
  - Lance `npm run dev` automatiquement (reuseExistingServer en local)

## Couverture actuelle

### Unit
- `tests/unit/services/fish-index.test.ts`
- `tests/unit/services/regulations.test.ts`
- `tests/unit/validators/spot.schema.test.ts`

### E2E
- `tests/e2e/auth-flow.spec.ts`
- `tests/e2e/map-navigation.spec.ts`
- `tests/e2e/spot-creation.spec.ts`

**Pas de seuil de couverture mesuré ni enforced.** Aucune métrique chiffrée disponible.

## Cible (tout nouveau flow critique)

1. **Paiement Stripe** : webhook `/api/webhooks/stripe` (signature, idempotence, mise à jour `User.isPremium`)
2. **Sync offline catches** : route `/api/catches/sync` + `lib/offline-db.ts` côté client
3. **Auth mobile bearer** : `/api/auth/mobile-login`, `mobile-register`, `push-token`
4. **Cron endpoints** : test bearer + comportement nominal vs `compute-alerts` & `refresh-scores`
5. **Validation Zod aux frontières** : tester schemas `spot`, `catch`, `private-spot`, `fishing-card`
6. **Permissions privées** : un utilisateur ne peut pas lire les `PrivateSpot` d'un autre
7. **Rate limiting** : `lib/rate-limit.ts` appliqué aux endpoints sensibles (login, register, upload)

## Priorités

1. **Bloquant prod** : webhook Stripe, sync offline, auth mobile, permissions (régression = vraie casse utilisateur ou faille).
2. **Important** : cron compute-alerts (notification ratée = utilisateur frustré), validation Zod.
3. **Confort** : E2E parcours premium (subscribe → upload spot privé → catch).

## Convention pour ajouter un test

- **Unit** : `tests/unit/<domaine>/<sujet>.test.ts`. Mocker Prisma via `vitest.mock('@/lib/prisma', ...)` ou utiliser `prisma-mock`/`mock-deep`.
- **Integration DB** : créer `tests/integration/` quand on aura un Postgres test. Ne **pas** mocker la DB sur les tests qui exercent la logique géospatiale PostGIS.
- **E2E** : `tests/e2e/<flow>.spec.ts`. Préférer un parcours utilisateur complet sur un seuil de spec courtes.

## Quand ajouter un test (politique)

- **Obligatoire** : sur tout nouveau flow listé dans la section Cible ci-dessus.
- **Recommandé** : sur tout fix de bug — au moins un test de régression qui aurait attrapé le bug.
- **Optionnel** : tweaks visuels purs sans logique conditionnelle.

## Limites connues

- Pas d'intégration `vitest --coverage` configurée.
- Pas de Postgres test isolé : les tests qui touchent la DB devront soit mocker, soit utiliser une branche Neon dédiée.
- Pas de tests sur le code mobile (`mobile/`) — Expo + RN testing à mettre en place si la surface mobile devient critique.
