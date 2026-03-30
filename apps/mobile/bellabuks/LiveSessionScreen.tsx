// #109 – Mobile live session creation and control flow
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView
} from "react-native";

type SessionStatus = "idle" | "draft" | "live" | "ended";

interface SessionDraft {
  title: string;
  description: string;
  streamUrl: string;
}

export default function LiveSessionScreen() {
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [draft, setDraft] = useState<SessionDraft>({ title: "", description: "", streamUrl: "" });
  const [startedAt, setStartedAt] = useState<string | null>(null);

  function createDraft() {
    setStatus("draft");
  }

  function goLive() {
    if (!draft.title.trim()) {
      Alert.alert("Title required", "Please enter a session title before going live.");
      return;
    }
    setStartedAt(new Date().toLocaleTimeString());
    setStatus("live");
  }

  function endSession() {
    Alert.alert("End session", "Are you sure you want to end this live session?", [
      { text: "Cancel", style: "cancel" },
      { text: "End", style: "destructive", onPress: () => setStatus("ended") }
    ]);
  }

  function reset() {
    setDraft({ title: "", description: "", streamUrl: "" });
    setStartedAt(null);
    setStatus("idle");
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Live Session</Text>

      {status === "idle" && (
        <TouchableOpacity style={styles.button} onPress={createDraft}>
          <Text style={styles.buttonText}>+ Create session</Text>
        </TouchableOpacity>
      )}

      {status === "draft" && (
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Session details</Text>
          {(["title", "description", "streamUrl"] as const).map((field) => (
            <View key={field} style={styles.field}>
              <Text style={styles.label}>{field}</Text>
              <TextInput
                style={styles.input}
                value={draft[field]}
                onChangeText={(v) => setDraft((d) => ({ ...d, [field]: v }))}
                placeholder={field === "streamUrl" ? "rtmp://..." : ""}
                placeholderTextColor="#5a5470"
              />
            </View>
          ))}
          <TouchableOpacity style={styles.buttonLive} onPress={goLive}>
            <Text style={styles.buttonText}>Go Live</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonSecondary} onPress={reset}>
            <Text style={styles.buttonSecondaryText}>Discard</Text>
          </TouchableOpacity>
        </View>
      )}

      {status === "live" && (
        <View style={styles.liveCard}>
          <View style={styles.liveBadgeRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadge}>LIVE</Text>
          </View>
          <Text style={styles.liveTitle}>{draft.title}</Text>
          {draft.description ? <Text style={styles.liveMeta}>{draft.description}</Text> : null}
          <Text style={styles.liveMeta}>Started at {startedAt}</Text>
          <TouchableOpacity style={styles.buttonDanger} onPress={endSession}>
            <Text style={styles.buttonText}>End session</Text>
          </TouchableOpacity>
        </View>
      )}

      {status === "ended" && (
        <View style={styles.endedCard}>
          <Text style={styles.endedText}>Session ended</Text>
          <Text style={styles.liveMeta}>"{draft.title}" has been closed.</Text>
          <TouchableOpacity style={styles.button} onPress={reset}>
            <Text style={styles.buttonText}>Start new session</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b0f" },
  content: { padding: 24, paddingBottom: 48 },
  heading: { color: "#f4f0ff", fontSize: 22, fontWeight: "700", marginBottom: 24 },
  sectionTitle: { color: "#c7c1d9", fontSize: 15, fontWeight: "600", marginBottom: 12 },
  form: { gap: 12 },
  field: { gap: 4 },
  label: { color: "#8a84a0", fontSize: 12 },
  input: { backgroundColor: "#16131f", color: "#f4f0ff", borderRadius: 8, padding: 12, fontSize: 14 },
  button: { backgroundColor: "#7c5cfc", borderRadius: 10, padding: 14, alignItems: "center", marginTop: 8 },
  buttonLive: { backgroundColor: "#e53e3e", borderRadius: 10, padding: 14, alignItems: "center", marginTop: 8 },
  buttonDanger: { backgroundColor: "#e53e3e", borderRadius: 10, padding: 14, alignItems: "center", marginTop: 16 },
  buttonSecondary: { backgroundColor: "#2e2b3a", borderRadius: 10, padding: 14, alignItems: "center", marginTop: 8 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  buttonSecondaryText: { color: "#c7c1d9", fontWeight: "600", fontSize: 15 },
  liveCard: { backgroundColor: "#16131f", borderRadius: 12, padding: 20 },
  liveBadgeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#e53e3e" },
  liveBadge: { color: "#e53e3e", fontWeight: "700", fontSize: 13, letterSpacing: 1 },
  liveTitle: { color: "#f4f0ff", fontSize: 18, fontWeight: "700", marginBottom: 4 },
  liveMeta: { color: "#8a84a0", fontSize: 13, marginTop: 4 },
  endedCard: { backgroundColor: "#16131f", borderRadius: 12, padding: 20, gap: 8 },
  endedText: { color: "#c7c1d9", fontSize: 18, fontWeight: "700" }
});
