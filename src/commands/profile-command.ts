/**
 * Profile Command Handler
 *
 * Manages CCS profiles for custom API providers.
 * Commands: create, list
 */

import * as fs from 'fs';
import * as path from 'path';
import { colored } from '../utils/helpers';
import { InteractivePrompt } from '../utils/prompt';
import { getCcsDir, getConfigPath, loadConfig } from '../utils/config-manager';

interface ProfileCommandArgs {
  name?: string;
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  force?: boolean;
  yes?: boolean;
}

/**
 * Parse command line arguments for profile commands
 */
function parseArgs(args: string[]): ProfileCommandArgs {
  const result: ProfileCommandArgs = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--base-url' && args[i + 1]) {
      result.baseUrl = args[++i];
    } else if (arg === '--api-key' && args[i + 1]) {
      result.apiKey = args[++i];
    } else if (arg === '--model' && args[i + 1]) {
      result.model = args[++i];
    } else if (arg === '--force') {
      result.force = true;
    } else if (arg === '--yes' || arg === '-y') {
      result.yes = true;
    } else if (!arg.startsWith('-') && !result.name) {
      result.name = arg;
    }
  }

  return result;
}

/**
 * Validate profile name
 */
function validateProfileName(name: string): string | null {
  if (!name) {
    return 'Profile name is required';
  }
  if (!/^[a-zA-Z][a-zA-Z0-9._-]*$/.test(name)) {
    return 'Profile name must start with letter, contain only letters, numbers, dot, dash, underscore';
  }
  if (name.length > 32) {
    return 'Profile name must be 32 characters or less';
  }
  // Reserved names
  const reserved = ['default', 'auth', 'profile', 'doctor', 'sync', 'update', 'help', 'version'];
  if (reserved.includes(name.toLowerCase())) {
    return `'${name}' is a reserved name`;
  }
  return null;
}

/**
 * Validate URL format
 */
function validateUrl(url: string): string | null {
  if (!url) {
    return 'Base URL is required';
  }
  try {
    new URL(url);
    return null;
  } catch {
    return 'Invalid URL format (must include protocol, e.g., https://)';
  }
}

/**
 * Check if profile already exists in config.json
 */
function profileExists(name: string): boolean {
  try {
    const config = loadConfig();
    return name in config.profiles;
  } catch {
    return false;
  }
}

/**
 * Create settings.json file for profile
 */
function createSettingsFile(name: string, baseUrl: string, apiKey: string, model: string): string {
  const ccsDir = getCcsDir();
  const settingsPath = path.join(ccsDir, `${name}.settings.json`);

  const settings = {
    env: {
      ANTHROPIC_BASE_URL: baseUrl,
      ANTHROPIC_AUTH_TOKEN: apiKey,
      ANTHROPIC_MODEL: model,
    },
  };

  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf8');
  return settingsPath;
}

/**
 * Update config.json with new profile
 */
function updateConfig(name: string, _settingsPath: string): void {
  const configPath = getConfigPath();
  const ccsDir = getCcsDir();

  // Read existing config or create new
  let config: { profiles: Record<string, string>; cliproxy?: Record<string, unknown> };
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    config = { profiles: {} };
  }

  // Use relative path with ~ for portability
  const relativePath = `~/.ccs/${name}.settings.json`;
  config.profiles[name] = relativePath;

  // Ensure directory exists
  if (!fs.existsSync(ccsDir)) {
    fs.mkdirSync(ccsDir, { recursive: true });
  }

  // Write config atomically (write to temp, then rename)
  const tempPath = configPath + '.tmp';
  fs.writeFileSync(tempPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
  fs.renameSync(tempPath, configPath);
}

/**
 * Handle 'ccs profile create' command
 */
async function handleCreate(args: string[]): Promise<void> {
  const parsedArgs = parseArgs(args);

  console.log(colored('Create API Profile', 'bold'));
  console.log('');

  // Step 1: Profile name
  let name = parsedArgs.name;
  if (!name) {
    name = await InteractivePrompt.input('Profile name', {
      validate: validateProfileName,
    });
  } else {
    const error = validateProfileName(name);
    if (error) {
      console.error(`[X] ${error}`);
      process.exit(1);
    }
  }

  // Check if exists
  if (profileExists(name) && !parsedArgs.force) {
    console.error(`[X] Profile '${name}' already exists`);
    console.log(`    Use ${colored('--force', 'yellow')} to overwrite`);
    process.exit(1);
  }

  // Step 2: Base URL
  let baseUrl = parsedArgs.baseUrl;
  if (!baseUrl) {
    baseUrl = await InteractivePrompt.input('API Base URL (e.g., https://api.example.com)', {
      validate: validateUrl,
    });
  } else {
    const error = validateUrl(baseUrl);
    if (error) {
      console.error(`[X] ${error}`);
      process.exit(1);
    }
  }

  // Step 3: API Key
  let apiKey = parsedArgs.apiKey;
  if (!apiKey) {
    apiKey = await InteractivePrompt.password('API Key');
    if (!apiKey) {
      console.error('[X] API key is required');
      process.exit(1);
    }
  }

  // Step 4: Model (optional)
  const defaultModel = 'claude-sonnet-4-5-20250929';
  let model = parsedArgs.model;
  if (!model && !parsedArgs.yes) {
    model = await InteractivePrompt.input('Default model', {
      default: defaultModel,
    });
  }
  model = model || defaultModel;

  // Create files
  console.log('');
  console.log('[i] Creating profile...');

  try {
    const settingsPath = createSettingsFile(name, baseUrl, apiKey, model);
    updateConfig(name, settingsPath);

    console.log(colored('[OK] Profile created successfully', 'green'));
    console.log('');
    console.log(`  Profile:  ${name}`);
    console.log(`  Settings: ~/.ccs/${name}.settings.json`);
    console.log(`  Base URL: ${baseUrl}`);
    console.log(`  Model:    ${model}`);
    console.log('');
    console.log(colored('Usage:', 'cyan'));
    console.log(`  ${colored(`ccs ${name} "your prompt"`, 'yellow')}`);
    console.log('');
  } catch (error) {
    console.error(`[X] Failed to create profile: ${(error as Error).message}`);
    process.exit(1);
  }
}

/**
 * Handle 'ccs profile list' command
 */
async function handleList(): Promise<void> {
  console.log(colored('CCS Profiles', 'bold'));
  console.log('');

  try {
    const config = loadConfig();
    const profiles = Object.keys(config.profiles);

    if (profiles.length === 0) {
      console.log(colored('No profiles configured', 'yellow'));
      console.log('');
      console.log('To create a profile:');
      console.log(`  ${colored('ccs profile create', 'yellow')}`);
      console.log('');
      return;
    }

    console.log(colored('Settings-based Profiles:', 'cyan'));
    // Calculate max name length for alignment
    const maxNameLen = Math.max(...profiles.map((n) => n.length));
    profiles.forEach((name) => {
      const settingsPath = config.profiles[name];
      const paddedName = name.padEnd(maxNameLen);
      console.log(`  ${colored(paddedName, 'yellow')}  ${settingsPath}`);
    });
    console.log('');

    // Also show CLIProxy profiles if any
    if (config.cliproxy && Object.keys(config.cliproxy).length > 0) {
      console.log(colored('CLIProxy Variants:', 'cyan'));
      Object.entries(config.cliproxy).forEach(([name, variant]) => {
        const v = variant as { provider: string; settings: string };
        console.log(`  ${colored(name, 'yellow')}  →  ${v.provider} (${v.settings})`);
      });
      console.log('');
    }

    console.log(`Total: ${profiles.length} profile(s)`);
    console.log('');
  } catch (error) {
    console.error(`[X] Failed to list profiles: ${(error as Error).message}`);
    process.exit(1);
  }
}

/**
 * Handle 'ccs profile remove' command
 */
async function handleRemove(args: string[]): Promise<void> {
  const parsedArgs = parseArgs(args);

  // Load config first to get available profiles
  let config: { profiles: Record<string, string>; cliproxy?: Record<string, unknown> };
  try {
    config = loadConfig();
  } catch {
    console.error('[X] Failed to load config');
    process.exit(1);
  }

  const profiles = Object.keys(config.profiles);
  if (profiles.length === 0) {
    console.log(colored('No profiles to remove', 'yellow'));
    process.exit(0);
  }

  // Interactive profile selection if not provided
  let name = parsedArgs.name;
  if (!name) {
    console.log(colored('Remove Profile', 'bold'));
    console.log('');
    console.log('Available profiles:');
    profiles.forEach((p, i) => console.log(`  ${i + 1}. ${p}`));
    console.log('');

    name = await InteractivePrompt.input('Profile name to remove', {
      validate: (val) => {
        if (!val) return 'Profile name is required';
        if (!profiles.includes(val)) return `Profile '${val}' not found`;
        return null;
      },
    });
  }

  if (!(name in config.profiles)) {
    console.error(`[X] Profile '${name}' not found`);
    console.log('');
    console.log('Available profiles:');
    profiles.forEach((p) => console.log(`  - ${p}`));
    process.exit(1);
  }

  const settingsPath = config.profiles[name];
  const expandedPath = path.join(getCcsDir(), `${name}.settings.json`);

  // Confirm deletion
  console.log('');
  console.log(`Profile '${colored(name, 'yellow')}' will be removed.`);
  console.log(`  Settings: ${settingsPath}`);
  console.log('');

  const confirmed =
    parsedArgs.yes || (await InteractivePrompt.confirm('Delete this profile?', { default: false }));

  if (!confirmed) {
    console.log('[i] Cancelled');
    process.exit(0);
  }

  // Remove from config.json
  delete config.profiles[name];
  const configPath = getConfigPath();
  const tempPath = configPath + '.tmp';
  fs.writeFileSync(tempPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
  fs.renameSync(tempPath, configPath);

  // Remove settings file if it exists
  if (fs.existsSync(expandedPath)) {
    fs.unlinkSync(expandedPath);
  }

  console.log(colored('[OK] Profile removed', 'green'));
  console.log(`    Profile: ${name}`);
  console.log('');
}

/**
 * Show help for profile commands
 */
function showHelp(): void {
  console.log(colored('CCS Profile Management', 'bold'));
  console.log('');
  console.log(colored('Usage:', 'cyan'));
  console.log(`  ${colored('ccs profile', 'yellow')} <command> [options]`);
  console.log('');
  console.log(colored('Commands:', 'cyan'));
  console.log(`  ${colored('create [name]', 'yellow')}    Create new API profile (interactive)`);
  console.log(`  ${colored('list', 'yellow')}             List all profiles`);
  console.log(`  ${colored('remove <name>', 'yellow')}    Remove a profile`);
  console.log('');
  console.log(colored('Options:', 'cyan'));
  console.log(`  ${colored('--base-url <url>', 'yellow')}     API base URL (create)`);
  console.log(`  ${colored('--api-key <key>', 'yellow')}      API key (create)`);
  console.log(`  ${colored('--model <model>', 'yellow')}      Default model (create)`);
  console.log(`  ${colored('--force', 'yellow')}              Overwrite existing (create)`);
  console.log(`  ${colored('--yes, -y', 'yellow')}            Skip confirmation prompts`);
  console.log('');
  console.log(colored('Examples:', 'cyan'));
  console.log(`  ${colored('ccs profile create', 'yellow')}              # Interactive wizard`);
  console.log(`  ${colored('ccs profile create myapi', 'yellow')}        # Create with name`);
  console.log(`  ${colored('ccs profile remove myapi', 'yellow')}        # Remove profile`);
  console.log(`  ${colored('ccs profile list', 'yellow')}                # Show all profiles`);
  console.log('');
}

/**
 * Main profile command router
 */
export async function handleProfileCommand(args: string[]): Promise<void> {
  const command = args[0];

  if (!command || command === '--help' || command === '-h' || command === 'help') {
    showHelp();
    return;
  }

  switch (command) {
    case 'create':
      await handleCreate(args.slice(1));
      break;
    case 'list':
      await handleList();
      break;
    case 'remove':
    case 'delete':
    case 'rm':
      await handleRemove(args.slice(1));
      break;
    default:
      console.error(`[X] Unknown command: ${command}`);
      console.log('');
      console.log('Run for help:');
      console.log(`  ${colored('ccs profile --help', 'yellow')}`);
      process.exit(1);
  }
}
