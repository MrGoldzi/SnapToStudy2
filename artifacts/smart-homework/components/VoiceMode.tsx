import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable as RNPressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlowingOrb, type OrbState } from "@/components/GlowingOrb";
import { Pressable } from "@/components/Pressable";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { aiChat, aiTranscribe, aiTts, type ChatMessage } from "@/lib/api";
import {
  createWebRecorder,
  fileUriToBase64,
  isWeb,
  RecordingPresets,
  setAudioModeAsync,
  AudioModule,
  useAudioPlayer,
  useExpoAudioRecorder,
} from "@/lib/audioRecorder";

type Props = {
  visible: boolean;
  onClose: () => void;
  context?: string | null;
  title?: string;
};

const STATE_LABEL: Record<OrbState, string> = {
  idle: "Tap to talk",
  listening: "Listening… tap to send",
  processing: "Thinking…",
  speaking: "Speaking",
};

export function VoiceMode({ visible, onClose, context, title = "Voice Tutor" }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state, addChatTurn } = useApp();

  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [transcript, setTranscript] = useState<string>("");
  const [reply, setReply] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Native recorder (expo-audio)
  const nativeRecorder = useExpoAudioRecorder(RecordingPresets.HIGH_QUALITY);
  // Web recorder ref
  const webRecorderRef = useRef<ReturnType<typeof createWebRecorder> | null>(null);

  // Audio player for TTS playback (data URI source)
  const [audioSource, setAudioSource] = useState<{ uri: string } | null>(null);
  const player = useAudioPlayer(audioSource);

  // Stop / cleanup on close
  useEffect(() => {
    if (!visible) {
      setOrbState("idle");
      setTranscript("");
      setReply("");
      setError(null);
      try {
        if (isWeb) {
          void webRecorderRef.current?.stop();
          webRecorderRef.current = null;
        } else if (nativeRecorder.isRecording) {
          void nativeRecorder.stop();
        }
      } catch {}
      try {
        player.pause();
      } catch {}
    }
  }, [visible, nativeRecorder, player]);

  // Track playback end → idle
  useEffect(() => {
    if (orbState !== "speaking") return;
    const id = setInterval(() => {
      const isPlaying =
        (player as any)?.playing === true || (player as any)?.isPlaying === true;
      const dur = (player as any)?.duration ?? 0;
      const cur = (player as any)?.currentTime ?? 0;
      if (!isPlaying && dur > 0 && cur >= dur - 0.1) {
        setOrbState("idle");
      }
    }, 350);
    return () => clearInterval(id);
  }, [orbState, player]);

  const requestAndPrepare = useCallback(async () => {
    if (isWeb) return true;
    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) {
        setError("Microphone permission denied.");
        return false;
      }
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Audio setup failed");
      return false;
    }
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setTranscript("");
    setReply("");
    try {
      if (isWeb) {
        webRecorderRef.current = createWebRecorder();
        await webRecorderRef.current.start();
      } else {
        const ok = await requestAndPrepare();
        if (!ok) return;
        await nativeRecorder.prepareToRecordAsync();
        nativeRecorder.record();
      }
      setOrbState("listening");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Couldn't access the microphone.",
      );
      setOrbState("idle");
    }
  }, [nativeRecorder, requestAndPrepare]);

  const stopAndProcess = useCallback(async () => {
    setOrbState("processing");
    let audioBase64 = "";
    let mimeType = "audio/webm";
    try {
      if (isWeb) {
        const result = await webRecorderRef.current?.stop();
        webRecorderRef.current = null;
        if (!result) {
          setOrbState("idle");
          return;
        }
        audioBase64 = result.base64;
        mimeType = result.mimeType;
      } else {
        await nativeRecorder.stop();
        const uri = nativeRecorder.uri;
        if (!uri) {
          setOrbState("idle");
          return;
        }
        audioBase64 = await fileUriToBase64(uri);
        // expo-audio default high quality is m4a on iOS / mp4 on Android
        mimeType = Platform.OS === "ios" ? "audio/mp4" : "audio/mp4";
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Couldn't read recorded audio.",
      );
      setOrbState("idle");
      return;
    }

    try {
      const text = await aiTranscribe({ audioBase64, mimeType });
      const userText = text.trim();
      if (!userText) {
        setError("I didn't catch that. Try again.");
        setOrbState("idle");
        return;
      }
      setTranscript(userText);
      addChatTurn({ role: "user", content: userText });

      // Build chat history with context system prompt
      const history: ChatMessage[] = [];
      const recent = state.chat.slice(-8);
      for (const t of recent) {
        history.push({ role: t.role, content: t.content });
      }
      history.push({ role: "user", content: userText });

      const systemPrompt = `You are SmartHomework AI, a warm and concise voice tutor. Reply in 1-3 short conversational sentences. No markdown, no bullet points - this answer will be read aloud.${context ? `\n\nContext the student is asking about:\n${context}` : ""}`;

      const replyText = await aiChat({
        messages: history,
        systemPrompt,
        maxTokens: 600,
      });
      setReply(replyText);
      addChatTurn({ role: "assistant", content: replyText });

      // Generate TTS
      const tts = await aiTts({ text: replyText, voice: "nova" });
      if (!tts.audioBase64) {
        setOrbState("idle");
        return;
      }
      const dataUri = `data:${tts.mimeType};base64,${tts.audioBase64}`;
      setAudioSource({ uri: dataUri });
      setOrbState("speaking");
      // Slight delay so the player picks up the new source
      setTimeout(() => {
        try {
          (player as any).seekTo?.(0);
          player.play();
        } catch {}
      }, 60);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Voice request failed. Please try again.",
      );
      setOrbState("idle");
    }
  }, [addChatTurn, context, nativeRecorder, player, state.chat]);

  const onTapMain = useCallback(() => {
    if (orbState === "idle") {
      void startRecording();
    } else if (orbState === "listening") {
      void stopAndProcess();
    } else if (orbState === "speaking") {
      try {
        player.pause();
      } catch {}
      setOrbState("idle");
    }
  }, [orbState, player, startRecording, stopAndProcess]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.scrim,
          { backgroundColor: colors.background },
        ]}
      >
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {title}
          </Text>
          <RNPressable
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            hitSlop={10}
          >
            <Feather name="x" size={18} color={colors.foreground} />
          </RNPressable>
        </View>

        <View style={styles.body}>
          <Pressable
            haptic="medium"
            onPress={onTapMain}
            disabled={orbState === "processing"}
            style={({ pressed }) => [
              styles.orbWrap,
              { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
            ]}
          >
            <GlowingOrb maxFraction={0.62} maxSize={280} state={orbState} />
          </Pressable>

          <View style={styles.statusWrap}>
            {orbState === "processing" ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : null}
            <Text style={[styles.status, { color: colors.foreground }]}>
              {STATE_LABEL[orbState]}
            </Text>
            {error ? (
              <Text style={[styles.errorText, { color: colors.destructive }]}>
                {error}
              </Text>
            ) : null}
          </View>

          {(transcript || reply) && (
            <View
              style={[
                styles.transcriptCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              {transcript ? (
                <Text style={[styles.label, { color: colors.mutedForeground }]}>
                  YOU
                </Text>
              ) : null}
              {transcript ? (
                <Text style={[styles.body1, { color: colors.foreground }]}>
                  {transcript}
                </Text>
              ) : null}
              {reply ? (
                <Text
                  style={[
                    styles.label,
                    { color: colors.mutedForeground, marginTop: 12 },
                  ]}
                >
                  TUTOR
                </Text>
              ) : null}
              {reply ? (
                <Text style={[styles.body1, { color: colors.foreground }]}>
                  {reply}
                </Text>
              ) : null}
            </View>
          )}
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.controls}>
            <Pressable
              haptic="light"
              onPress={() => {
                try {
                  player.pause();
                } catch {}
                setOrbState("idle");
                setTranscript("");
                setReply("");
                setError(null);
              }}
              style={({ pressed }) => [
                styles.controlBtn,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Feather name="rotate-ccw" size={18} color={colors.foreground} />
            </Pressable>
            <Pressable
              haptic="medium"
              onPress={onTapMain}
              disabled={orbState === "processing"}
              style={({ pressed }) => [
                styles.micBtn,
                {
                  backgroundColor:
                    orbState === "listening" ? colors.destructive : colors.primary,
                  opacity:
                    orbState === "processing" ? 0.5 : pressed ? 0.85 : 1,
                },
              ]}
            >
              <Feather
                name={
                  orbState === "listening"
                    ? "square"
                    : orbState === "speaking"
                      ? "pause"
                      : "mic"
                }
                size={26}
                color={colors.primaryForeground}
              />
            </Pressable>
            <Pressable
              haptic="light"
              onPress={onClose}
              style={({ pressed }) => [
                styles.controlBtn,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Feather name="chevron-down" size={20} color={colors.foreground} />
            </Pressable>
          </View>
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            Voice mode uses your microphone to chat with your tutor.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 20,
    gap: 18,
    paddingTop: 8,
  },
  orbWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  statusWrap: {
    alignItems: "center",
    gap: 8,
  },
  status: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    letterSpacing: -0.2,
  },
  errorText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  transcriptCard: {
    width: "100%",
    maxWidth: 460,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    maxHeight: 220,
  },
  label: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 1.4,
  },
  body1: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 10,
    alignItems: "center",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  controlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  micBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    textAlign: "center",
  },
});
