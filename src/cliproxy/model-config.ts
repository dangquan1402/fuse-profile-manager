/**
 * Model Configuration - Interactive model selection for CLI Proxy providers
 *
 * Handles first-run configuration and explicit --config flag.
 * Persists user selection to ~/.ccs/{provider}.settings.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { InteractivePrompt } from '../utils/prompt';
import { getProviderCatalog, supportsModelConfig, ModelEntry } from './model-catalog';
import { getProviderSettingsPath, getClaudeEnvVars } from './config-generator';
import { CLIProxyProvider } from './types';

/** CCS directory */
const CCS_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '', '.ccs');

/**
 * Check if provider has user settings configured
 */
export function hasUserSettings(provider: CLIProxyProvider): boolean {
  const settingsPath = getProviderSettingsPath(provider);
  return fs.existsSync(settingsPath);
}

/**
 * Get current model from user settings
 */
export function getCurrentModel(provider: CLIProxyProvider): string | undefined {
  const settingsPath = getProviderSettingsPath(provider);
  if (!fs.existsSync(settingsPath)) return undefined;

  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    return settings.env?.ANTHROPIC_MODEL;
  } catch {
    return undefined;
  }
}

/**
 * Format model entry for display
 */
function formatModelOption(model: ModelEntry): string {
  const tierLabel = model.tier === 'paid' ? ' [paid]' : '';
  return `${model.name} (${model.id})${tierLabel}`;
}

/**
 * Configure model for provider (interactive)
 *
 * @param provider CLIProxy provider (agy, gemini)
 * @param force Force reconfiguration even if settings exist
 * @returns true if configuration was performed, false if skipped
 */
export async function configureProviderModel(
  provider: CLIProxyProvider,
  force: boolean = false
): Promise<boolean> {
  // Check if provider supports model configuration
  if (!supportsModelConfig(provider)) {
    return false;
  }

  const catalog = getProviderCatalog(provider);
  if (!catalog) return false;

  const settingsPath = getProviderSettingsPath(provider);

  // Skip if already configured (unless --config flag)
  if (!force && fs.existsSync(settingsPath)) {
    return false;
  }

  // Build options list
  const options = catalog.models.map((m) => ({
    id: m.id,
    label: formatModelOption(m),
  }));

  // Find default index
  const defaultIdx = catalog.models.findIndex((m) => m.id === catalog.defaultModel);
  const safeDefaultIdx = defaultIdx >= 0 ? defaultIdx : 0;

  // Show header
  console.error('');
  console.error(`[i] Configure ${catalog.displayName} model`);

  // Interactive selection
  const selectedModel = await InteractivePrompt.selectFromList('Select model:', options, {
    defaultIndex: safeDefaultIdx,
  });

  // Get base env vars to preserve haiku model and base URL
  const baseEnv = getClaudeEnvVars(provider);

  // Build settings with selected model
  const settings = {
    env: {
      ...baseEnv,
      ANTHROPIC_MODEL: selectedModel,
      ANTHROPIC_DEFAULT_OPUS_MODEL: selectedModel,
      ANTHROPIC_DEFAULT_SONNET_MODEL: selectedModel,
      // Keep haiku as-is from base config (usually flash model)
    },
  };

  // Ensure CCS directory exists
  if (!fs.existsSync(CCS_DIR)) {
    fs.mkdirSync(CCS_DIR, { recursive: true });
  }

  // Write settings file
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

  // Find display name
  const selectedEntry = catalog.models.find((m) => m.id === selectedModel);
  const displayName = selectedEntry?.name || selectedModel;

  console.error('');
  console.error(`[OK] Model set to: ${displayName} (${selectedModel})`);
  console.error(`[i] Saved to: ${settingsPath}`);
  console.error('');

  return true;
}

/**
 * Show current model configuration
 */
export function showCurrentConfig(provider: CLIProxyProvider): void {
  if (!supportsModelConfig(provider)) {
    console.error(`[i] Provider ${provider} does not support model configuration`);
    return;
  }

  const catalog = getProviderCatalog(provider);
  if (!catalog) return;

  const currentModel = getCurrentModel(provider);
  const settingsPath = getProviderSettingsPath(provider);

  console.error('');
  console.error(`[i] ${catalog.displayName} Model Configuration`);
  console.error('');

  if (currentModel) {
    const entry = catalog.models.find((m) => m.id === currentModel);
    const displayName = entry?.name || 'Unknown';
    console.error(`  Current: ${displayName} (${currentModel})`);
    console.error(`  Config:  ${settingsPath}`);
  } else {
    console.error(`  Current: (using defaults)`);
    console.error(`  Default: ${catalog.defaultModel}`);
  }

  console.error('');
  console.error('Available models:');
  catalog.models.forEach((m) => {
    const isCurrent = m.id === currentModel;
    const marker = isCurrent ? '>' : ' ';
    console.error(`  ${marker} ${formatModelOption(m)}`);
  });

  console.error('');
  console.error(`Run "ccs ${provider} --config" to change`);
  console.error('');
}
