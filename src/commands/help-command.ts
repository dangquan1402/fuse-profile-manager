import { initUI, box, header, color, dim } from '../utils/ui';

// Version is read from VERSION file during build
const VERSION = '5.3.0';

/**
 * Print a section with header and items
 */
function printSection(title: string, subtitle: string, items: [string, string][]): void {
  // Header with optional subtitle
  const headerText = subtitle ? `${title}  ${dim(subtitle)}` : title;
  console.log(header(headerText));

  // Calculate max command length for alignment
  const maxCmdLen = Math.max(...items.map(([cmd]) => cmd.length));

  for (const [cmd, desc] of items) {
    const paddedCmd = cmd.padEnd(maxCmdLen + 2);
    console.log(`  ${color(paddedCmd, 'command')} ${desc}`);
  }

  console.log('');
}

/**
 * Display comprehensive help information for CCS (Claude Code Switch)
 */
export async function handleHelpCommand(): Promise<void> {
  // Initialize UI (if not already)
  await initUI();

  // Hero box with title
  console.log(
    box(`CCS v${VERSION}\nClaude Code Profile & Model Switcher`, {
      padding: 1,
      borderStyle: 'round',
      titleAlignment: 'center',
    })
  );
  console.log('');

  // Usage section
  console.log(header('USAGE'));
  console.log(`  $ ${color('ccs', 'command')} <profile> [flags] [-- claude-args...]`);
  console.log(`  $ ${color('ccs', 'command')} [flags]`);
  console.log('');

  // API Key Profiles section
  printSection('API KEY PROFILES', 'Configure: ~/.ccs/*.settings.json', [
    ['ccs', 'Use default Claude account'],
    ['ccs glm', 'GLM-4.6 via Zhipu AI'],
    ['ccs glmt', 'GLM-4.6 (Turbo mode)'],
    ['ccs kimi', 'Kimi via Moonshot AI'],
  ]);

  // Profile management section
  printSection('PROFILE MANAGEMENT', '', [
    ['ccs profile create', 'Create custom API profile'],
    ['ccs profile list', 'List all profiles'],
    ['ccs profile remove', 'Remove a profile'],
  ]);

  // Account management section
  printSection('ACCOUNT MANAGEMENT', 'Multiple Claude accounts', [
    ['ccs auth create <name>', 'Create new account'],
    ['ccs auth list', 'List all accounts'],
    ['ccs auth default <name>', 'Set default account'],
  ]);

  // OAuth section
  printSection('OAUTH PROVIDERS', 'Zero config, browser auth', [
    ['ccs gemini', 'Google Gemini (gemini-2.5-pro)'],
    ['ccs codex', 'OpenAI Codex (gpt-5.1-codex-max)'],
    ['ccs agy', 'Antigravity (gemini-3-pro-preview)'],
    ['ccs qwen', 'Qwen Code (qwen3-coder)'],
  ]);

  // OAuth flags
  console.log(header('OAUTH FLAGS'));
  console.log(`  ${color('ccs <provider> --auth', 'command')}        Authenticate only`);
  console.log(`  ${color('ccs <provider> --logout', 'command')}      Clear authentication`);
  console.log(`  ${color('ccs <provider> --headless', 'command')}    Headless auth (for SSH)`);
  console.log('');

  // Delegation section
  printSection('DELEGATION', 'Inside Claude Code CLI', [
    ['/ccs "task"', 'Delegate (auto-select profile)'],
    ['/ccs --glm "task"', 'Force GLM-4.6'],
    ['/ccs --kimi "task"', 'Force Kimi'],
    ['/ccs:continue', 'Continue last delegation'],
  ]);

  // Diagnostics section
  printSection('DIAGNOSTICS', '', [
    ['ccs doctor', 'Run health check'],
    ['ccs sync', 'Sync delegation commands'],
    ['ccs update', 'Update to latest version'],
  ]);

  // Flags section
  console.log(header('FLAGS'));
  console.log(`  ${color('-h, --help', 'command')}              Show this help`);
  console.log(`  ${color('-v, --version', 'command')}           Show version`);
  console.log(`  ${color('-sc, --shell-completion', 'command')} Install shell completion`);
  console.log('');

  // Configuration paths
  console.log(header('CONFIGURATION'));
  console.log(`  Config:     ${color('~/.ccs/config.json', 'path')}`);
  console.log(`  Profiles:   ${color('~/.ccs/profiles.json', 'path')}`);
  console.log(`  Settings:   ${color('~/.ccs/*.settings.json', 'path')}`);
  console.log(`  CLIProxy:   ${color('~/.ccs/cliproxy/', 'path')}`);
  console.log('');

  // Shared Data
  console.log(header('SHARED DATA'));
  console.log(`  Commands:   ${color('~/.ccs/shared/commands/', 'path')}`);
  console.log(`  Skills:     ${color('~/.ccs/shared/skills/', 'path')}`);
  console.log(`  Agents:     ${color('~/.ccs/shared/agents/', 'path')}`);
  console.log(`  ${dim('Note: Symlinked across all profiles')}`);
  console.log('');

  // Examples
  console.log(header('EXAMPLES'));
  console.log(`  ${dim('# Use default account')}`);
  console.log(`  $ ${color('ccs', 'command')}`);
  console.log('');
  console.log(`  ${dim('# OAuth provider (browser auth first time)')}`);
  console.log(`  $ ${color('ccs gemini', 'command')}`);
  console.log('');
  console.log(`  ${dim('# API key model with prompt')}`);
  console.log(`  $ ${color('ccs glm "implement the API"', 'command')}`);
  console.log('');

  // Footer
  console.log(dim('Docs: https://github.com/kaitranntt/ccs'));
  console.log(dim('License: MIT'));
  console.log('');

  // Uninstall
  console.log(color('Uninstall:', 'warning'));
  console.log('  npm uninstall -g @kaitranntt/ccs');
  console.log('');

  process.exit(0);
}
