// #105 – Legal/compliance placeholder pages and consent capture
import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert
} from "react-native";

const SECTIONS = [
  {
    key: "terms",
    title: "Terms of Service",
    body:
      "By using Chordially you agree to our terms. This platform facilitates tipping between fans and artists on the Stellar network. All transactions are final once confirmed on-chain."
  },
  {
    key: "privacy",
    title: "Privacy Policy",
    body:
      "We collect only what is necessary to operate the platform (email, public wallet address). We do not sell your data. You may request deletion of your account at any time."
  },
  {
    key: "cookies",
    title: "Cookie Policy",
    body:
      "We use session cookies for authentication only. No third-party tracking cookies are used."
  }
];

export default function LegalScreen({ onConsent }: { onConsent?: () => void }) {
  const [agreed, setAgreed] = useState(false);

  function handleAgree() {
    setAgreed(true);
    Alert.alert("Consent recorded", "Thank you for reviewing our policies.");
    onConsent?.();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Legal & Compliance</Text>

      {SECTIONS.map((s) => (
        <View key={s.key} style={styles.section}>
          <Text style={styles.sectionTitle}>{s.title}</Text>
          <Text style={styles.body}>{s.body}</Text>
        </View>
      ))}

      <TouchableOpacity
        style={[styles.button, agreed && styles.buttonDone]}
        onPress={handleAgree}
        disabled={agreed}
      >
        <Text style={styles.buttonText}>
          {agreed ? "Consent recorded ✓" : "I have read and agree"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b0f" },
  content: { padding: 24, paddingBottom: 48 },
  heading: { color: "#f4f0ff", fontSize: 22, fontWeight: "700", marginBottom: 24 },
  section: { marginBottom: 20 },
  sectionTitle: { color: "#c7c1d9", fontSize: 15, fontWeight: "600", marginBottom: 6 },
  body: { color: "#8a84a0", fontSize: 14, lineHeight: 22 },
  button: { marginTop: 24, backgroundColor: "#7c5cfc", borderRadius: 10, padding: 16, alignItems: "center" },
  buttonDone: { backgroundColor: "#2e2b3a" },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 15 }
});
