# N.O.D.E. — Hub / Landing
**Nouvos Solutions LLC** · Repo: `node-hub` · Dominio: `www.nodedev.one`

## Producto
Hub de N.O.D.E. — diseño, desarrollo y marketing por suscripción para PYMEs.
Landing + waitlist + checkout de suscripción.

## Stack
- **Frontend:** Next.js (App Router) · TypeScript · Tailwind + shadcn/ui + Base UI
  + Radix · `next-themes` · Framer Motion + Lenis · three.js
- **Backend:** Prisma + PostgreSQL (`@prisma/adapter-pg`) · Redis (ioredis)
- **Auth:** **Better Auth** — igual que el resto del ecosistema. NO usar Clerk.
- **Pagos:** Stripe · **Email:** Resend · **AI:** `@google/generative-ai`
- **Deploy:** Vercel (`vercel.json`)
- **Tipografía:** Lexend + Atkinson Hyperlegible (`next/font/google`)

## Comandos
```bash
npm install
npm run dev
npm run db:generate / db:migrate / db:push / db:seed / db:studio
npm run lint
```

## Waitlist API
`POST /api/waitlist` — almacena en archivo JSON (local) o Vercel KV (prod).
Env opcionales: `KV_REST_API_URL`, `KV_REST_API_TOKEN`.

## Reglas críticas
1. Better Auth únicamente — coherente con arc / citadel / vector. No introducir Clerk.
2. Usar los componentes de shadcn/ui ya instalados (`components.json`); no mezclar
   otro design system. Este repo **no** usa IBM Carbon — eso es de los repos de producto.
3. Cambios de schema pasan por Prisma migrations, nunca edición manual.
4. Secrets solo por env vars; `.env` y `.env.local` no se commitean.

## Precios (member / growth / pro)
Vigentes desde 2026-09-21: **$300 / $500 / $900 al mes**, setup unico **$312 / $1,092 / $1,560**.
- Los Stripe Prices son inmutables: el monto no se edita ni en el Dashboard ni por API.
  Para cambiar un precio usar SIEMPRE `npx tsx scripts/reprice-plans.ts` (dry run) y luego
  `--apply`. Crea el Price nuevo en el mismo Product, reapunta la DB, verifica y archiva el viejo.
- Nunca cambiar solo `src/app/page.tsx`: el commit 535af78 subio los precios mostrados 20%
  sin tocar Stripe y la pagina quedo desalineada con lo que cobra checkout.
- Checkout lee `plan.stripePriceId` y `plan.setupFeeStripePriceId` de la DB. No hay IDs hardcodeados.
- `prisma/seed.ts` usa `upsert` con `update: {}`: re-sembrar NO cambia precios existentes.
- No usar `prisma/setup-stripe.ts --force`: duplica los Products de los 8 planes.
- Suscriptores existentes quedan en su precio (grandfathered). El script no toca suscripciones.

## Contexto WAIPAX
VECTOR / ARC / CITADEL se están consolidando bajo la marca pública www.waipax.com.
Verificar la dirección de marca vigente antes de agregar o renombrar páginas de producto.

## Contacto
CEO / Producto: Erich Betancourt (erich@nouvos.one) · Tech Lead: Daniel Vargas
