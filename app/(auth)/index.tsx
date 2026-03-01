import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text } from "@/components/text";
import { useAuth } from "@/context/auth-context";
import { useThemeColor } from "@/hooks/use-theme-color";

export default function LandingScreen() {
  const {
    signIn,
    signUp,
    isLoading: authLoading,
    setRoleForSession,
  } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [selectedRole, setSelectedRole] = useState<"tenant" | "broker">(
    "tenant"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Theme colors for non-text elements
  const backgroundColor = useThemeColor({}, "background");
  const secondaryTextColor = useThemeColor({}, "secondaryText");
  const inputBackground = useThemeColor({}, "inputBackground");
  const inputBorder = useThemeColor({}, "inputBorder");
  const inputText = useThemeColor({}, "inputText");
  const inputPlaceholder = useThemeColor({}, "inputPlaceholder");
  const errorColor = useThemeColor({}, "error");
  const primaryButton = useThemeColor({}, "primaryButton");
  const primaryButtonText = useThemeColor({}, "primaryButtonText");
  const secondaryButtonText = useThemeColor({}, "secondaryButtonText");

  const dynamicStyles = {
    safeArea: { backgroundColor },
    subtitle: { color: secondaryTextColor },
    input: {
      backgroundColor: inputBackground,
      borderColor: inputBorder,
      color: inputText,
    },
    error: { color: errorColor },
    primaryButton: { backgroundColor: primaryButton },
    primaryButtonText: { color: primaryButtonText },
    secondaryButtonText: { color: secondaryButtonText },
  };

  const router = useRouter();
  if (authLoading) return null;

  const handleAuth = async () => {
    // Validate inputs
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password to continue.");
      return;
    }

    if (mode === "signup" && !fullName.trim()) {
      setError("Please share your name so we can personalize things.");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      if (mode === "login") {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password, fullName.trim());
      }
      // Store the selected role in the auth context for this session
      setRoleForSession(selectedRole);
      // Navigate to the tabs layout after successful auth
      router.replace("/(tabs)");
    } catch (err: any) {
      // Handle Firebase auth errors
      let errorMessage = "An error occurred. Please try again.";

      if (err.code === "auth/user-not-found") {
        errorMessage = "No account found with this email address.";
      } else if (err.code === "auth/wrong-password") {
        errorMessage = "Incorrect password. Please try again.";
      } else if (err.code === "auth/email-already-in-use") {
        errorMessage = "An account with this email already exists.";
      } else if (err.code === "auth/weak-password") {
        errorMessage =
          "Password is too weak. Please choose a stronger password.";
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "Invalid email address.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, dynamicStyles.safeArea]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 85 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.inner}>
            <View style={styles.hero}>
              <Image
                source={{
                  uri: "https://raw.githubusercontent.com/pramit101/fridge_front/main/assets/images/Gemini_Generated_Image_1p6kbm1p6kbm1p6k.png",
                }}
                style={styles.logo}
              />
              <Text style={styles.title}>
                {mode === "login" ? "Welcome" : "Create an account"}
              </Text>
              <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
                {mode === "login"
                  ? "Sign in to access your dashboard and continue where you left off."
                  : "Sign up to sync your progress securely across devices."}
              </Text>
            </View>

            {/* Role selector */}
            <View style={styles.roleSwitch}>
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  selectedRole === "tenant" && styles.roleOptionActive,
                ]}
                onPress={() => setSelectedRole("tenant")}
              >
                <Text
                  style={[
                    styles.roleOptionText,
                    selectedRole === "tenant" && styles.roleOptionTextActive,
                  ]}
                >
                  I&apos;m a tenant
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  selectedRole === "broker" && styles.roleOptionActive,
                ]}
                onPress={() => setSelectedRole("broker")}
              >
                <Text
                  style={[
                    styles.roleOptionText,
                    selectedRole === "broker" && styles.roleOptionTextActive,
                  ]}
                >
                  I&apos;m a broker
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              {mode === "signup" && (
                <View style={styles.field}>
                  <Text style={styles.label}>Full name</Text>
                  <TextInput
                    placeholder="Jane Doe"
                    placeholderTextColor={inputPlaceholder}
                    style={[styles.input, dynamicStyles.input]}
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>
              )}

              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  placeholder="you@example.com"
                  placeholderTextColor={inputPlaceholder}
                  style={[styles.input, dynamicStyles.input]}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor={inputPlaceholder}
                  style={[styles.input, dynamicStyles.input]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  returnKeyType="done"
                />
              </View>

              {error ? (
                <Text style={[styles.error, dynamicStyles.error]}>{error}</Text>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  dynamicStyles.primaryButton,
                  (isLoading || authLoading) && styles.primaryButtonDisabled,
                ]}
                onPress={handleAuth}
                disabled={isLoading || authLoading}
              >
                <Text
                  style={[
                    styles.primaryButtonText,
                    dynamicStyles.primaryButtonText,
                  ]}
                >
                  {isLoading || authLoading
                    ? "Please wait..."
                    : mode === "login"
                    ? "Log in"
                    : "Create account"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() =>
                  setMode((prev) => (prev === "login" ? "signup" : "login"))
                }
              >
                <Text
                  style={[
                    styles.secondaryButtonText,
                    dynamicStyles.secondaryButtonText,
                  ]}
                >
                  {mode === "login"
                    ? "Don't have an account? Sign up"
                    : "Already have an account? Log in"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: "space-between",
    gap: 32,
  },
  hero: {
    alignItems: "center",
    gap: 12,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 8,
    borderRadius: 100,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  form: {
    gap: 12,
  },
  roleSwitch: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.6)",
    alignItems: "center",
  },
  roleOptionActive: {
    backgroundColor: "rgba(99,102,241,0.15)",
    borderColor: "#6366f1",
  },
  roleOptionText: {
    fontSize: 14,
  },
  roleOptionTextActive: {
    fontWeight: "600",
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  error: {
    marginTop: 4,
    fontSize: 13,
  },
  primaryButton: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  secondaryButton: {
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 14,
  },
});
