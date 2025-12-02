/**
 * Profile Command Handler
 *
 * Manages CCS profiles for custom API providers.
 * Commands: create, list
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  initUI,
  header,
  subheader,
  color,
  dim,
  ok,
  fail,
  warn,
  info,
  table,
  infoBox,
} from '../utils/ui';
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
  await initUI();
  const parsedArgs = parseArgs(args);

  console.log(header('Create API Profile'));
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
      console.log(fail(error));
      process.exit(1);
    }
  }

  // Check if exists
  if (profileExists(name) && !parsedArgs.force) {
    console.log(fail(`Profile '${name}' already exists`));
    console.log(`    Use ${color('--force', 'command')} to overwrite`);
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
      console.log(fail(error));
      process.exit(1);
    }
  }

  // Step 3: API Key
  let apiKey = parsedArgs.apiKey;
  if (!apiKey) {
    apiKey = await InteractivePrompt.password('API Key');
    if (!apiKey) {
      console.log(fail('API key is required'));
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
  console.log(info('Creating profile...'));

  try {
    const settingsPath = createSettingsFile(name, baseUrl, apiKey, model);
    updateConfig(name, settingsPath);

    console.log('');
    console.log(
      infoBox(
        `Profile:  ${name}\n` +
          `Settings: ~/.ccs/${name}.settings.json\n` +
          `Base URL: ${baseUrl}\n` +
          `Model:    ${model}`,
        'Profile Created'
      )
    );
    console.log('');
    console.log(header('Usage'));
    console.log(`  ${color(`ccs ${name} "your prompt"`, 'command')}`);
    console.log('');
  } catch (error) {
    console.log(fail(`Failed to create profile: ${(error as Error).message}`));
    process.exit(1);
  }
}

/**
 * Check if profile has real API key (not placeholder)
 */
function isProfileConfigured(profileName: string): boolean {
  try {
    const ccsDir = getCcsDir();
    const settingsPath = path.join(ccsDir, `${profileName}.settings.json`);
    if (!fs.existsSync(settingsPath)) return false;

    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    const token = settings?.env?.ANTHROPIC_AUTH_TOKEN || '';
    // Check if it's a placeholder or empty
    return token.length > 0 && !token.includes('YOUR_') && !token.includes('your-');
  } catch {
    return false;
  }
}

/**
 * Handle 'ccs profile list' command
 */
async function handleList(): Promise<void> {
  await initUI();

  console.log(header('CCS Profiles'));
  console.log('');

  try {
    const config = loadConfig();
    const profiles = Object.keys(config.profiles);

    if (profiles.length === 0) {
      console.log(warn('No profiles configured'));
      console.log('');
      console.log('To create a profile:');
      console.log(`  ${color('ccs profile create', 'command')}`);
      console.log('');
      return;
    }

    // Build table data with status indicators
    const rows: string[][] = profiles.map((name) => {
      const settingsPath = config.profiles[name];
      const status = isProfileConfigured(name) ? color('[OK]', 'success') : color('[!]', 'warning');

      return [name, settingsPath, status];
    });

    // Print table
    console.log(
      table(rows, {
        head: ['Profile', 'Settings File', 'Status'],
        colWidths: [15, 35, 10],
      })
    );
    console.log('');

    // Show CLIProxy variants if any
    if (config.cliproxy && Object.keys(config.cliproxy).length > 0) {
      console.log(subheader('CLIProxy Variants'));
      const cliproxyRows = Object.entries(config.cliproxy).map(([name, v]) => {
        const variant = v as { provider: string; settings: string };
        return [name, variant.provider, variant.settings];
      });

      console.log(
        table(cliproxyRows, {
          head: ['Variant', 'Provider', 'Settings'],
          colWidths: [15, 15, 30],
        })
      );
      console.log('');
    }

    console.log(dim(`Total: ${profiles.length} profile(s)`));
    console.log('');
  } catch (error) {
    console.log(fail(`Failed to list profiles: ${(error as Error).message}`));
    process.exit(1);
  }
}

/**
 * Handle 'ccs profile remove' command
 */
async function handleRemove(args: string[]): Promise<void> {
  await initUI();
  const parsedArgs = parseArgs(args);

  // Load config first to get available profiles
  let config: { profiles: Record<string, string>; cliproxy?: Record<string, unknown> };
  try {
    config = loadConfig();
  } catch {
    console.log(fail('Failed to load config'));
    process.exit(1);
  }

  const profiles = Object.keys(config.profiles);
  if (profiles.length === 0) {
    console.log(warn('No profiles to remove'));
    process.exit(0);
  }

  // Interactive profile selection if not provided
  let name = parsedArgs.name;
  if (!name) {
    console.log(header('Remove Profile'));
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
    console.log(fail(`Profile '${name}' not found`));
    console.log('');
    console.log('Available profiles:');
    profiles.forEach((p) => console.log(`  - ${p}`));
    process.exit(1);
  }

  const settingsPath = config.profiles[name];
  const expandedPath = path.join(getCcsDir(), `${name}.settings.json`);

  // Confirm deletion
  console.log('');
  console.log(`Profile '${color(name, 'command')}' will be removed.`);
  console.log(`  Settings: ${settingsPath}`);
  console.log('');

  const confirmed =
    parsedArgs.yes || (await InteractivePrompt.confirm('Delete this profile?', { default: false }));

  if (!confirmed) {
    console.log(info('Cancelled'));
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

  console.log(ok(`Profile removed: ${name}`));
  console.log('');
}

/**
 * Show help for profile commands
 */
async function showHelp(): Promise<void> {
  await initUI();

  console.log(header('CCS Profile Management'));
  console.log('');
  console.log(subheader('Usage'));
  console.log(`  ${color('ccs profile', 'command')} <command> [options]`);
  console.log('');
  console.log(subheader('Commands'));
  console.log(`  ${color('create [name]', 'command')}    Create new API profile (interactive)`);
  console.log(`  ${color('list', 'command')}             List all profiles`);
  console.log(`  ${color('remove <name>', 'command')}    Remove a profile`);
  console.log('');
  console.log(subheader('Options'));
  console.log(`  ${color('--base-url <url>', 'command')}     API base URL (create)`);
  console.log(`  ${color('--api-key <key>', 'command')}      API key (create)`);
  console.log(`  ${color('--model <model>', 'command')}      Default model (create)`);
  console.log(`  ${color('--force', 'command')}              Overwrite existing (create)`);
  console.log(`  ${color('--yes, -y', 'command')}            Skip confirmation prompts`);
  console.log('');
  console.log(subheader('Examples'));
  console.log(`  ${dim('# Interactive wizard')}`);
  console.log(`  ${color('ccs profile create', 'command')}`);
  console.log('');
  console.log(`  ${dim('# Create with name')}`);
  console.log(`  ${color('ccs profile create myapi', 'command')}`);
  console.log('');
  console.log(`  ${dim('# Remove profile')}`);
  console.log(`  ${color('ccs profile remove myapi', 'command')}`);
  console.log('');
  console.log(`  ${dim('# Show all profiles')}`);
  console.log(`  ${color('ccs profile list', 'command')}`);
  console.log('');
}

/**
 * Main profile command router
 */
export async function handleProfileCommand(args: string[]): Promise<void> {
  const command = args[0];

  if (!command || command === '--help' || command === '-h' || command === 'help') {
    await showHelp();
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
      await initUI();
      console.log(fail(`Unknown command: ${command}`));
      console.log('');
      console.log('Run for help:');
      console.log(`  ${color('ccs profile --help', 'command')}`);
      process.exit(1);
  }
}
