import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { newId } from "@/lib/id";
import {
  Assignment,
  ChatTurn,
  Deck,
  Flashcard,
  ScanResult,
  Stats,
  Subject,
  dayDiff,
  todayKey,
} from "@/lib/types";

const STORAGE_KEY = "smart-homework-state-v1";

type State = {
  assignments: Assignment[];
  decks: Deck[];
  cards: Flashcard[];
  chat: ChatTurn[];
  scans: ScanResult[];
  stats: Stats;
  hydrated: boolean;
};

const defaultState: State = {
  assignments: [],
  decks: [],
  cards: [],
  chat: [],
  scans: [],
  stats: { xp: 0, level: 1, streak: 0, lastActiveDay: "" },
  hydrated: false,
};

type Ctx = {
  state: State;
  // Assignments
  addAssignment: (a: Omit<Assignment, "id" | "createdAt" | "done">) => Assignment;
  updateAssignment: (id: string, patch: Partial<Assignment>) => void;
  toggleAssignment: (id: string) => void;
  deleteAssignment: (id: string) => void;
  // Decks + cards
  addDeck: (name: string, subject: Subject) => Deck;
  deleteDeck: (id: string) => void;
  addCards: (
    deckId: string,
    cards: Array<{ question: string; answer: string }>,
  ) => Flashcard[];
  reviewCard: (id: string, quality: 0 | 3 | 5) => void;
  deleteCard: (id: string) => void;
  // Chat
  addChatTurn: (turn: Omit<ChatTurn, "id" | "createdAt">) => ChatTurn;
  clearChat: () => void;
  // Scans
  addScan: (s: Omit<ScanResult, "id" | "createdAt">) => ScanResult;
  deleteScan: (id: string) => void;
  // XP
  awardXp: (amount: number) => void;
};

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(defaultState);
  const dirtyRef = useRef(false);

  // Hydrate
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && raw) {
          const parsed = JSON.parse(raw) as Partial<State>;
          setState({
            assignments: parsed.assignments ?? [],
            decks: parsed.decks ?? [],
            cards: parsed.cards ?? [],
            chat: parsed.chat ?? [],
            scans: parsed.scans ?? [],
            stats:
              parsed.stats ?? {
                xp: 0,
                level: 1,
                streak: 0,
                lastActiveDay: "",
              },
            hydrated: true,
          });
        } else if (!cancelled) {
          setState((s) => ({ ...s, hydrated: true }));
        }
      } catch {
        if (!cancelled) setState((s) => ({ ...s, hydrated: true }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist
  useEffect(() => {
    if (!state.hydrated) return;
    if (!dirtyRef.current) {
      dirtyRef.current = true;
      return;
    }
    const toSave = { ...state, hydrated: undefined };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)).catch(() => {});
  }, [state]);

  const updateStreak = useCallback((s: State): State => {
    const today = todayKey();
    if (s.stats.lastActiveDay === today) return s;
    const diff = s.stats.lastActiveDay
      ? dayDiff(today, s.stats.lastActiveDay)
      : 0;
    let streak = s.stats.streak;
    if (!s.stats.lastActiveDay) streak = 1;
    else if (diff === 1) streak = streak + 1;
    else if (diff > 1) streak = 1;
    return {
      ...s,
      stats: { ...s.stats, streak, lastActiveDay: today },
    };
  }, []);

  const awardXp = useCallback(
    (amount: number) => {
      setState((s) => {
        const xp = s.stats.xp + amount;
        let level = 1;
        let remaining = xp;
        const need = (l: number) => 100 + (l - 1) * 50;
        while (remaining >= need(level)) {
          remaining -= need(level);
          level += 1;
        }
        const next = updateStreak({
          ...s,
          stats: { ...s.stats, xp, level },
        });
        return next;
      });
    },
    [updateStreak],
  );

  const addAssignment: Ctx["addAssignment"] = useCallback((a) => {
    const newA: Assignment = {
      ...a,
      id: newId(),
      createdAt: Date.now(),
      done: false,
    };
    setState((s) => ({ ...s, assignments: [...s.assignments, newA] }));
    return newA;
  }, []);

  const updateAssignment: Ctx["updateAssignment"] = useCallback((id, patch) => {
    setState((s) => ({
      ...s,
      assignments: s.assignments.map((a) =>
        a.id === id ? { ...a, ...patch } : a,
      ),
    }));
  }, []);

  const toggleAssignment: Ctx["toggleAssignment"] = useCallback(
    (id) => {
      setState((s) => {
        const next = s.assignments.map((a) =>
          a.id === id
            ? {
                ...a,
                done: !a.done,
                completedAt: !a.done ? Date.now() : undefined,
              }
            : a,
        );
        const target = s.assignments.find((a) => a.id === id);
        const justCompleted = target && !target.done;
        const xpDelta = justCompleted ? 25 : 0;
        let updated: State = { ...s, assignments: next };
        if (xpDelta > 0) {
          const xp = updated.stats.xp + xpDelta;
          let level = 1;
          let remaining = xp;
          const need = (l: number) => 100 + (l - 1) * 50;
          while (remaining >= need(level)) {
            remaining -= need(level);
            level += 1;
          }
          updated = { ...updated, stats: { ...updated.stats, xp, level } };
          updated = updateStreak(updated);
        }
        return updated;
      });
    },
    [updateStreak],
  );

  const deleteAssignment: Ctx["deleteAssignment"] = useCallback((id) => {
    setState((s) => ({
      ...s,
      assignments: s.assignments.filter((a) => a.id !== id),
    }));
  }, []);

  const addDeck: Ctx["addDeck"] = useCallback((name, subject) => {
    const deck: Deck = { id: newId(), name, subject, createdAt: Date.now() };
    setState((s) => ({ ...s, decks: [...s.decks, deck] }));
    return deck;
  }, []);

  const deleteDeck: Ctx["deleteDeck"] = useCallback((id) => {
    setState((s) => ({
      ...s,
      decks: s.decks.filter((d) => d.id !== id),
      cards: s.cards.filter((c) => c.deckId !== id),
    }));
  }, []);

  const addCards: Ctx["addCards"] = useCallback((deckId, cards) => {
    const now = Date.now();
    const newCards: Flashcard[] = cards.map((c) => ({
      id: newId(),
      deckId,
      question: c.question,
      answer: c.answer,
      ease: 2.5,
      interval: 0,
      dueAt: now,
      reviews: 0,
      correct: 0,
    }));
    setState((s) => ({ ...s, cards: [...s.cards, ...newCards] }));
    return newCards;
  }, []);

  // SM-2 lite spaced repetition
  const reviewCard: Ctx["reviewCard"] = useCallback(
    (id, quality) => {
      setState((s) => {
        const cards = s.cards.map((c) => {
          if (c.id !== id) return c;
          let { ease, interval } = c;
          if (quality < 3) {
            interval = 0;
            ease = Math.max(1.3, ease - 0.2);
          } else {
            if (interval === 0) interval = 1;
            else if (interval === 1) interval = 3;
            else interval = Math.round(interval * ease);
            ease = Math.max(
              1.3,
              ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
            );
          }
          const dueAt = Date.now() + interval * 86400000;
          return {
            ...c,
            ease,
            interval,
            dueAt,
            lastReviewedAt: Date.now(),
            reviews: c.reviews + 1,
            correct: c.correct + (quality >= 3 ? 1 : 0),
          };
        });
        let next: State = { ...s, cards };
        const xpDelta = quality >= 3 ? 5 : 2;
        const xp = next.stats.xp + xpDelta;
        let level = 1;
        let remaining = xp;
        const need = (l: number) => 100 + (l - 1) * 50;
        while (remaining >= need(level)) {
          remaining -= need(level);
          level += 1;
        }
        next = { ...next, stats: { ...next.stats, xp, level } };
        next = updateStreak(next);
        return next;
      });
    },
    [updateStreak],
  );

  const deleteCard: Ctx["deleteCard"] = useCallback((id) => {
    setState((s) => ({ ...s, cards: s.cards.filter((c) => c.id !== id) }));
  }, []);

  const addChatTurn: Ctx["addChatTurn"] = useCallback((turn) => {
    const t: ChatTurn = { ...turn, id: newId(), createdAt: Date.now() };
    setState((s) => ({ ...s, chat: [...s.chat, t] }));
    return t;
  }, []);

  const clearChat: Ctx["clearChat"] = useCallback(() => {
    setState((s) => ({ ...s, chat: [] }));
  }, []);

  const addScan: Ctx["addScan"] = useCallback((s) => {
    const scan: ScanResult = { ...s, id: newId(), createdAt: Date.now() };
    setState((st) => ({ ...st, scans: [scan, ...st.scans] }));
    return scan;
  }, []);

  const deleteScan: Ctx["deleteScan"] = useCallback((id) => {
    setState((s) => ({ ...s, scans: s.scans.filter((x) => x.id !== id) }));
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      state,
      addAssignment,
      updateAssignment,
      toggleAssignment,
      deleteAssignment,
      addDeck,
      deleteDeck,
      addCards,
      reviewCard,
      deleteCard,
      addChatTurn,
      clearChat,
      addScan,
      deleteScan,
      awardXp,
    }),
    [
      state,
      addAssignment,
      updateAssignment,
      toggleAssignment,
      deleteAssignment,
      addDeck,
      deleteDeck,
      addCards,
      reviewCard,
      deleteCard,
      addChatTurn,
      clearChat,
      addScan,
      deleteScan,
      awardXp,
    ],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp(): Ctx {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
