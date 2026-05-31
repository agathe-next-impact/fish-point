# PWA-only mode

The product direction is now web/PWA first. The historical Expo app remains in
`mobile/` for reference, but it is suspended and must not affect the web app.

Current isolation rules:

- `mobile/` and `shared/` are ignored by Vercel uploads.
- `mobile/` and `shared/` are ignored by the root ESLint config.
- The root package no longer declares the `shared` workspace.
- Mobile-only auth endpoints are not deployed by the web app.
- The service worker is registered by the web app in production only.

Keep `/api/catches/sync` available: it supports offline sync flows that can also
be used by the PWA.
