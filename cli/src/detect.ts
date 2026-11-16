import fs from 'node:fs';
import path from 'node:path';

// Client detection for the Codex CLI integration. `setup-codex` only WRITES a
// config; this module tells the user WHICH client they actually have so the
// setup note can say something true about their machine instead of a generic
// "install X" line. Purely filesystem/PATH based — no network, no spawning
// processes — so it stays fast and testable.

export interface DetectedClient {
  /** `cli` — the `codex` binary is on PATH; `desktop` — the ChatGPT desktop
   *  app is installed (macOS); `both` — self-explanatory. */
  kind: 'cli' | 'desktop' | 'both';
  /** Absolute path of the first `codex` binary found on PATH, when present. */
  cliPath?: string;
  /** Absolute path of the ChatGPT.app bundle, when present. */
  desktopPath?: string;
}

/** Where the ChatGPT desktop app lives per platform. Only macOS ships a
 *  well-known .app bundle; Windows/Linux register no stable path we can
 *  probe cheaply, so those return nothing (a UI integration there would need
 *  registry/freedesktop lookups — out of scope). */
export function desktopAppPath(platform: string = process.platform): string | undefined {
  if (platform !== 'darwin') return undefined;
  return '/Applications/ChatGPT.app';
}

function executableOnPath(name: string, platform: string = process.platform): string | undefined {
  const windows = platform === 'win32';
  const directories = (process.env.PATH ?? '').split(windows ? ';' : path.delimiter).filter(Boolean);
  // Node/npm installs .cmd shims on Windows. Testing only the bare name
  // incorrectly reported that a working Codex CLI was not installed.
  const names = windows ? [name + '.exe', name + '.cmd', name + '.bat', name] : [name];
  for (const dir of directories) {
    for (const binary of names) {
      const candidate = windows ? path.win32.join(dir, binary) : path.posix.join(dir, binary);
      try {
        fs.accessSync(candidate, fs.constants.X_OK);
        if (fs.statSync(candidate).isFile()) return candidate;
      } catch {
        // Not an executable file; keep scanning.
      }
    }
  }
  return undefined;
}

/** Detects the `codex` CLI on PATH and the ChatGPT desktop app on macOS.
 *  Only the `codex` binary is probed: the CLI still ships and runs as
 *  `codex`, and that is the only surface `setup-codex` configures. */
export function detectChatGptClient(
  platform: string = process.platform,
): DetectedClient | undefined {
  const cliPath = executableOnPath('codex', platform);
  const appPath = desktopAppPath(platform);
  const hasDesktop = appPath !== undefined && fs.existsSync(appPath);
  if (cliPath && hasDesktop) return { kind: 'both', cliPath, desktopPath: appPath };
  if (cliPath) return { kind: 'cli', cliPath };
  if (hasDesktop) return { kind: 'desktop', desktopPath: appPath };
  return undefined;
}

/** Human-readable guidance appended to `setup-codex` output. This setup only
 *  writes the Codex CLI config, so the desktop app is reported but never
 *  configured. */
export function clientNotes(client: DetectedClient | undefined): string[] {
  if (!client) {
    return [
      'No Codex CLI detected on this machine.',
      'Install the CLI with: npm install -g @openai/codex',
    ];
  }
  if (client.kind === 'desktop') {
    return [
      `ChatGPT desktop app detected at ${client.desktopPath}; this setup configures the Codex CLI.`,
      'The generated configuration targets the Codex CLI — install it with: npm install -g @openai/codex',
    ];
  }
  if (client.kind === 'both') {
    return [
      `Codex CLI detected at ${client.cliPath}; the configuration above applies to it.`,
      'ChatGPT desktop app also detected; it is not configured by this setup.',
    ];
  }
  return [`Codex CLI detected at ${client.cliPath}; the configuration above applies to it.`];
}
