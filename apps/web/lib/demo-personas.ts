// #129 – Demo personas and scripted storytelling for hackathon judges

export interface DemoPersona {
  id: string;
  username: string;
  email: string;
  role: "fan" | "artist" | "admin";
  displayName: string;
  bio: string;
  city: string;
  /** Suggested login password for demo use */
  demoPassword: string;
}

export const DEMO_PERSONAS: DemoPersona[] = [
  {
    id: "demo-fan-1",
    username: "ada_listener",
    email: "ada@demo.chordially.io",
    role: "fan",
    displayName: "Ada Listener",
    bio: "Music lover from Lagos. Tips artists she discovers on Chordially.",
    city: "Lagos",
    demoPassword: "demo1234"
  },
  {
    id: "demo-artist-1",
    username: "nova_chords",
    email: "nova@demo.chordially.io",
    role: "artist",
    displayName: "Nova Chords",
    bio: "Afrobeats / Indie Soul artist. Hosts rooftop sessions and earns tips in XLM.",
    city: "Lagos",
    demoPassword: "demo1234"
  },
  {
    id: "demo-admin-1",
    username: "ops_lead",
    email: "ops@demo.chordially.io",
    role: "admin",
    displayName: "Ops Lead",
    bio: "Platform admin. Monitors sessions, manages users, and reviews the audit trail.",
    city: "Remote",
    demoPassword: "demo1234"
  }
];

export interface DemoStep {
  step: number;
  persona: string;
  title: string;
  path: string;
  description: string;
}

export const DEMO_SCRIPT: DemoStep[] = [
  {
    step: 1,
    persona: "ops_lead (admin)",
    title: "Admin overview",
    path: "/admin",
    description: "Log in as ops_lead. The overview shows platform metrics: 142 users, 27 artists, 6 live sessions, 34 recent tips."
  },
  {
    step: 2,
    persona: "ada_listener (fan)",
    title: "Discover live sessions",
    path: "/discover",
    description: "Log in as ada_listener. Browse live sessions — Nova Chords is live in Lagos with a rooftop set."
  },
  {
    step: 3,
    persona: "ada_listener (fan)",
    title: "View session and tip",
    path: "/sessions/nova-chords",
    description: "Open Nova Chords' session. Fill in a tip amount (e.g. 10 XLM) and submit. The draft intent is confirmed instantly."
  },
  {
    step: 4,
    persona: "nova_chords (artist)",
    title: "Artist dashboard",
    path: "/artist/dashboard",
    description: "Switch to nova_chords. The artist dashboard shows the live session status and incoming tip activity."
  },
  {
    step: 5,
    persona: "ops_lead (admin)",
    title: "Moderation — user management",
    path: "/admin/bellabuks/users",
    description: "Back to ops_lead. The user table shows all roles and statuses. jay_beats is suspended — visible at a glance."
  },
  {
    step: 6,
    persona: "ops_lead (admin)",
    title: "Audit trail",
    path: "/admin/bellabuks/audit",
    description: "Open the audit trail. Filter by actor 'ada_listener' to see her tip and profile actions. All events are timestamped."
  }
];
