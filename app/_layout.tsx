"use client";

import { MainWrapper } from "@/components/MainWrapper";
import { AuthProvider } from "@/context/auth-context";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <MainWrapper />
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </AuthProvider>
  );
}
