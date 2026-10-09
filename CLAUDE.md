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

## SEO / GEO / AEO = add-on (desde 2026-10-01)
NO estan incluidos en Member / Growth / Pro ni en Dedicated Light. Add-on a cualquier plan:
**Starter SEO $1,250/mes** · **Full SEO $2,500/mes** · **Full SEO + GEO + AEO $4,000/mes**.
Dedicated Jump incluye Starter SEO; Dedicated Pro ($19,000/mes) incluye Full SEO, GEO y AEO.
El copy publico (FAQs, meta descriptions, city pages, llms.txt) no debe decir que el SEO va
dentro de los planes de $300/$500/$900.
- Cobro: el add-on es una 2da linea en la MISMA suscripcion de Stripe que el plan (un invoice).
  Logica en `src/lib/addons.ts`; alta/cambio/baja en `POST /api/stripe/addon` (el portal de Stripe
  no edita suscripciones de 2 lineas). Requiere plan recurrente ACTIVO; sin setup fee; minimo 3 meses
  (`Subscription.addOnMinTermEndsAt`). Jump paga solo la diferencia (price_data inline sobre el mismo Product).
- Nunca leer `items.data[0]` como la linea del plan: usar `splitSubscriptionItems()`.
- Products/Prices: `npx tsx scripts/setup-seo-addons.ts` (dry run) y luego `--apply`.
- Catalogo de creditos: "SEO Foundation" y "Ongoing SEO" retirados (`scripts/update-seo-pricing.ts`);
  el SEO Audit gratis se mantiene.

## Codigos promocionales: RETIRADOS (2026-10-01)
N.O.D.E. no ofrece codigos promocionales. Checkout no aplica descuentos ni muestra el campo de codigo;
se eliminaron el input de billing, `/api/billing/validate-promo` y el admin de Promos. La tabla
`promo_codes` queda (vacia) por historial. No reintroducir `allow_promotion_codes`.

## Contexto WAIPAX
VECTOR / ARC / CITADEL se están consolidando bajo la marca pública www.waipax.com.
Verificar la dirección de marca vigente antes de agregar o renombrar páginas de producto.

## Contacto
CEO / Producto: Erich Betancourt (erich@nouvos.one) · Tech Lead: Daniel Vargas

## Datos de plan que el copy debe repetir igual (verificado en prod 2026-10-03)
- Solicitudes activas: Member 2 · Growth 5 · Pro ilimitadas. Entrega: 5 / 3 / 2 dias habiles.
  No escribir "48 a 72 horas habiles" ni "24-48h": el plazo lo define el plan.
- On demand cuesta $5 (pago unico). Member / Growth / Pro tienen compromiso de 12 meses con pago
  mensual (Erich, 2026-10-08; ver "Compromiso minimo" abajo). No escribir
  "mes a mes" ni "sin contratos largos". La tarifa de $150/hora se publica solo en Clutch y GoodFirms (no en nodedev.one).
  Sin creditos gratis al registrarse (2026-10-09): el onboarding ya no suma 10 creditos y el copy no los ofrece. Los add-ons de SEO
  y los planes Dedicated tienen minimo de 3 meses.
- Nouvos se fundo en 2024: no escribir "anos de experiencia".
- Sin descuentos de ningun tipo (2026-10-03): el wizard no ofrece ni aplica descuentos; un ticket cuesta
  siempre el `creditCost` del catalogo. No reintroducir el descuento por plazo extendido.
- Soporte: solo Dedicated Pro es 24/7. Todos los demas planes: confirmacion de recibido al siguiente
  dia habil despues del email o la notificacion. No escribir "soporte 24/7" ni "soporte prioritario" en otros planes.

## Compromiso minimo (12 meses en Member / Growth / Pro, 3 en Dedicated)
- Regla (Erich, 2026-10-08): 12 meses con pago mensual; despues sigue mes a mes y se cancela cuando quiera.
  Salida anticipada: NO es autoservicio, el cliente escribe a soporte y nosotros decidimos.
- `Plan.minTermMonths` -> `Subscription.minTermEndsAt`, calculado en `src/lib/commitment.ts`. Lo fijan el webhook
  Y `verify-session` (cualquiera puede correr primero). Un upgrade conserva la fecha original.
- Cancelar: solo `POST /api/stripe/cancel` (cancela al fin del periodo y revisa el plazo del plan y del add-on).
  La cancelacion esta APAGADA en el portal de Stripe; no volver a encenderla o el plazo deja de aplicarse.
- Checkout muestra el compromiso junto al boton de pago (`custom_text.submit`). No hay pagina de Terminos todavia.
- Datos fuera del codigo: `npx tsx scripts/set-plan-commitment.ts` (dry run) y luego `--apply`
  (minTermMonths en la DB, descripcion de los Products, portal sin cancelar). No toca suscripciones existentes.
- Test: `npx tsx --test src/lib/commitment.test.ts`. `npm run lint` no esta configurado (pide setup interactivo).
