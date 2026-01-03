"use client";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/context/auth-context";
import { Tabs } from "expo-router";
import React, { useEffect, useState } from "react";

export default function TabsClient() {
  const { user, isLoading } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoading) setReady(true);
  }, [isLoading]);

  if (!ready) return null; // wait for Firebase auth to resolve
  if (!user) return null; // or redirect manually if you want

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="paperplane.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
