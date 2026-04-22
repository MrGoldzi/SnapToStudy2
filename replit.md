# SnapToStudy

A calm, focused Expo (React Native) study app for students aged 10–18. Snap a homework problem with the camera, learn concepts with an AI tutor, build flashcard decks with spaced repetition, and join study groups with chat and resource sharing — all wrapped in a dark, electric-blue aesthetic.

## Architecture

pnpm monorepo with two artifacts:

- **`artifacts/smart-homework`** (the SnapToStudy mobile app) — Expo + Expo Router. All app state (user account, decks, cards, scans, chat, study groups, messages) is persisted locally with AsyncStorage. No remote database.
- **`artifacts/api-server`** — Express server that proxies AI requests so the OpenAI key stays server-side.
  - `POST /api/ai/chat` — multimodal chat (text + optional image base64) for the tutor and scanner.
  - `POST /api/ai/flashcards` — generates JSON flashcards from a topic + notes.

The app calls these via `https://${EXPO_PUBLIC_DOMAIN}/api/...` (Replit proxy routes `/api` to api-server).

### Auth

- **Welcome → Sign In / Sign Up / Continue as Guest / Continue with Google** all in `app/(auth)/`.
- Auth state is gated in the root `_layout.tsx` via `useSegments` + `router.replace`: signed-out users are forced into `(auth)`, signed-in users are forced into `(tabs)`.
- "Continue with Google" presents an in-app sheet that captures the Google name + email and stores `googleLinked: true` on the user. This is a transparent local stand-in for full Google OAuth (which requires a real Google client ID); the rest of the app respects the linked status (Profile shows "Connected", "Disconnect" available).

### App structure

```
app/
  (auth)/
    _layout.tsx
    welcome.tsx     # hero + glowing orb + Get Started / Sign In / Continue as Guest
    sign-in.tsx     # Google + email/password
    sign-up.tsx     # Google + name/email/password
  (tabs)/
    _layout.tsx     # 5 tabs: Home, Scan, Study, Groups, Profile (NativeTabs on iOS 26+)
    index.tsx       # Greeting + glowing orb (→ tutor) + quick chips + today's tasks + recent scans + sticky "Ask anything"
    scan.tsx        # Camera-first big shutter + gallery picker + recent scans
    study.tsx       # AI Study Modes (concept / practice / quiz / summarize) + deck list
    groups.tsx      # Study groups list + Create / Join with code
    profile.tsx     # User card + stats + Google connection + settings + Sign out
  tutor.tsx         # Modal: AI chat with markdown answers, auto-sends queued user prompt
  scan-result.tsx   # Modal: photo + step-by-step solution
  assignment/new.tsx, assignment/[id].tsx
  deck/new.tsx, deck/[id]/index.tsx, deck/[id]/review.tsx
  group/new.tsx, group/join.tsx, group/[id].tsx  # group chat + share decks/scans + invite code modal
contexts/AppContext.tsx  # AsyncStorage-backed state: user, assignments, decks, cards, chat, scans, groups, messages
components/              # Card, PrimaryButton, Pressable (haptics), EmptyState, SubjectChip, ScreenHeader,
                         # Markdownish, GlowingOrb (svg rings + halo), GoogleAuthSheet
lib/                     # api.ts, types.ts (User, Assignment, Flashcard, Deck, ChatTurn, ScanResult, StudyGroup, GroupMessage), id.ts
constants/colors.ts      # Dark navy (#070b1a) + electric blue (#3b82f6) palette (single dark theme)
```

### Study Groups

- Create a group (name + subject + description) → generates a 6-character invite code.
- Join with code → if a local group has that code you join it; otherwise a fresh "Study Circle <CODE>" is created with two simulated peers and a welcome message so the chat feels alive immediately.
- Group chat: text messages, share a deck or recent scan via the paperclip → bottom sheet, info modal shows the invite code (with copy) + member list + Leave group.

### Spaced repetition

Simplified SM-2: each review records 0/3/5 quality. Wrong answers reset interval and reduce ease; right answers grow the interval (1d → 3d → ease-multiplied) and tweak ease.

### What's intentionally not here

- **No gamification.** No XP, no streaks, no levels, no badges.
- **No remote DB.** Everything lives on-device for a private, offline-friendly experience.
- **No emojis.** All icons come from `@expo/vector-icons` (Feather) or SF Symbols.

## AI Integration

Wired through Replit AI Integrations — no user-managed API key. The api-server reads `AI_INTEGRATIONS_OPENAI_BASE_URL` and `AI_INTEGRATIONS_OPENAI_API_KEY` and POSTs to `${BASE_URL}/chat/completions`.
