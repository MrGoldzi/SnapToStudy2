import { Platform } from "react-native";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder as useExpoAudioRecorder,
  useAudioPlayer,
} from "expo-audio";

export type RecorderHandle = {
  start: () => Promise<void>;
  stop: () => Promise<{ base64: string; mimeType: string } | null>;
  isRecording: () => boolean;
};

async function fileUriToBase64(uri: string): Promise<string> {
  const res = await fetch(uri);
  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const r = reader.result as string;
      const i = r.indexOf(",");
      resolve(i >= 0 ? r.slice(i + 1) : r);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function createWebRecorder(): RecorderHandle {
  let mediaRecorder: MediaRecorder | null = null;
  let chunks: Blob[] = [];
  let activeStream: MediaStream | null = null;
  let recording = false;
  let mimeType = "audio/webm";

  return {
    async start() {
      chunks = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      activeStream = stream;
      // Choose a supported mime
      const candidates = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg;codecs=opus",
      ];
      const supported =
        candidates.find((m) =>
          typeof MediaRecorder !== "undefined" &&
          (MediaRecorder as any).isTypeSupported &&
          (MediaRecorder as any).isTypeSupported(m),
        ) || "";
      mimeType = supported || "audio/webm";
      mediaRecorder = supported
        ? new MediaRecorder(stream, { mimeType: supported })
        : new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      mediaRecorder.start();
      recording = true;
    },
    async stop() {
      if (!mediaRecorder) return null;
      const mr = mediaRecorder;
      const finalMime = mr.mimeType || mimeType;
      const result = await new Promise<Blob>((resolve) => {
        mr.onstop = () => resolve(new Blob(chunks, { type: finalMime }));
        mr.stop();
      });
      activeStream?.getTracks().forEach((t) => t.stop());
      activeStream = null;
      mediaRecorder = null;
      recording = false;
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const r = reader.result as string;
          const i = r.indexOf(",");
          resolve(i >= 0 ? r.slice(i + 1) : r);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(result);
      });
      return { base64, mimeType: finalMime };
    },
    isRecording: () => recording,
  };
}

export {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useExpoAudioRecorder,
  useAudioPlayer,
  fileUriToBase64,
};

export const isWeb = Platform.OS === "web";
