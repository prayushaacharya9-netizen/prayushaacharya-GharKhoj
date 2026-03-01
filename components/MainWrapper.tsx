"use client";

import { useAuth } from "@/context/auth-context";
import { Stack } from "expo-router";

export function MainWrapper() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  // 🔒 AUTH STACK
  if (!user) {
    return (
      <Stack key="auth" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
    );
  }

  // 🔓 APP STACK
  return (
    <Stack key="app" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="listing/[id]" />
    </Stack>
  );
}
