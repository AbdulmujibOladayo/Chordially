// #106 – React Native app architecture with navigation and state boundaries
import { createContext, useContext, useState, ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

// ── Auth state boundary ────────────────────────────────────────────────────

interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  role: "fan" | "artist" | null;
}

const AuthContext = createContext<AuthState>({ isAuthenticated: false, userId: null, role: null });
export const useAppAuth = () => useContext(AuthContext);

// ── Route definitions ──────────────────────────────────────────────────────

type Screen = "Home" | "Discover" | "Legal" | "Login" | "ArtistDashboard";

const PUBLIC_SCREENS: Screen[] = ["Home", "Discover", "Legal", "Login"];
const PROTECTED_SCREENS: Screen[] = ["ArtistDashboard"];

// ── Navigator ─────────────────────────────────────────────────────────────

interface AppNavigatorProps {
  authState: AuthState;
  children?: ReactNode;
}

export function AppNavigator({ authState }: AppNavigatorProps) {
  const [current, setCurrent] = useState<Screen>("Home");

  function navigate(screen: Screen) {
    if (PROTECTED_SCREENS.includes(screen) && !authState.isAuthenticated) {
      setCurrent("Login");
      return;
    }
    setCurrent(screen);
  }

  return (
    <AuthContext.Provider value={authState}>
      <View style={styles.container}>
        {/* Tab bar */}
        <View style={styles.tabBar}>
          {(PUBLIC_SCREENS as Screen[]).map((s) => (
            <TouchableOpacity key={s} onPress={() => navigate(s)} style={styles.tab}>
              <Text style={[styles.tabText, current === s && styles.tabActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
          {authState.isAuthenticated && authState.role === "artist" && (
            <TouchableOpacity onPress={() => navigate("ArtistDashboard")} style={styles.tab}>
              <Text style={[styles.tabText, current === "ArtistDashboard" && styles.tabActive]}>Dashboard</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Active screen label (screens rendered by caller) */}
        <View style={styles.screenLabel}>
          <Text style={styles.screenLabelText}>{current}</Text>
        </View>
      </View>
    </AuthContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b0f" },
  tabBar: { flexDirection: "row", backgroundColor: "#16131f", paddingVertical: 10, paddingHorizontal: 8 },
  tab: { flex: 1, alignItems: "center" },
  tabText: { color: "#8a84a0", fontSize: 12 },
  tabActive: { color: "#7c5cfc", fontWeight: "700" },
  screenLabel: { flex: 1, alignItems: "center", justifyContent: "center" },
  screenLabelText: { color: "#f4f0ff", fontSize: 18, fontWeight: "600" }
});
