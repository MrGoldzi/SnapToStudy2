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
  GroupMessage,
  ScanResult,
  StudyGroup,
  Subject,
  User,
} from "@/lib/types";

const STORAGE_KEY = "snaptostudy-state-v2";

type State = {
  user: User | null;
  assignments: Assignment[];
  decks: Deck[];
  cards: Flashcard[];
  chat: ChatTurn[];
  scans: ScanResult[];
  groups: StudyGroup[];
  messages: GroupMessage[];
  hydrated: boolean;
};

const defaultState: State = {
  user: null,
  assignments: [],
  decks: [],
  cards: [],
  chat: [],
  scans: [],
  groups: [],
  messages: [],
  hydrated: false,
};

type Ctx = {
  state: State;
  // Auth
  signInGuest: () => User;
  signUpEmail: (name: string, email: string) => User;
  signInEmail: (email: string) => User | null;
  signInGoogle: (name: string, email: string) => User;
  linkGoogle: (email: string) => void;
  unlinkGoogle: () => void;
  updateProfile: (patch: Partial<Pick<User, "name" | "email">>) => void;
  signOut: () => void;
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
  // Groups
  createGroup: (
    g: Omit<StudyGroup, "id" | "createdAt" | "inviteCode" | "members" | "ownerId">,
  ) => StudyGroup;
  joinGroupByCode: (code: string) => StudyGroup | null;
  leaveGroup: (id: string) => void;
  postMessage: (
    groupId: string,
    content: string,
    attachment?: GroupMessage["attachment"],
  ) => GroupMessage;
};

const AppCtx = createContext<Ctx | null>(null);

function genInvite(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

const SAMPLE_PEERS = [
  "Maya Chen",
  "Devon Reyes",
  "Aarav Patel",
  "Lina Kowalski",
  "Sam Okafor",
  "Priya Singh",
  "Noah Brooks",
  "Zara Hassan",
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(defaultState);
  const dirtyRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && raw) {
          const parsed = JSON.parse(raw) as Partial<State>;
          setState({
            user: parsed.user ?? null,
            assignments: parsed.assignments ?? [],
            decks: parsed.decks ?? [],
            cards: parsed.cards ?? [],
            chat: parsed.chat ?? [],
            scans: parsed.scans ?? [],
            groups: parsed.groups ?? [],
            messages: parsed.messages ?? [],
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

  useEffect(() => {
    if (!state.hydrated) return;
    if (!dirtyRef.current) {
      dirtyRef.current = true;
      return;
    }
    const { hydrated: _h, ...toSave } = state;
    void _h;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)).catch(() => {});
  }, [state]);

  // ===== AUTH =====
  const signInGuest: Ctx["signInGuest"] = useCallback(() => {
    const u: User = {
      id: newId(),
      name: "Guest",
      email: "",
      isGuest: true,
      googleLinked: false,
      createdAt: Date.now(),
    };
    setState((s) => ({ ...s, user: u }));
    return u;
  }, []);

  const signUpEmail: Ctx["signUpEmail"] = useCallback((name, email) => {
    const u: User = {
      id: newId(),
      name: name.trim() || "Student",
      email: email.trim().toLowerCase(),
      isGuest: false,
      googleLinked: false,
      createdAt: Date.now(),
    };
    setState((s) => ({ ...s, user: u }));
    return u;
  }, []);

  const signInEmail: Ctx["signInEmail"] = useCallback((email) => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return null;
    const u: User = {
      id: newId(),
      name: trimmed.split("@")[0],
      email: trimmed,
      isGuest: false,
      googleLinked: false,
      createdAt: Date.now(),
    };
    setState((s) => ({ ...s, user: u }));
    return u;
  }, []);

  const signInGoogle: Ctx["signInGoogle"] = useCallback((name, email) => {
    const u: User = {
      id: newId(),
      name: name.trim() || email.split("@")[0],
      email: email.trim().toLowerCase(),
      isGuest: false,
      googleLinked: true,
      createdAt: Date.now(),
    };
    setState((s) => ({ ...s, user: u }));
    return u;
  }, []);

  const linkGoogle: Ctx["linkGoogle"] = useCallback((email) => {
    setState((s) =>
      s.user
        ? {
            ...s,
            user: {
              ...s.user,
              googleLinked: true,
              email: email.trim().toLowerCase() || s.user.email,
            },
          }
        : s,
    );
  }, []);

  const unlinkGoogle: Ctx["unlinkGoogle"] = useCallback(() => {
    setState((s) =>
      s.user ? { ...s, user: { ...s.user, googleLinked: false } } : s,
    );
  }, []);

  const updateProfile: Ctx["updateProfile"] = useCallback((patch) => {
    setState((s) => (s.user ? { ...s, user: { ...s.user, ...patch } } : s));
  }, []);

  const signOut: Ctx["signOut"] = useCallback(() => {
    setState((s) => ({ ...s, user: null }));
  }, []);

  // ===== ASSIGNMENTS =====
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

  const toggleAssignment: Ctx["toggleAssignment"] = useCallback((id) => {
    setState((s) => ({
      ...s,
      assignments: s.assignments.map((a) =>
        a.id === id
          ? {
              ...a,
              done: !a.done,
              completedAt: !a.done ? Date.now() : undefined,
            }
          : a,
      ),
    }));
  }, []);

  const deleteAssignment: Ctx["deleteAssignment"] = useCallback((id) => {
    setState((s) => ({
      ...s,
      assignments: s.assignments.filter((a) => a.id !== id),
    }));
  }, []);

  // ===== DECKS / CARDS =====
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

  const reviewCard: Ctx["reviewCard"] = useCallback((id, quality) => {
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
      return { ...s, cards };
    });
  }, []);

  const deleteCard: Ctx["deleteCard"] = useCallback((id) => {
    setState((s) => ({ ...s, cards: s.cards.filter((c) => c.id !== id) }));
  }, []);

  // ===== CHAT =====
  const addChatTurn: Ctx["addChatTurn"] = useCallback((turn) => {
    const t: ChatTurn = { ...turn, id: newId(), createdAt: Date.now() };
    setState((s) => ({ ...s, chat: [...s.chat, t] }));
    return t;
  }, []);

  const clearChat: Ctx["clearChat"] = useCallback(() => {
    setState((s) => ({ ...s, chat: [] }));
  }, []);

  // ===== SCANS =====
  const addScan: Ctx["addScan"] = useCallback((s) => {
    const scan: ScanResult = { ...s, id: newId(), createdAt: Date.now() };
    setState((st) => ({ ...st, scans: [scan, ...st.scans] }));
    return scan;
  }, []);

  const deleteScan: Ctx["deleteScan"] = useCallback((id) => {
    setState((s) => ({ ...s, scans: s.scans.filter((x) => x.id !== id) }));
  }, []);

  // ===== GROUPS =====
  const createGroup: Ctx["createGroup"] = useCallback((g) => {
    let created!: StudyGroup;
    setState((s) => {
      const me = s.user;
      const myMember = me
        ? { id: me.id, name: me.name || "You", isYou: true as const }
        : { id: "you", name: "You", isYou: true as const };
      created = {
        ...g,
        id: newId(),
        ownerId: me?.id ?? "you",
        inviteCode: genInvite(),
        members: [myMember],
        createdAt: Date.now(),
      };
      return { ...s, groups: [created, ...s.groups] };
    });
    return created;
  }, []);

  const joinGroupByCode: Ctx["joinGroupByCode"] = useCallback((code) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return null;
    let joined: StudyGroup | null = null;
    setState((s) => {
      const existing = s.groups.find((g) => g.inviteCode === trimmed);
      if (existing) {
        joined = existing;
        if (existing.members.some((m) => m.isYou)) return s;
        const me = s.user;
        const myMember = me
          ? { id: me.id, name: me.name || "You", isYou: true as const }
          : { id: "you", name: "You", isYou: true as const };
        return {
          ...s,
          groups: s.groups.map((g) =>
            g.id === existing.id
              ? { ...g, members: [...g.members, myMember] }
              : g,
          ),
        };
      }
      const me = s.user;
      const myMember = me
        ? { id: me.id, name: me.name || "You", isYou: true as const }
        : { id: "you", name: "You", isYou: true as const };
      const peer1 =
        SAMPLE_PEERS[Math.floor(Math.random() * SAMPLE_PEERS.length)];
      const peer2 =
        SAMPLE_PEERS[Math.floor(Math.random() * SAMPLE_PEERS.length)];
      const fresh: StudyGroup = {
        id: newId(),
        name: `Study Circle ${trimmed}`,
        subject: "other",
        description: "Joined via invite code",
        inviteCode: trimmed,
        ownerId: "peer-" + trimmed,
        members: [
          { id: "peer-" + trimmed, name: peer1 },
          { id: "peer2-" + trimmed, name: peer2 },
          myMember,
        ],
        createdAt: Date.now(),
      };
      const greeting: GroupMessage = {
        id: newId(),
        groupId: fresh.id,
        authorId: fresh.ownerId,
        authorName: peer1,
        content: `Welcome${me?.name ? ", " + me.name : ""}! Glad you joined.`,
        createdAt: Date.now(),
      };
      joined = fresh;
      return {
        ...s,
        groups: [fresh, ...s.groups],
        messages: [...s.messages, greeting],
      };
    });
    return joined;
  }, []);

  const leaveGroup: Ctx["leaveGroup"] = useCallback((id) => {
    setState((s) => ({
      ...s,
      groups: s.groups.filter((g) => g.id !== id),
      messages: s.messages.filter((m) => m.groupId !== id),
    }));
  }, []);

  const postMessage: Ctx["postMessage"] = useCallback(
    (groupId, content, attachment) => {
      const me = state.user;
      const msg: GroupMessage = {
        id: newId(),
        groupId,
        authorId: me?.id ?? "you",
        authorName: me?.name || "You",
        content,
        createdAt: Date.now(),
        attachment,
      };
      setState((s) => ({ ...s, messages: [...s.messages, msg] }));
      return msg;
    },
    [state.user],
  );

  const value = useMemo<Ctx>(
    () => ({
      state,
      signInGuest,
      signUpEmail,
      signInEmail,
      signInGoogle,
      linkGoogle,
      unlinkGoogle,
      updateProfile,
      signOut,
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
      createGroup,
      joinGroupByCode,
      leaveGroup,
      postMessage,
    }),
    [
      state,
      signInGuest,
      signUpEmail,
      signInEmail,
      signInGoogle,
      linkGoogle,
      unlinkGoogle,
      updateProfile,
      signOut,
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
      createGroup,
      joinGroupByCode,
      leaveGroup,
      postMessage,
    ],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp(): Ctx {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
