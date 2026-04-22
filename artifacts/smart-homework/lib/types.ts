export type Subject =
  | "math"
  | "science"
  | "english"
  | "history"
  | "language"
  | "art"
  | "other";

export const SUBJECTS: { key: Subject; label: string; icon: string }[] = [
  { key: "math", label: "Math", icon: "hash" },
  { key: "science", label: "Science", icon: "thermometer" },
  { key: "english", label: "English", icon: "book-open" },
  { key: "history", label: "History", icon: "clock" },
  { key: "language", label: "Language", icon: "globe" },
  { key: "art", label: "Art", icon: "feather" },
  { key: "other", label: "Other", icon: "folder" },
];

export type Assignment = {
  id: string;
  title: string;
  subject: Subject;
  dueAt: number; // ms timestamp
  notes?: string;
  done: boolean;
  createdAt: number;
  completedAt?: number;
};

export type Flashcard = {
  id: string;
  question: string;
  answer: string;
  deckId: string;
  // Spaced repetition fields
  ease: number; // 2.5 default
  interval: number; // days
  dueAt: number; // ms
  lastReviewedAt?: number;
  reviews: number;
  correct: number;
};

export type Deck = {
  id: string;
  name: string;
  subject: Subject;
  createdAt: number;
};

export type ChatTurn = {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUri?: string;
  createdAt: number;
};

export type ScanResult = {
  id: string;
  imageUri: string;
  content: string;
  createdAt: number;
};

export type Stats = {
  xp: number;
  level: number;
  streak: number;
  lastActiveDay: string; // YYYY-MM-DD
};

export function xpForLevel(level: number): number {
  return 100 + (level - 1) * 50;
}

export function levelFromXp(xp: number): { level: number; intoLevel: number; needed: number } {
  let level = 1;
  let remaining = xp;
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level += 1;
  }
  return { level, intoLevel: remaining, needed: xpForLevel(level) };
}

export function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function dayDiff(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const da = Date.UTC(ay, am - 1, ad);
  const db = Date.UTC(by, bm - 1, bd);
  return Math.round((da - db) / (1000 * 60 * 60 * 24));
}
