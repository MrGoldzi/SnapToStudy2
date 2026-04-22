# SmartHomework AI

A modern Expo mobile app that helps students aged 10-18 learn faster: scan a homework problem with the camera and get step-by-step solutions, plan deadlines on a unique compass dashboard, generate AI flashcards with spaced repetition, and chat with an AI tutor.

## Architecture

This is a pnpm monorepo with two artifacts:

- **`artifacts/smart-homework`** — the Expo (React Native) mobile app. All app state (assignments, decks, flashcards, chat history, scans, XP/streak) is persisted locally with AsyncStorage. No backend database is used.
- **`artifacts/api-server`** — Express server that proxies AI requests so the OpenAI API key stays server-side. Two endpoints:
  - `POST /api/ai/chat` — Multimodal chat (text + optional image base64) for tutor chat and homework scanning. Uses `gpt-5.4`.
  - `POST /api/ai/flashcards` — Generates a JSON array of flashcards from a topic + optional notes.

The Expo app calls the API via `https://${EXPO_PUBLIC_DOMAIN}/api/...` (the Replit proxy routes `/api` to api-server).

### App structure

```
app/
  (tabs)/
    _layout.tsx          # NativeTabs (iOS 26 liquid glass) with Tabs fallback
    index.tsx            # Compass dashboard (N urgent / E upcoming / S weak / W done)
    scan.tsx             # Camera + gallery picker → AI solver
    plan.tsx             # Filterable deadline planner
    study.tsx            # Flashcard deck list with mastery + due counts
    tutor.tsx            # Inverted chat list with markdown answers
  scan-result.tsx        # Modal: photo + step-by-step AI solution
  assignment/new.tsx     # Modal: create assignment
  assignment/[id].tsx    # Detail + AI hint/plan/concepts buttons
  deck/new.tsx           # Modal: name + topic/notes → AI-generated cards
  deck/[id]/index.tsx    # Deck detail + start review
  deck/[id]/review.tsx   # SM-2 lite spaced repetition session
contexts/AppContext.tsx  # Single AsyncStorage-backed state container
components/              # Card, PrimaryButton, Pressable (haptics), EmptyState,
                         # SubjectChip, ScreenHeader, Markdownish (lightweight md)
lib/                     # api.ts, types.ts (Subject, Assignment, Flashcard, etc), id.ts
constants/colors.ts      # Indigo + amber palette, light + dark
```

### Gamification

Each scan, completed assignment, and flashcard review awards XP. XP rolls into levels (`100 + 50*(level-1)`) and a daily streak that increments on any active day.

### Spaced repetition

A simplified SM-2: each review records a quality score (0/3/5). Wrong answers reset interval to 0 and reduce ease; right answers grow the interval (1d → 3d → ease-multiplied) and tweak ease. The compass "Weak Areas" quadrant aggregates correctness rates per subject.

## AI Integration

OpenAI is wired through Replit AI Integrations — no user-managed API key required. The api-server reads `AI_INTEGRATIONS_OPENAI_BASE_URL` and `AI_INTEGRATIONS_OPENAI_API_KEY` from the environment and POSTs to `${BASE_URL}/chat/completions` directly with `fetch`.

## Notable choices

- **No database.** All persistence is AsyncStorage — keeps the first build lean and offline-friendly.
- **Express body limit raised to 25 MB** so base64 photos can be POSTed.
- **iOS 26 NativeTabs** with classic Tabs fallback for older OS / Android / web.
- **Inter font family** (400/500/600/700) loaded via `@expo-google-fonts/inter`.
- **No emojis** — every icon comes from `@expo/vector-icons` (Feather) or SF Symbols.
