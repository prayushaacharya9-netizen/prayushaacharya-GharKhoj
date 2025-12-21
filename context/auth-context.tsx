import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { auth } from "../fireconfig";

type AuthUser = {
  email: string;
  displayName?: string;
  uid: string;
};

type AuthContextValue = {
  isAuthenticated: boolean;
  user: AuthUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser: User | null) => {
        if (firebaseUser) {
          setUser({
            email: firebaseUser.email || "",
            displayName: firebaseUser.displayName || undefined,
            uid: firebaseUser.uid,
          });
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return unsubscribe; // Cleanup subscription on unmount
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    // User state will be updated by onAuthStateChanged listener
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      // Update the user's profile with display name
      if (displayName.trim()) {
        await updateProfile(userCredential.user, {
          displayName: displayName.trim(),
        });
      }
      // User state will be updated by onAuthStateChanged listener
    },
    []
  );

  const logout = useCallback(async () => {
    await signOut(auth);
    // User state will be updated by onAuthStateChanged listener
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(user),
      user,
      isLoading,
      signIn,
      signUp,
      logout,
    }),
    [user, isLoading, signIn, signUp, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
