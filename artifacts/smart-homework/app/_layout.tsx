import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootNavigator() {
  const colors = useColors();
  const { state } = useApp();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!state.hydrated) return;
    const inAuth = segments[0] === "(auth)";
    if (!state.user && !inAuth) {
      router.replace("/(auth)/welcome");
    } else if (state.user && inAuth) {
      router.replace("/(tabs)");
    }
  }, [state.hydrated, state.user, segments, router]);

  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: {
          fontFamily: "Inter_600SemiBold",
          color: colors.foreground,
        },
        headerTintColor: colors.primary,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="tutor"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="scan-result"
        options={{ title: "Scan Result", presentation: "modal" }}
      />
      <Stack.Screen
        name="assignment/new"
        options={{ title: "New Task", presentation: "modal" }}
      />
      <Stack.Screen name="assignment/[id]" options={{ title: "Task" }} />
      <Stack.Screen
        name="deck/new"
        options={{ title: "New Deck", presentation: "modal" }}
      />
      <Stack.Screen name="deck/[id]/index" options={{ title: "Deck" }} />
      <Stack.Screen
        name="deck/[id]/review"
        options={{ title: "Review", presentation: "modal" }}
      />
      <Stack.Screen
        name="group/new"
        options={{ title: "New Group", presentation: "modal" }}
      />
      <Stack.Screen
        name="group/join"
        options={{ title: "Join a Group", presentation: "modal" }}
      />
      <Stack.Screen name="group/[id]" options={{ title: "Group" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <AppProvider>
                <StatusBar style="light" />
                <RootNavigator />
              </AppProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
