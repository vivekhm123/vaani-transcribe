# Vaani — AI Video Transcription for Indian Languages

A real Next.js/TypeScript app: upload a video/audio file (or paste a direct
media URL), get a genuine speech-to-text transcript with automatic language
detection, edit it, romanize it, translate it, and export real TXT/SRT/VTT
files. No fake data paths run in production.

## Stack

- **Frontend/Backend**: Next.js 14 (App Router), TypeScript, Tailwind
- **Auth / DB / Storage**: Supabase (Postgres + Row Level Security, Auth, Storage)
- **Speech-to-text**: OpenAI Whisper API by default (`src/lib/transcription/providers/openai.ts`) — swappable
- **Translation / Romanization**: same provider's chat completions API, via `transcriptionService`

## 1. Install

```bash
npm install
cp .env.example .env.local
```

## 2. Set up Supabase

1. Create a project at supabase.com.
2. Copy the URL and anon key into `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`), and the service role key into
   `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API — keep this one server-side only).
3. Open the SQL editor and run `db/schema.sql`. This creates the
   `transcriptions` and `usage` tables, enables Row Level Security so users can
   only ever read/write their own rows, and creates a private `media-uploads`
   storage bucket.
4. Enable the **Google** provider under Authentication → Providers if you want
   "Continue with Google" to work (email/password works out of the box).

## 3. Set up the transcription provider

Get an API key from your chosen provider and add it as `TRANSCRIPTION_API_KEY`.
The default provider is OpenAI's Whisper endpoint — any OpenAI-compatible
`/audio/transcriptions` API works without code changes. To use a different
vendor (e.g. Sarvam AI, which specializes in Indian languages, or AssemblyAI),
add a new file under `src/lib/transcription/providers/` following the same
shape as `openai.ts`, and reference it in `transcriptionService.transcribeAudio`.

`LLM_API_KEY` (defaults to the same key as transcription) powers translation
and romanization via chat completions — no separate signup needed if you're
already using OpenAI.

## 4. Run it

```bash
npm run dev
```

Visit `http://localhost:3000`.

## Demo mode

If you want to click through the UI before wiring up a real provider, set
`DEMO_MODE=true` in `.env.local` and leave `TRANSCRIPTION_API_KEY` empty — a
canned Kannada transcript is returned instead of a real API call, and nothing
elsewhere in the code path changes. **`DEMO_MODE` must be `false` (or unset)
in production.** With no key and `DEMO_MODE` unset, the API correctly returns
the "Transcription API is not configured…" error instead of silently faking
a result.

## What's fully wired vs. left as a follow-up

Fully working: file upload with validation, real Whisper transcription with
per-segment timestamps, language auto-detection (including mixed-language
speech, since we never force a `language` param), editable transcript,
real SRT/VTT/TXT generation from actual timestamps, translation and
romanization via LLM calls, Supabase auth (email/password + Google),
per-user transcript history with RLS, and monthly usage-limit enforcement
for signed-in users.

Deliberately left as documented follow-ups rather than faked:

- **Granular processing stages.** The backend does audio handling → STT →
  language detection in a single provider call, so the UI shows real upload
  progress plus a single honest "processing on the server" state rather than
  fabricated intermediate steps. Wiring a job queue (e.g. Supabase Edge
  Functions + a `status` column polled from the client) would let this show
  true per-stage progress for long files.
- **Social-platform URLs** (Instagram/YouTube/etc.). Per the brief, this app
  does not attempt to scrape or bypass another platform's access controls.
  `/api/transcribe` only fetches URLs that point directly at a supported
  media file; anything else returns "URL transcription is currently
  unavailable. Upload your video or audio file instead."
- **Billing.** No fake payment flow is implemented. `LIMITS` in
  `src/lib/config/limits.ts` and the `usage` table are already
  plan-shaped — connecting Stripe or Razorpay means writing a webhook that
  updates a `plan` column and having `enforceUsageLimits()` read it (marked
  with a `TODO` in `src/lib/usage.ts`).
- **Admin configuration UI.** All tunable values already live in one file
  (`src/lib/config/limits.ts`) driven by environment variables, so an admin
  panel would just be a form that writes those env vars / a settings table —
  not built here since it needs its own auth-gating decision.
- **Rate limiting middleware / duplicate-request prevention** beyond the
  monthly usage cap — recommend adding this at the hosting/CDN layer (e.g.
  Vercel's rate limiting, or Upstash Redis) before taking this to production
  with anonymous access enabled.

## Central configuration

Every limit (file duration, monthly counts, max upload size) lives in
`src/lib/config/limits.ts`, sourced from environment variables — nothing is
hard-coded elsewhere. The supported-language list is likewise defined once
there and consumed everywhere else (homepage grid, translation targets, SEO).
