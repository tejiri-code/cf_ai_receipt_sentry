# ReceiptSentry (cf_ai_receipt_sentry)

AI-powered receipt assistant built on Cloudflare:
- Next.js on Cloudflare Pages (chat UI)
- Cloudflare Worker API
- Workers AI (LLM)
- Durable Objects (per-user memory/state)

## Architecture
Browser (Pages/Next.js) -> Worker (/api/chat) -> Workers AI
                         -> Durable Object (UserMemoryDO)

## Local dev
### 1) Run Worker
cd workers/api
wrangler dev

### 2) Run Web
cd apps/web
echo "NEXT_PUBLIC_API_BASE=http://localhost:8787" > .env.local
npm run dev

Open http://localhost:3000

## Deploy
### Deploy Worker
cd workers/api
wrangler deploy

### Deploy Pages
wrangler pages deploy apps/web --project-name cf-ai-receipt-sentry-web

Set Pages env var:
NEXT_PUBLIC_API_BASE = <your worker url>

## Notes
- AI prompts used are documented in PROMPTS.md
- Durable Objects store last 20 messages per user
