import { Text } from "@/components/text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/context/auth-context";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useState } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const { logout, user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const cardBackground = useThemeColor({}, "cardBackground");
  const secondaryText = useThemeColor({}, "secondaryText");
  const errorColor = useThemeColor({}, "error");

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView
          style={[styles.card, { backgroundColor: cardBackground }]}
          lightColor={cardBackground}
          darkColor={cardBackground}
        >
          <Text style={styles.title}>Account</Text>
          <Text style={[styles.meta, { color: secondaryText }]}>
            {user?.displayName ? `${user.displayName} · ` : ""}
            {user?.email}
          </Text>
          <TouchableOpacity
            style={[
              styles.logout,
              { backgroundColor: errorColor + "20" },
              isLoggingOut && styles.logoutDisabled,
            ]}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            <Text style={[styles.logoutText, { color: errorColor }]}>
              {isLoggingOut ? "Logging out..." : "Log out"}
            </Text>
          </TouchableOpacity>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
  },
  meta: {
    fontSize: 16,
  },
  logout: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  logoutText: {
    fontWeight: "600",
    fontSize: 16,
  },
  logoutDisabled: {
    opacity: 0.6,
  },
});
