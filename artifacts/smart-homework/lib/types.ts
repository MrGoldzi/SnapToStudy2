export type Subject =
  | "math"
  | "science"
  | "english"
  | "history"
  | "language"
  | "art"
  | "physics"
  | "biology"
  | "chemistry"
  | "other";

export const SUBJECTS: { key: Subject; label: string; icon: string }[] = [
  { key: "math", label: "Math", icon: "hash" },
  { key: "physics", label: "Physics", icon: "zap" },
  { key: "chemistry", label: "Chemistry", icon: "droplet" },
  { key: "biology", label: "Biology", icon: "thermometer" },
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
  dueAt: number;
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
  ease: number;
  interval: number;
  dueAt: number;
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

export type User = {
  id: string;
  name: string;
  email: string;
  isGuest: boolean;
  googleLinked: boolean;
  createdAt: number;
};

export type StudyGroup = {
  id: string;
  name: string;
  subject: Subject;
  description?: string;
  inviteCode: string;
  members: { id: string; name: string; isYou?: boolean }[];
  createdAt: number;
  ownerId: string;
};

export type GroupMessage = {
  id: string;
  groupId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: number;
  attachment?: { kind: "deck" | "scan"; refId: string; label: string };
};

export function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
