"use client";

import { MainWrapper } from "@/components/MainWrapper";
import { AuthProvider } from "@/context/auth-context";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
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
