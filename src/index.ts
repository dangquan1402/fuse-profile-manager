#!/usr/bin/env node

/**
 * FuseAPI CLI - Ultra-minimal CLI for FuseAPI with Claude Code
 * Commands:
 *   fuseapi setup - Configure FuseAPI credentials
 *   fuseapi - Launch Claude Code with FuseAPI
 *   fuseapi doctor - Check health
 *   fuseapi config - Show config
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as readline from 'readline';

// ========== Config Management ==========

const CONFIG_DIR = path.join(os.homedir(), '.fuseapi');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

interface ProfileConfig {
  endpoint: string;
  apiKey: string;
}

interface Config {
  version: number;
  default: string;
  profiles: Record<string, ProfileConfig>;
}

interface LegacyConfig {
  endpoint: string;
  apiKey: string;
}

function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function loadConfig(): Config | null {
  if (!fs.existsSync(CONFIG_FILE)) {
    return null;
  }
  try {
    const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const parsed = JSON.parse(data);

    // Auto-migrate old format
    if (!parsed.version) {
      const migrated = migrateConfig(parsed);
      saveConfig(migrated);
      console.log('[i] Configuration migrated to multi-profile format');
      return migrated;
    }

    return parsed;
  } catch (error) {
    console.error('[!] Failed to load config:', error);
    return null;
  }
}

function saveConfig(config: Config): void {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function migrateConfig(oldConfig: LegacyConfig): Config {
  // Old format: { endpoint, apiKey }
  // New format: { version, default, profiles: { ... } }
  return {
    version: 1,
    default: 'fuse',
    profiles: {
      fuse: {
        endpoint: oldConfig.endpoint,
        apiKey: oldConfig.apiKey
      }
    }
  };
}

function detectProfile(args: string[]): { profile: string; remainingArgs: string[] } {
  // Check if first arg is a profile name
  const firstArg = args[0];

  if (!firstArg || firstArg.startsWith('-')) {
    // No profile specified, use default
    return { profile: 'default', remainingArgs: args };
  }

  const config = loadConfig();
  if (config && config.profiles[firstArg]) {
    // First arg is a valid profile name
    return { profile: firstArg, remainingArgs: args.slice(1) };
  }

  // First arg is not a profile, treat as Claude argument
  return { profile: 'default', remainingArgs: args };
}

// ========== UI Helpers ==========

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// ========== Commands ==========

async function cmdSetup(args: string[]): Promise<void> {
  console.log('\n=== FuseAPI Setup ===\n');

  // Parse CLI args
  let endpoint = 'https://api.fuseapi.app';
  let apiKey = '';
  let profileName = 'fuse';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--endpoint' && args[i + 1]) {
      endpoint = args[++i];
    } else if (args[i] === '--api-key' && args[i + 1]) {
      apiKey = args[++i];
    } else if (args[i] === '--profile' && args[i + 1]) {
      profileName = args[++i];
    }
  }

  // Interactive prompts if not provided
  if (!apiKey) {
    const currentConfig = loadConfig();
    const defaultEndpoint = currentConfig?.profiles?.fuse?.endpoint || endpoint;

    endpoint = await prompt(`API Endpoint [${defaultEndpoint}]: `) || defaultEndpoint;
    apiKey = await prompt('API Key: ');
  }

  if (!apiKey) {
    console.error('[!] API Key is required');
    process.exit(1);
  }

  // Load or create config
  let config = loadConfig();
  if (!config) {
    config = {
      version: 1,
      default: profileName,
      profiles: {}
    };
  }

  // Add/update profile
  config.profiles[profileName] = { endpoint, apiKey };
  if (!config.default) {
    config.default = profileName;
  }

  saveConfig(config);

  console.log('\n[OK] Configuration saved!');
  console.log(`     Profile: ${profileName}`);
  console.log(`     Endpoint: ${endpoint}`);
  console.log(`     API Key: ${apiKey.substring(0, 12)}...`);
  console.log(`\nRun "fuseapi${profileName === 'fuse' ? '' : ' ' + profileName}" to start using this profile\n`);
}

async function cmdDoctor(): Promise<void> {
  console.log('\n=== FuseAPI Health Check ===\n');

  // Check config
  const config = loadConfig();
  if (!config) {
    console.log('[!] No configuration found');
    console.log('    Run "fuseapi setup" to configure FuseAPI\n');
    process.exit(1);
  }

  console.log('[OK] Configuration exists');
  console.log(`     Profiles: ${Object.keys(config.profiles).join(', ')}`);
  console.log(`     Default: ${config.default}`);

  // Show each profile
  Object.entries(config.profiles).forEach(([name, profile]) => {
    console.log(`\n     Profile: ${name}`);
    console.log(`       Endpoint: ${profile.endpoint}`);
    console.log(`       API Key: ${profile.apiKey.substring(0, 12)}...`);
  });

  // Check Claude CLI
  try {
    const { execSync } = require('child_process');
    const checkCmd = process.platform === 'win32' ? 'where claude' : 'which claude';
    execSync(checkCmd, { stdio: 'ignore' });
    console.log('\n[OK] Claude CLI found');
  } catch {
    console.log('\n[!] Claude CLI not found');
    console.log('    Install: npm install -g @anthropic-ai/claude-code');
  }

  console.log('\n[OK] All checks passed!\n');
}

async function cmdConfig(): Promise<void> {
  const config = loadConfig();
  if (!config) {
    console.log('\n[!] No configuration found');
    console.log('    Run "fuseapi setup" to configure FuseAPI\n');
    process.exit(1);
  }

  console.log('\n=== FuseAPI Configuration ===\n');
  console.log(`Default Profile: ${config.default}`);
  console.log(`\nProfiles:`);

  Object.entries(config.profiles).forEach(([name, profile]) => {
    const isDefault = name === config.default;
    const marker = isDefault ? ' (default)' : '';
    console.log(`\n  ${name}${marker}`);
    console.log(`    Endpoint: ${profile.endpoint}`);
    console.log(`    API Key:  ${profile.apiKey.substring(0, 12)}...`);
  });

  console.log(`\nConfig file: ${CONFIG_FILE}\n`);
}

async function cmdLaunch(profile: string, args: string[]): Promise<void> {
  // Load config
  const config = loadConfig();
  if (!config) {
    console.error('\n[!] No configuration found');
    console.error('    Run "fuseapi setup" to configure FuseAPI\n');
    process.exit(1);
  }

  // Resolve profile (use default if 'default')
  const profileName = profile === 'default' ? (config.default || 'fuse') : profile;
  const profileConfig = config.profiles[profileName];

  if (!profileConfig) {
    console.error(`\n[!] Profile "${profileName}" not found`);
    console.error(`    Available profiles: ${Object.keys(config.profiles).join(', ')}\n`);
    process.exit(1);
  }

  // Set environment variables
  // Use ANTHROPIC_AUTH_TOKEN instead of ANTHROPIC_API_KEY to avoid conflicts with claude.ai login
  const env = {
    ...process.env,
    ANTHROPIC_BASE_URL: profileConfig.endpoint,
    ANTHROPIC_AUTH_TOKEN: profileConfig.apiKey,
  };

  // Launch Claude Code
  console.log(`[i] Launching Claude Code with ${profileName} profile...\n`);

  const claudeProcess = spawn('claude', args, {
    env,
    stdio: 'inherit',
    shell: process.platform === 'win32', // Required for Windows to find npm global binaries
  });

  claudeProcess.on('error', (error) => {
    console.error('\n[!] Failed to launch Claude Code:', error.message);
    console.error('    Make sure Claude CLI is installed: npm install -g @anthropic-ai/claude-code\n');
    process.exit(1);
  });

  claudeProcess.on('exit', (code) => {
    process.exit(code || 0);
  });
}

function showHelp(): void {
  console.log(`
FuseAPI CLI - Ultra-minimal CLI for FuseAPI with Claude Code

USAGE:
  fuseapi setup [--endpoint URL] [--api-key KEY]   Configure FuseAPI credentials
  fuseapi [prompt]                                  Launch Claude Code with FuseAPI
  fuseapi doctor                                    Check configuration health
  fuseapi config                                    Show current configuration
  fuseapi --help                                    Show this help

EXAMPLES:
  fuseapi setup                                     Interactive setup
  fuseapi setup --endpoint https://api.fuseapi.app --api-key fuse_xxx
  fuseapi                                           Launch Claude Code
  fuseapi "help me debug this code"                 Launch with prompt
  fuseapi doctor                                    Health check

CONFIG:
  Configuration is stored in: ${CONFIG_FILE}
  `);
}

// ========== Main ==========

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    await cmdLaunch('default', []);
    return;
  }

  const command = args[0];

  switch (command) {
    case 'setup':
      await cmdSetup(args.slice(1));
      break;
    case 'doctor':
      await cmdDoctor();
      break;
    case 'config':
      await cmdConfig();
      break;
    case '--help':
    case '-h':
    case 'help':
      showHelp();
      break;
    default:
      // Detect profile from args or use default
      const { profile, remainingArgs } = detectProfile(args);
      await cmdLaunch(profile, remainingArgs);
      break;
  }
}

main().catch((error) => {
  console.error('[!] Error:', error.message);
  process.exit(1);
});
