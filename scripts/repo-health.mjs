import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const rootDir = process.cwd();

function commandAvailable(command) {
  const result = spawnSync(command, ["--version"], { stdio: "ignore" });
  return result.status === 0;
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(rootDir, relativePath), "utf8"));
}

function checkEnvFiles() {
  return [
    ["apps/api/.env", existsSync(path.join(rootDir, "apps/api/.env"))],
    ["apps/web/.env.local", existsSync(path.join(rootDir, "apps/web/.env.local"))],
    ["apps/mobile/.env", existsSync(path.join(rootDir, "apps/mobile/.env"))]
  ];
}

function workspaceScripts() {
  const files = [
    "package.json",
    "apps/api/package.json",
    "apps/web/package.json",
    "apps/mobile/package.json"
  ];

  return files.map((file) => {
    const json = readJson(file);
    return {
      file,
      scripts: Object.keys(json.scripts ?? {}).sort()
    };
  });
}

function gitSummary() {
  const branch = spawnSync("git", ["branch", "--show-current"], { encoding: "utf8" });
  const status = spawnSync("git", ["status", "--short"], { encoding: "utf8" });

  return {
    branch: branch.stdout.trim() || "unknown",
    clean: status.stdout.trim().length === 0
  };
}

function dockerSummary() {
  if (!commandAvailable("docker")) {
    return { available: false };
  }

  const result = spawnSync("docker", ["compose", "ps", "--format", "json"], {
    cwd: rootDir,
    encoding: "utf8"
  });

  if (result.status !== 0) {
    return { available: true, running: false };
  }

  const lines = result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));

  return {
    available: true,
    running: lines.length > 0,
    services: lines.map((entry) => ({
      service: entry.Service,
      state: entry.State
    }))
  };
}

function printSection(title, lines) {
  console.log(title);
  for (const line of lines) {
    console.log(`- ${line}`);
  }
  console.log("");
}

function main() {
  const git = gitSummary();
  const envFiles = checkEnvFiles();
  const scripts = workspaceScripts();
  const docker = dockerSummary();

  printSection("Repository", [
    `branch: ${git.branch}`,
    `working tree clean: ${git.clean ? "yes" : "no"}`,
    `node available: ${commandAvailable("node") ? "yes" : "no"}`,
    `pnpm available: ${commandAvailable("pnpm") ? "yes" : "no"}`
  ]);

  printSection(
    "Environment files",
    envFiles.map(([file, exists]) => `${file}: ${exists ? "present" : "missing"}`)
  );

  printSection(
    "Workspace scripts",
    scripts.map(({ file, scripts: packageScripts }) => `${file}: ${packageScripts.join(", ")}`)
  );

  if (!docker.available) {
    printSection("Docker", ["docker is not installed"]);
    return;
  }

  if (!docker.running) {
    printSection("Docker", ["docker compose is available but no services are currently running"]);
    return;
  }

  printSection(
    "Docker",
    docker.services.map((service) => `${service.service}: ${service.state}`)
  );
}

main();
