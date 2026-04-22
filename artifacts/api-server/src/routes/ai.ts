import { Router, type IRouter } from "express";

const router: IRouter = Router();

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type AiRequestBody = {
  messages?: ChatMessage[];
  imageBase64?: string | null;
  imageMimeType?: string | null;
  systemPrompt?: string | null;
  maxTokens?: number | null;
};

router.post("/ai/chat", async (req, res) => {
  const baseUrl = process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"];
  const apiKey = process.env["AI_INTEGRATIONS_OPENAI_API_KEY"];

  if (!baseUrl || !apiKey) {
    res.status(500).json({ error: "AI integration not configured" });
    return;
  }

  const body = (req.body ?? {}) as AiRequestBody;
  const incoming = Array.isArray(body.messages) ? body.messages : [];
  const systemPrompt =
    body.systemPrompt ??
    "You are SmartHomework AI, a friendly, patient tutor for students aged 10-18. Always explain your reasoning step by step in clear, simple language. Use short paragraphs, bullet lists when helpful, and numbered steps for problem solving. Be encouraging and never condescending. When solving math, show every step. When working on writing, give targeted, actionable suggestions.";

  const upstreamMessages: Array<Record<string, unknown>> = [
    { role: "system", content: systemPrompt },
  ];

  for (let i = 0; i < incoming.length; i++) {
    const m = incoming[i];
    if (!m || typeof m.content !== "string") continue;
    const isLastUser =
      i === incoming.length - 1 &&
      m.role === "user" &&
      typeof body.imageBase64 === "string" &&
      body.imageBase64.length > 0;

    if (isLastUser) {
      const mime = body.imageMimeType ?? "image/jpeg";
      upstreamMessages.push({
        role: "user",
        content: [
          { type: "text", text: m.content || "Please help me with this." },
          {
            type: "image_url",
            image_url: {
              url: `data:${mime};base64,${body.imageBase64}`,
            },
          },
        ],
      });
    } else {
      upstreamMessages.push({ role: m.role, content: m.content });
    }
  }

  // If no messages but image provided, still allow scanning
  if (
    incoming.length === 0 &&
    typeof body.imageBase64 === "string" &&
    body.imageBase64.length > 0
  ) {
    const mime = body.imageMimeType ?? "image/jpeg";
    upstreamMessages.push({
      role: "user",
      content: [
        {
          type: "text",
          text: "This is a photo of homework. Identify each problem you can see. For each problem, give a clear step-by-step solution and a short concept explanation. If it's an essay/writing task, give a structured plan and 3 improvement tips. Format with markdown headings per problem.",
        },
        {
          type: "image_url",
          image_url: { url: `data:${mime};base64,${body.imageBase64}` },
        },
      ],
    });
  }

  try {
    const upstreamRes = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5.4",
        max_completion_tokens: body.maxTokens ?? 4096,
        messages: upstreamMessages,
      }),
    });

    if (!upstreamRes.ok) {
      const text = await upstreamRes.text();
      req.log.error({ status: upstreamRes.status, text }, "AI upstream error");
      res.status(502).json({ error: "AI request failed", detail: text });
      return;
    }

    const data = (await upstreamRes.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content ?? "";
    res.json({ content });
  } catch (err) {
    req.log.error({ err }, "AI chat error");
    res.status(500).json({ error: "AI request failed" });
  }
});

type FlashcardRequestBody = {
  topic?: string;
  notes?: string;
  count?: number;
};

router.post("/ai/flashcards", async (req, res) => {
  const baseUrl = process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"];
  const apiKey = process.env["AI_INTEGRATIONS_OPENAI_API_KEY"];
  if (!baseUrl || !apiKey) {
    res.status(500).json({ error: "AI integration not configured" });
    return;
  }
  const body = (req.body ?? {}) as FlashcardRequestBody;
  const topic = (body.topic ?? "").toString().slice(0, 200);
  const notes = (body.notes ?? "").toString().slice(0, 4000);
  const count = Math.max(3, Math.min(20, Number(body.count ?? 8)));
  if (!topic && !notes) {
    res.status(400).json({ error: "topic or notes required" });
    return;
  }

  const prompt = `Create ${count} high-quality study flashcards${topic ? ` about: ${topic}` : ""}${
    notes ? `\n\nBased on these notes:\n${notes}` : ""
  }.\n\nReturn ONLY a JSON array. Each item: {"question": string, "answer": string}. Keep questions concise. Keep answers short (1-3 sentences). No markdown, no commentary, just the JSON array.`;

  try {
    const upstreamRes = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5.4",
        max_completion_tokens: 2048,
        messages: [
          {
            role: "system",
            content:
              "You output only valid JSON arrays of flashcard objects. No prose.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!upstreamRes.ok) {
      const text = await upstreamRes.text();
      req.log.error({ status: upstreamRes.status, text }, "AI flashcards error");
      res.status(502).json({ error: "AI request failed" });
      return;
    }
    const data = (await upstreamRes.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content ?? "[]";
    let cards: Array<{ question: string; answer: string }> = [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        cards = parsed;
      } else if (parsed && Array.isArray(parsed.flashcards)) {
        cards = parsed.flashcards;
      } else if (parsed && Array.isArray(parsed.cards)) {
        cards = parsed.cards;
      } else {
        // Look for any array value
        for (const v of Object.values(parsed)) {
          if (Array.isArray(v)) {
            cards = v as Array<{ question: string; answer: string }>;
            break;
          }
        }
      }
    } catch {
      cards = [];
    }
    cards = cards
      .filter(
        (c) =>
          c &&
          typeof c.question === "string" &&
          typeof c.answer === "string" &&
          c.question.trim().length > 0 &&
          c.answer.trim().length > 0,
      )
      .slice(0, count);
    res.json({ cards });
  } catch (err) {
    req.log.error({ err }, "AI flashcards error");
    res.status(500).json({ error: "AI request failed" });
  }
});

// ====== VOICE / AUDIO ======

type TranscribeBody = {
  audioBase64?: string;
  mimeType?: string;
};

router.post("/ai/transcribe", async (req, res) => {
  const baseUrl = process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"];
  const apiKey = process.env["AI_INTEGRATIONS_OPENAI_API_KEY"];
  if (!baseUrl || !apiKey) {
    res.status(500).json({ error: "AI integration not configured" });
    return;
  }
  const body = (req.body ?? {}) as TranscribeBody;
  if (!body.audioBase64) {
    res.status(400).json({ error: "audioBase64 required" });
    return;
  }
  const mime = body.mimeType || "audio/webm";
  let ext = "webm";
  if (mime.includes("mp4") || mime.includes("m4a")) ext = "mp4";
  else if (mime.includes("wav")) ext = "wav";
  else if (mime.includes("mpeg") || mime.includes("mp3")) ext = "mp3";
  else if (mime.includes("ogg")) ext = "ogg";

  try {
    const audioBuffer = Buffer.from(body.audioBase64, "base64");
    const blob = new Blob([new Uint8Array(audioBuffer)], { type: mime });
    const form = new FormData();
    form.append("file", blob, `audio.${ext}`);
    form.append("model", "gpt-4o-mini-transcribe");

    const upstreamRes = await fetch(`${baseUrl}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
    if (!upstreamRes.ok) {
      const text = await upstreamRes.text();
      req.log.error({ status: upstreamRes.status, text }, "Transcribe error");
      res.status(502).json({ error: "Transcription failed" });
      return;
    }
    const data = (await upstreamRes.json()) as { text?: string };
    res.json({ text: data.text ?? "" });
  } catch (err) {
    req.log.error({ err }, "Transcribe error");
    res.status(500).json({ error: "Transcription failed" });
  }
});

type TtsBody = { text?: string; voice?: string };

router.post("/ai/tts", async (req, res) => {
  const baseUrl = process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"];
  const apiKey = process.env["AI_INTEGRATIONS_OPENAI_API_KEY"];
  if (!baseUrl || !apiKey) {
    res.status(500).json({ error: "AI integration not configured" });
    return;
  }
  const body = (req.body ?? {}) as TtsBody;
  const text = (body.text ?? "").toString().slice(0, 4000).trim();
  if (!text) {
    res.status(400).json({ error: "text required" });
    return;
  }
  const voice = (body.voice as
    | "alloy"
    | "echo"
    | "fable"
    | "onyx"
    | "nova"
    | "shimmer"
    | undefined) || "nova";

  try {
    const upstreamRes = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-audio",
        modalities: ["text", "audio"],
        audio: { voice, format: "mp3" },
        messages: [
          {
            role: "system",
            content:
              "You are a friendly tutor reading aloud. Speak the text verbatim, in a warm encouraging tone.",
          },
          { role: "user", content: `Read this aloud: ${text}` },
        ],
      }),
    });
    if (!upstreamRes.ok) {
      const errText = await upstreamRes.text();
      req.log.error({ status: upstreamRes.status, errText }, "TTS error");
      res.status(502).json({ error: "TTS failed" });
      return;
    }
    const data = (await upstreamRes.json()) as {
      choices?: Array<{
        message?: { audio?: { data?: string; transcript?: string } };
      }>;
    };
    const audioBase64 = data.choices?.[0]?.message?.audio?.data ?? "";
    res.json({ audioBase64, mimeType: "audio/mp3" });
  } catch (err) {
    req.log.error({ err }, "TTS error");
    res.status(500).json({ error: "TTS failed" });
  }
});

export default router;
