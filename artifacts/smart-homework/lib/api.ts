const baseDomain = process.env.EXPO_PUBLIC_DOMAIN;

function apiUrl(path: string): string {
  if (!baseDomain) {
    return `/api${path}`;
  }
  return `https://${baseDomain}/api${path}`;
}

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function aiChat(opts: {
  messages: ChatMessage[];
  imageBase64?: string | null;
  imageMimeType?: string | null;
  systemPrompt?: string | null;
  maxTokens?: number | null;
}): Promise<string> {
  const res = await fetch(apiUrl("/ai/chat"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
  });
  if (!res.ok) {
    throw new Error(`AI request failed (${res.status})`);
  }
  const data = (await res.json()) as { content?: string };
  return data.content ?? "";
}

export async function aiTranscribe(opts: {
  audioBase64: string;
  mimeType?: string;
}): Promise<string> {
  const res = await fetch(apiUrl("/ai/transcribe"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
  });
  if (!res.ok) throw new Error(`Transcribe failed (${res.status})`);
  const data = (await res.json()) as { text?: string };
  return data.text ?? "";
}

export async function aiTts(opts: {
  text: string;
  voice?: string;
}): Promise<{ audioBase64: string; mimeType: string }> {
  const res = await fetch(apiUrl("/ai/tts"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
  });
  if (!res.ok) throw new Error(`TTS failed (${res.status})`);
  const data = (await res.json()) as { audioBase64?: string; mimeType?: string };
  return {
    audioBase64: data.audioBase64 ?? "",
    mimeType: data.mimeType ?? "audio/mp3",
  };
}

export async function aiFlashcards(opts: {
  topic?: string;
  notes?: string;
  count?: number;
}): Promise<Array<{ question: string; answer: string }>> {
  const res = await fetch(apiUrl("/ai/flashcards"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
  });
  if (!res.ok) {
    throw new Error(`Flashcard request failed (${res.status})`);
  }
  const data = (await res.json()) as {
    cards?: Array<{ question: string; answer: string }>;
  };
  return data.cards ?? [];
}
