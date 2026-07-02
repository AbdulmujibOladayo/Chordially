#!/usr/bin/env node
import { execFileSync } from "node:child_process"
import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"

const DEFAULT_START = 473
const DEFAULT_BACKLOG_PATH = ".local/chordially-backlog.md"

const labelPalette = {
  enhancement: { color: "a2eeef", description: "New feature or request" },
  "complexity: intermediate": {
    color: "1D9E75",
    description: "2–3 days estimated",
  },
  "complexity: complex": {
    color: "D85A30",
    description: "3–4 days estimated",
  },
  "layer: api": { color: "0C447C", description: "Backend Express API" },
  "layer: web": { color: "27500A", description: "Next.js web app" },
  "layer: mobile": { color: "633806", description: "React Native / Expo" },
  "layer: pkg": { color: "712B13", description: "Shared packages" },
  "layer: full-stack": { color: "3C3489", description: "Spans multiple layers" },
}

const backlog = [
  {
    sprint: "sprint-2",
    theme: "Creator identity, media, and onboarding depth",
    description:
      "Finish the creator-facing profile foundation so creators can present richer public pages, manage media safely, and complete onboarding across web and mobile.",
    issues: [
      ["S2-01", "Expand creator profile schema with genres, location, and availability windows", "api", "complex"],
      ["S2-02", "Add creator profile completion rules that drive onboarding progress", "pkg", "intermediate"],
      ["S2-03", "Create a creator profile detail endpoint with public and private views", "api", "complex"],
      ["S2-04", "Support profile drafts so incomplete creator setups can be saved safely", "api", "intermediate"],
      ["S2-05", "Add avatar and banner metadata handling to the creator repository", "api", "complex"],
      ["S2-06", "Implement a creator media gallery model for profile assets", "api", "complex"],
      ["S2-07", "Expose creator media ordering and cover selection in the API", "api", "intermediate"],
      ["S2-08", "Build a profile edit experience that covers bio, genre tags, and location", "web", "complex"],
      ["S2-09", "Add creator onboarding step navigation with save-and-continue state", "web", "complex"],
      ["S2-10", "Create a banner-aware creator header for the public profile page", "web", "intermediate"],
      ["S2-11", "Introduce creator profile skeleton loading and error states", "web", "intermediate"],
      ["S2-12", "Add creator media upload controls with size and type validation", "web", "complex"],
      ["S2-13", "Build a profile completeness widget for the creator dashboard shell", "web", "intermediate"],
      ["S2-14", "Create a creator setup progress screen that mirrors the web flow", "mobile", "complex"],
      ["S2-15", "Add mobile profile editing for bio, location, and social links", "mobile", "complex"],
      ["S2-16", "Implement mobile avatar and banner preview states before upload", "mobile", "intermediate"],
      ["S2-17", "Create a mobile media picker flow for profile assets", "mobile", "complex"],
      ["S2-18", "Add shared validation schemas for creator profile drafts", "pkg", "intermediate"],
      ["S2-19", "Document profile and media upload boundaries for S3-backed assets", "full-stack", "intermediate"],
      ["S2-20", "Introduce an avatar moderation hook for future creator safety tooling", "api", "complex"],
      ["S2-21", "Add a creator visibility toggle between public and limited profile modes", "api", "intermediate"],
      ["S2-22", "Create a web public profile metadata component for SEO and previews", "web", "intermediate"],
      ["S2-23", "Add a mobile public profile preview screen for creators", "mobile", "intermediate"],
      ["S2-24", "Create a creator onboarding resume endpoint for interrupted sessions", "api", "complex"],
      ["S2-25", "Build a cross-app onboarding checklist that surfaces remaining profile work", "full-stack", "complex"],
    ],
  },
  {
    sprint: "sprint-3",
    theme: "Discovery, fan engagement, and social graph growth",
    description:
      "Let fans find creators faster and interact more meaningfully through feeds, search, follows, and lightweight engagement primitives.",
    issues: [
      ["S3-01", "Add creator discovery ranking inputs for tags, activity, and freshness", "api", "complex"],
      ["S3-02", "Create a paginated discovery endpoint that combines creator and fan signals", "api", "complex"],
      ["S3-03", "Add search indexing hooks for creator profiles and public metadata", "api", "complex"],
      ["S3-04", "Implement a trending creators feed for high-signal public activity", "api", "intermediate"],
      ["S3-05", "Create a follow graph read model for fast follower and following counts", "api", "complex"],
      ["S3-06", "Add a lightweight fan bookmark model for saved creators", "api", "intermediate"],
      ["S3-07", "Expose a creator card data contract for discovery surfaces", "pkg", "intermediate"],
      ["S3-08", "Build a discover page with filters for genre, location, and live status", "web", "complex"],
      ["S3-09", "Add search debounce and keyboard navigation to the web discovery shell", "web", "intermediate"],
      ["S3-10", "Create a creator spotlight row for the home page hero zone", "web", "intermediate"],
      ["S3-11", "Implement follow and unfollow actions with optimistic UI state", "web", "complex"],
      ["S3-12", "Add a bookmarked creators panel to the signed-in web shell", "web", "intermediate"],
      ["S3-13", "Build a discovery result empty state that suggests search refinements", "web", "intermediate"],
      ["S3-14", "Create a fan explore screen with infinite scroll and refresh control", "mobile", "complex"],
      ["S3-15", "Add a compact creator card component for mobile search results", "mobile", "intermediate"],
      ["S3-16", "Implement a mobile follow toggle with local optimistic rollback", "mobile", "complex"],
      ["S3-17", "Create a saved creators screen for the Expo app", "mobile", "intermediate"],
      ["S3-18", "Add a shared discovery filter schema across web and mobile", "pkg", "intermediate"],
      ["S3-19", "Build a public follow count summary that can be reused in headers", "full-stack", "intermediate"],
      ["S3-20", "Create a notifications seed model for follow and discovery events", "api", "complex"],
      ["S3-21", "Add a basic activity stream for new creator posts and profile updates", "api", "complex"],
      ["S3-22", "Implement a web notifications drawer for follow and mention events", "web", "complex"],
      ["S3-23", "Create a mobile notifications inbox with read and unread states", "mobile", "complex"],
      ["S3-24", "Add local analytics hooks for discovery funnel conversion tracking", "full-stack", "intermediate"],
      ["S3-25", "Define fan engagement guardrails so discovery surfaces stay spam-resistant", "full-stack", "complex"],
    ],
  },
  {
    sprint: "sprint-4",
    theme: "Wallet linkage, identity trust, and Stellar readiness",
    description:
      "Prepare the credential and wallet foundation so creators can link identities, understand trust boundaries, and move toward Stellar-backed account flows.",
    issues: [
      ["S4-01", "Add wallet identity fields to the creator account model", "api", "complex"],
      ["S4-02", "Create a wallet-link session model for challenge issuance and verification", "api", "complex"],
      ["S4-03", "Add a linked-wallet status endpoint for account surfaces", "api", "intermediate"],
      ["S4-04", "Implement wallet unlink auditing and status history in the API", "api", "complex"],
      ["S4-05", "Add SEP-10-style challenge payload validation rules", "pkg", "complex"],
      ["S4-06", "Create shared wallet-link state types for all clients", "pkg", "intermediate"],
      ["S4-07", "Add a Horizon adapter boundary in the Stellar package", "pkg", "complex"],
      ["S4-08", "Create a mock Horizon client for local wallet-link development", "pkg", "complex"],
      ["S4-09", "Build a wallet-link onboarding panel inside the web dashboard shell", "web", "complex"],
      ["S4-10", "Add wallet-link consent copy and trust boundary messaging to the web flow", "web", "intermediate"],
      ["S4-11", "Create a linked-wallet status card for the authenticated web account view", "web", "intermediate"],
      ["S4-12", "Implement a wallet challenge initiation form for contributors on web", "web", "complex"],
      ["S4-13", "Add a wallet-link verification success state with clear next steps", "web", "intermediate"],
      ["S4-14", "Build a mobile account screen section for linked-wallet state", "mobile", "intermediate"],
      ["S4-15", "Create a mobile wallet-link flow that respects Expo auth patterns", "mobile", "complex"],
      ["S4-16", "Add a wallet verification progress step to the mobile onboarding shell", "mobile", "intermediate"],
      ["S4-17", "Implement a mobile wallet unlink action with confirmation", "mobile", "complex"],
      ["S4-18", "Define trusted vs. untrusted wallet credential rules for account merge", "full-stack", "complex"],
      ["S4-19", "Add observability-safe logging for wallet challenge events", "api", "intermediate"],
      ["S4-20", "Create a local QA checklist for wallet-link edge cases", "full-stack", "intermediate"],
      ["S4-21", "Add network-awareness for testnet and mainnet wallet flows", "full-stack", "complex"],
      ["S4-22", "Create a retry and replay protection layer for wallet challenges", "api", "complex"],
      ["S4-23", "Add wallet connection copy for profile settings and account recovery", "web", "intermediate"],
      ["S4-24", "Create a service contract for API to Stellar wallet operations", "full-stack", "complex"],
      ["S4-25", "Add shared wallet-link test harnesses for API and client development", "full-stack", "complex"],
    ],
  },
  {
    sprint: "sprint-5",
    theme: "Payments, monetization, and creator support flows",
    description:
      "Turn wallet readiness into usable support features, starting with creator tipping, receipts, transaction history, and campaign primitives.",
    issues: [
      ["S5-01", "Add payment intent records for creator support transactions", "api", "complex"],
      ["S5-02", "Create a tip submission endpoint that builds and submits Stellar transactions", "api", "complex"],
      ["S5-03", "Add payment idempotency protection for duplicate submissions", "api", "intermediate"],
      ["S5-04", "Create a payment status polling endpoint for pending support flows", "api", "complex"],
      ["S5-05", "Add payment receipt persistence with on-chain reference fields", "api", "complex"],
      ["S5-06", "Create a transaction history read model for creator earnings", "api", "complex"],
      ["S5-07", "Add a simple tip amount formatting utility to shared packages", "pkg", "intermediate"],
      ["S5-08", "Build a creator tip panel on the public profile page", "web", "complex"],
      ["S5-09", "Add a transaction confirmation modal with fee and status breakdown", "web", "complex"],
      ["S5-10", "Create a creator earnings summary card for the dashboard shell", "web", "intermediate"],
      ["S5-11", "Implement a payment history table with status badges on web", "web", "complex"],
      ["S5-12", "Add a support flow that preserves creator context after login", "web", "intermediate"],
      ["S5-13", "Create a mobile tip composer with amount presets and confirmation", "mobile", "complex"],
      ["S5-14", "Add a payment receipt screen with transaction details in the mobile app", "mobile", "complex"],
      ["S5-15", "Implement a mobile creator earnings summary view", "mobile", "intermediate"],
      ["S5-16", "Create a shared payment status model for pending and confirmed states", "pkg", "intermediate"],
      ["S5-17", "Add creator campaign metadata to the API domain", "api", "complex"],
      ["S5-18", "Create a campaign creation wizard for the web dashboard", "web", "complex"],
      ["S5-19", "Implement a campaign progress view with goal and deadline states", "web", "intermediate"],
      ["S5-20", "Add a mobile campaign detail screen for fans", "mobile", "complex"],
      ["S5-21", "Create a digital reward entitlement model tied to support thresholds", "api", "complex"],
      ["S5-22", "Add reward badge rendering to the web profile shell", "web", "intermediate"],
      ["S5-23", "Create a mobile rewards gallery with unlock state", "mobile", "intermediate"],
      ["S5-24", "Define refund and reversal policies for failed support flows", "full-stack", "complex"],
      ["S5-25", "Add payment analytics events for the full support funnel", "full-stack", "intermediate"],
    ],
  },
  {
    sprint: "sprint-6",
    theme: "Platform quality, observability, and release readiness",
    description:
      "Harden the monorepo with better tests, logs, CI, local tooling, and release workflows so feature work can scale safely.",
    issues: [
      ["S6-01", "Add structured request logging middleware across the API routers", "api", "complex"],
      ["S6-02", "Create a correlation ID middleware for cross-service tracing", "api", "complex"],
      ["S6-03", "Add error normalization for API and Stellar service boundaries", "full-stack", "complex"],
      ["S6-04", "Create a health and readiness split for deployment probes", "api", "intermediate"],
      ["S6-05", "Add a local dev seed flow for creators, fans, and wallets", "full-stack", "complex"],
      ["S6-06", "Create a repeatable fixture builder for auth and creator tests", "api", "complex"],
      ["S6-07", "Add shared test helpers for authenticated API requests", "pkg", "intermediate"],
      ["S6-08", "Create a web component testing harness with auth context helpers", "web", "intermediate"],
      ["S6-09", "Add mobile test utilities for navigation and screen state", "mobile", "intermediate"],
      ["S6-10", "Create a monorepo lint rule pass focused on import boundaries", "full-stack", "complex"],
      ["S6-11", "Add CI workflows that fail fast on dependency drift", "full-stack", "intermediate"],
      ["S6-12", "Create a release checklist for environment variables and secrets", "full-stack", "intermediate"],
      ["S6-13", "Add a local mock API server mode for frontend development", "full-stack", "complex"],
      ["S6-14", "Create observability-safe logging helpers for user-facing errors", "pkg", "intermediate"],
      ["S6-15", "Add a performance budget note for web page shells and route transitions", "web", "intermediate"],
      ["S6-16", "Create a mobile startup profiling pass for the Expo shell", "mobile", "complex"],
      ["S6-17", "Add a shared API client retry policy for transient failures", "pkg", "complex"],
      ["S6-18", "Create a GitHub issue publishing dry-run mode that prints planned payloads", "full-stack", "intermediate"],
      ["S6-19", "Add sprint label provisioning and color management to the publish flow", "full-stack", "intermediate"],
      ["S6-20", "Create a backlog validation mode that checks for duplicate numbers", "full-stack", "intermediate"],
      ["S6-21", "Add a markdown snapshot writer for local sprint planning exports", "full-stack", "intermediate"],
      ["S6-22", "Create an E2E smoke test outline for auth, profile, and payment journeys", "full-stack", "complex"],
      ["S6-23", "Add observability notes for logs, counters, and alerts per domain", "full-stack", "intermediate"],
      ["S6-24", "Create a repo health dashboard checklist for future technical debt triage", "full-stack", "intermediate"],
      ["S6-25", "Add an archive policy for completed backlog waves and issue batches", "full-stack", "intermediate"],
    ],
  },
]

function parseArgs(argv) {
  const args = {
    start: DEFAULT_START,
    count: null,
    writeBacklog: false,
    publish: false,
    repo: null,
    backlogPath: DEFAULT_BACKLOG_PATH,
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === "--start") {
      args.start = Number(argv[++i])
    } else if (arg === "--count") {
      args.count = Number(argv[++i])
    } else if (arg === "--write-backlog") {
      args.writeBacklog = true
      const maybePath = argv[i + 1]
      if (maybePath && !maybePath.startsWith("-")) {
        args.backlogPath = maybePath
        i += 1
      }
    } else if (arg === "--publish") {
      args.publish = true
    } else if (arg === "--backlog-path") {
      args.backlogPath = argv[++i]
    } else if (arg === "--repo") {
      args.repo = argv[++i]
    }
  }

  if (!Number.isFinite(args.start) || args.start < 1) {
    throw new Error("--start must be a positive number")
  }
  if (args.count !== null && (!Number.isFinite(args.count) || args.count < 1)) {
    throw new Error("--count must be a positive number")
  }

  return args
}

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  }).trim()
}

function getRepoFromRemote() {
  const remote = run("git", ["remote", "get-url", "origin"])
  const ssh = remote.match(/^git@github\.com:([^/]+)\/(.+?)(?:\.git)?$/)
  if (ssh) {
    return { owner: ssh[1], repo: ssh[2] }
  }

  const https = remote.match(/^https:\/\/github\.com\/([^/]+)\/(.+?)(?:\.git)?$/)
  if (https) {
    return { owner: https[1], repo: https[2] }
  }

  throw new Error(`Unsupported Git remote URL: ${remote}`)
}

function getExistingMaxIssueNumber(owner, repo) {
  try {
    const output = run("gh", [
      "issue",
      "list",
      "--repo",
      `${owner}/${repo}`,
      "--state",
      "all",
      "--limit",
      "1000",
      "--json",
      "number",
      "--jq",
      "map(.number) | max",
    ])
    const maxNumber = Number(output)
    return Number.isFinite(maxNumber) ? maxNumber : 0
  } catch {
    return 0
  }
}

function slugifyLabel(name) {
  return name.toLowerCase().replace(/\s+/g, "-")
}

function labelMeta(name) {
  if (name in labelPalette) {
    return labelPalette[name]
  }
  if (/^sprint-\d+$/.test(name)) {
    return { color: "1d76db", description: `Backlog sprint ${name.split("-")[1]}` }
  }
  if (name === "FRONTEND" || name === "BACKEND") {
    return { color: "aaaaaa", description: "" }
  }
  if (name === "enhancement") {
    return labelPalette.enhancement
  }
  return { color: "ededed", description: "" }
}

function ensureLabels(owner, repo, labels) {
  const existing = new Set()
  try {
    const raw = run("gh", [
      "label",
      "list",
      "--repo",
      `${owner}/${repo}`,
      "--limit",
      "1000",
      "--json",
      "name",
      "--jq",
      ".[] | .name",
    ])
    raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((name) => existing.add(name))
  } catch {
    // If label listing fails we still try to create the labels we need.
  }

  for (const name of labels) {
    if (existing.has(name)) {
      continue
    }
    const { color, description } = labelMeta(name)
    run("gh", [
      "api",
      "-X",
      "POST",
      `repos/${owner}/${repo}/labels`,
      "-f",
      `name=${name}`,
      "-f",
      `color=${color}`,
      "-f",
      `description=${description}`,
    ])
  }
}

function issueLabels(issue, sprintLabel) {
  const labels = ["enhancement", sprintLabel, `layer: ${issue.layer}`, `complexity: ${issue.complexity}`]
  return [...new Set(labels)]
}

function buildBody(issue, sprint) {
  return [
    `## Context`,
    `${sprint.theme}.`,
    "",
    `## Scope`,
    `- Layer: ${issue.layer}`,
    `- Complexity: ${issue.complexity}`,
    `- Sprint label: ${sprint.sprint}`,
    "",
    `## Notes`,
    `- Keep work aligned with the existing modular-monolith monorepo layout.`,
    `- Split implementation across the smallest sensible API, web, mobile, or package boundary.`,
    `- Add or update tests where the behavior is user-visible or cross-app.`,
  ].join("\n")
}

function flattenIssues(start) {
  let current = start
  return backlog.flatMap((sprint) =>
    sprint.issues.map(([code, title, layer, complexity]) => ({
      number: current++,
      code,
      title,
      layer,
      complexity,
      sprint,
    })),
  )
}

function renderMarkdown(issues) {
  const firstIssue = issues[0]
  const lastIssue = issues[issues.length - 1]
  const chunks = [
    "# Chordially Local Backlog",
    "",
    "> Local only. Generated from the repo state, live issue list, and the current product architecture.",
    `> Starting issue number: ${firstIssue?.number ?? DEFAULT_START}`,
    `> Ending issue number: ${lastIssue?.number ?? DEFAULT_START - 1}`,
    "",
  ]

  for (const sprint of backlog) {
    chunks.push(`## ${sprint.sprint} - ${sprint.theme}`)
    chunks.push("")
    chunks.push(sprint.description)
    chunks.push("")
    chunks.push("| Number | Code | Title | Layer | Complexity |")
    chunks.push("| --- | --- | --- | --- | --- |")
    for (const issue of issues.filter((item) => item.sprint === sprint)) {
      chunks.push(
        `| ${issue.number} | ${issue.code} | ${issue.title} | ${issue.layer} | ${issue.complexity} |`,
      )
    }
    chunks.push("")
  }

  return chunks.join("\n")
}

function createIssue(owner, repo, issue) {
  const sprintLabel = issue.sprint.sprint
  const labels = issueLabels(issue, sprintLabel)
  ensureLabels(owner, repo, labels)

  const payload = {
    title: issue.title,
    body: buildBody(issue, issue.sprint),
    labels,
  }

  run("gh", [
    "api",
    "-X",
    "POST",
    `repos/${owner}/${repo}/issues`,
    "-f",
    `title=${payload.title}`,
    "-f",
    `body=${payload.body}`,
    ...payload.labels.flatMap((label) => ["-f", `labels[]=${label}`]),
  ])
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const { owner, repo } = args.repo
    ? (() => {
        const [repoOwner, repoName] = args.repo.split("/")
        if (!repoOwner || !repoName) {
          throw new Error(`--repo must look like owner/name, got: ${args.repo}`)
        }
        return { owner: repoOwner, repo: repoName }
      })()
    : getRepoFromRemote()
  const existingMax = getExistingMaxIssueNumber(owner, repo)
  const start = Math.max(args.start, existingMax + 1)
  const issues = flattenIssues(start)
  const planned = args.count ? issues.slice(0, args.count) : issues

  if (args.writeBacklog) {
    const output = renderMarkdown(planned.length > 0 ? planned : issues)
    const filePath = resolve(process.cwd(), args.backlogPath)
    mkdirSync(dirname(filePath), { recursive: true })
    writeFileSync(filePath, output)
  }

  if (args.publish) {
    const publishCount = args.count ?? issues.length
    const toPublish = issues.slice(0, publishCount)
    for (const issue of toPublish) {
      createIssue(owner, repo, issue)
    }
  }
}

main()
