// #108 – Mobile artist dashboard and profile management
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert
} from "react-native";

interface ArtistProfile {
  stageName: string;
  tagline: string;
  city: string;
  genres: string;
  tippingEnabled: boolean;
}

const DEFAULT_PROFILE: ArtistProfile = {
  stageName: "Nova Chords",
  tagline: "Live sessions, real connection.",
  city: "Lagos",
  genres: "Afrobeats, Soul",
  tippingEnabled: true
};

const SEED_STATS = {
  totalTips: 34,
  totalRevenue: "820.00 XLM",
  liveSessions: 3,
  followers: 127
};

export default function ArtistDashboardScreen() {
  const [profile, setProfile] = useState<ArtistProfile>(DEFAULT_PROFILE);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ArtistProfile>(DEFAULT_PROFILE);

  function startEdit() {
    setDraft({ ...profile });
    setEditing(true);
  }

  function saveEdit() {
    setProfile({ ...draft });
    setEditing(false);
    Alert.alert("Profile updated", "Your changes have been saved.");
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Artist Dashboard</Text>

      {/* Stats row */}
      <View style={styles.statsRow}>
        {Object.entries(SEED_STATS).map(([key, val]) => (
          <View key={key} style={styles.statCard}>
            <Text style={styles.statValue}>{val}</Text>
            <Text style={styles.statLabel}>{key.replace(/([A-Z])/g, " $1").toLowerCase()}</Text>
          </View>
        ))}
      </View>

      {/* Profile section */}
      <Text style={styles.sectionTitle}>Profile</Text>

      {editing ? (
        <View style={styles.form}>
          {(["stageName", "tagline", "city", "genres"] as const).map((field) => (
            <View key={field} style={styles.field}>
              <Text style={styles.label}>{field}</Text>
              <TextInput
                style={styles.input}
                value={draft[field]}
                onChangeText={(v) => setDraft((d) => ({ ...d, [field]: v }))}
                placeholderTextColor="#5a5470"
              />
            </View>
          ))}

          <View style={styles.row}>
            <TouchableOpacity style={styles.buttonSecondary} onPress={() => setEditing(false)}>
              <Text style={styles.buttonSecondaryText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={saveEdit}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.profileCard}>
          <Text style={styles.profileName}>{profile.stageName}</Text>
          <Text style={styles.profileSub}>{profile.tagline}</Text>
          <Text style={styles.profileMeta}>{profile.city} · {profile.genres}</Text>
          <Text style={styles.profileMeta}>
            Tipping: {profile.tippingEnabled ? "enabled" : "disabled"}
          </Text>
          <TouchableOpacity style={styles.button} onPress={startEdit}>
            <Text style={styles.buttonText}>Edit profile</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b0f" },
  content: { padding: 24, paddingBottom: 48 },
  heading: { color: "#f4f0ff", fontSize: 22, fontWeight: "700", marginBottom: 20 },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 28 },
  statCard: { flex: 1, minWidth: "44%", backgroundColor: "#16131f", borderRadius: 10, padding: 14 },
  statValue: { color: "#7c5cfc", fontSize: 20, fontWeight: "700" },
  statLabel: { color: "#8a84a0", fontSize: 12, marginTop: 4 },
  sectionTitle: { color: "#c7c1d9", fontSize: 16, fontWeight: "600", marginBottom: 12 },
  profileCard: { backgroundColor: "#16131f", borderRadius: 12, padding: 18, gap: 6 },
  profileName: { color: "#f4f0ff", fontSize: 18, fontWeight: "700" },
  profileSub: { color: "#c7c1d9", fontSize: 14 },
  profileMeta: { color: "#8a84a0", fontSize: 13 },
  form: { gap: 12 },
  field: { gap: 4 },
  label: { color: "#8a84a0", fontSize: 12 },
  input: { backgroundColor: "#16131f", color: "#f4f0ff", borderRadius: 8, padding: 12, fontSize: 14 },
  row: { flexDirection: "row", gap: 10, marginTop: 8 },
  button: { flex: 1, backgroundColor: "#7c5cfc", borderRadius: 10, padding: 14, alignItems: "center", marginTop: 14 },
  buttonText: { color: "#fff", fontWeight: "600" },
  buttonSecondary: { flex: 1, backgroundColor: "#2e2b3a", borderRadius: 10, padding: 14, alignItems: "center", marginTop: 14 },
  buttonSecondaryText: { color: "#c7c1d9", fontWeight: "600" }
});
