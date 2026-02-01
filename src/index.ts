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

interface Config {
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
    return JSON.parse(data);
  } catch (error) {
    console.error('[!] Failed to load config:', error);
    return null;
  }
}

function saveConfig(config: Config): void {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
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

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--endpoint' && args[i + 1]) {
      endpoint = args[++i];
    } else if (args[i] === '--api-key' && args[i + 1]) {
      apiKey = args[++i];
    }
  }

  // Interactive prompts if not provided
  if (!apiKey) {
    const currentConfig = loadConfig();
    const defaultEndpoint = currentConfig?.endpoint || endpoint;

    endpoint = await prompt(`API Endpoint [${defaultEndpoint}]: `) || defaultEndpoint;
    apiKey = await prompt('API Key: ');
  }

  if (!apiKey) {
    console.error('[!] API Key is required');
    process.exit(1);
  }

  // Save config
  saveConfig({ endpoint, apiKey });

  console.log('\n[OK] Configuration saved!');
  console.log(`     Endpoint: ${endpoint}`);
  console.log(`     API Key: ${apiKey.substring(0, 12)}...`);
  console.log('\nRun "fuseapi" to start using FuseAPI with Claude Code\n');
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
  console.log(`     Endpoint: ${config.endpoint}`);
  console.log(`     API Key: ${config.apiKey.substring(0, 12)}...`);

  // Check Claude CLI
  try {
    const { execSync } = require('child_process');
    execSync('which claude', { stdio: 'ignore' });
    console.log('[OK] Claude CLI found');
  } catch {
    console.log('[!] Claude CLI not found');
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
  console.log(`Endpoint: ${config.endpoint}`);
  console.log(`API Key:  ${config.apiKey.substring(0, 12)}...`);
  console.log(`\nConfig file: ${CONFIG_FILE}\n`);
}

async function cmdLaunch(args: string[]): Promise<void> {
  // Load config
  const config = loadConfig();
  if (!config) {
    console.error('\n[!] No configuration found');
    console.error('    Run "fuseapi setup" to configure FuseAPI\n');
    process.exit(1);
  }

  // Set environment variables
  // Use ANTHROPIC_AUTH_TOKEN instead of ANTHROPIC_API_KEY to avoid conflicts with claude.ai login
  const env = {
    ...process.env,
    ANTHROPIC_BASE_URL: config.endpoint,
    ANTHROPIC_AUTH_TOKEN: config.apiKey,
  };

  // Launch Claude Code
  console.log('[i] Launching Claude Code with FuseAPI...\n');

  const claudeProcess = spawn('claude', args, {
    env,
    stdio: 'inherit',
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
    await cmdLaunch([]);
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
      // Treat as Claude Code arguments
      await cmdLaunch(args);
      break;
  }
}

main().catch((error) => {
  console.error('[!] Error:', error.message);
  process.exit(1);
});
