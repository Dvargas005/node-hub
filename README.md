# N.O.D.E. — Landing Page

Landing page para **node.nouvos.one**. Diseño, desarrollo y marketing por suscripción.

## Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Lexend + Atkinson Hyperlegible (next/font/google)

## Dev

```bash
npm install
npm run dev
```

## Waitlist API

`POST /api/waitlist` — almacena en JSON file (local) o Vercel KV (prod con env vars).

### Env vars opcionales (Vercel KV)

```
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

## Deploy

Conectar repo a Vercel. Framework preset: Next.js. Dominio: `node.nouvos.one`.
