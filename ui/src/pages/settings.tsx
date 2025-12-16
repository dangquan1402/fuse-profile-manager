/**
 * Settings Page - WebSearch Configuration
 * Simplified toggle-based UI: enable providers you want, we handle the rest
 */

import { useState, useEffect } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Globe,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Copy,
  Check,
  Plus,
  Trash2,
  GripVertical,
  Zap,
  Terminal,
  Server,
} from 'lucide-react';
import { CodeEditor } from '@/components/code-editor';

interface CustomMcpConfig {
  name: string;
  type: 'http' | 'stdio';
  url?: string;
  headers?: Record<string, string>;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
}

interface WebSearchConfig {
  enabled: boolean;
  provider: 'auto' | 'web-search-prime' | 'brave' | 'tavily';
  fallback: boolean;
  gemini?: {
    enabled: boolean;
    timeout: number;
  };
  mode?: 'sequential' | 'parallel';
  selectedProviders?: string[];
  customMcp?: CustomMcpConfig[];
}

interface WebSearchStatus {
  geminiCli: {
    installed: boolean;
    path: string | null;
    version: string | null;
  };
  mcpServers: {
    configured: boolean;
    ccsManaged: string[];
    userAdded: string[];
  };
  readiness: {
    status: 'ready' | 'mcp-only' | 'unavailable';
    message: string;
  };
}

// Built-in providers with code names
const BUILTIN_PROVIDERS = [
  {
    id: 'gemini',
    name: 'gemini',
    desc: 'Google Gemini CLI (OAuth)',
    icon: Terminal,
    isMcp: false,
  },
  {
    id: 'web-search-prime',
    name: 'web-search-prime',
    desc: 'z.ai MCP',
    icon: Zap,
    isMcp: true,
  },
  {
    id: 'brave-search',
    name: 'brave-search',
    desc: 'Brave Search MCP',
    icon: Globe,
    isMcp: true,
  },
  {
    id: 'tavily',
    name: 'tavily',
    desc: 'Tavily MCP',
    icon: Globe,
    isMcp: true,
  },
];

export function SettingsPage() {
  const [config, setConfig] = useState<WebSearchConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [status, setStatus] = useState<WebSearchStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  // Config viewer state
  const [rawConfig, setRawConfig] = useState<string | null>(null);
  const [rawConfigLoading, setRawConfigLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  // BYOM MCP form state - JSON paste
  const [mcpJsonInput, setMcpJsonInput] = useState('');
  const [mcpJsonError, setMcpJsonError] = useState<string | null>(null);
  const [showAddMcp, setShowAddMcp] = useState(false);

  // Load config and status on mount
  useEffect(() => {
    fetchConfig();
    fetchStatus();
    fetchRawConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/websearch');
      if (!res.ok) throw new Error('Failed to load WebSearch config');
      const data = await res.json();
      setConfig(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatus = async () => {
    try {
      setStatusLoading(true);
      const res = await fetch('/api/websearch/status');
      if (!res.ok) throw new Error('Failed to load status');
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error('Failed to fetch WebSearch status:', err);
    } finally {
      setStatusLoading(false);
    }
  };

  const fetchRawConfig = async () => {
    try {
      setRawConfigLoading(true);
      const res = await fetch('/api/config/raw');
      if (!res.ok) {
        setRawConfig(null);
        return;
      }
      const text = await res.text();
      setRawConfig(text);
    } catch (err) {
      console.error('Failed to fetch raw config:', err);
      setRawConfig(null);
    } finally {
      setRawConfigLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!rawConfig) return;
    try {
      await navigator.clipboard.writeText(rawConfig);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Get active providers from config
  const getActiveProviders = (): string[] => {
    const active: string[] = [];
    if (config?.gemini?.enabled !== false) active.push('gemini');
    if (config?.selectedProviders) {
      active.push(...config.selectedProviders.filter((p) => p !== 'gemini'));
    }
    return active;
  };

  // Toggle a provider
  const toggleProvider = (providerId: string) => {
    const current = getActiveProviders();
    let updated: string[];

    if (current.includes(providerId)) {
      updated = current.filter((p) => p !== providerId);
    } else {
      updated = [...current, providerId];
    }

    // Separate gemini from MCP providers
    const geminiEnabled = updated.includes('gemini');
    const mcpProviders = updated.filter((p) => p !== 'gemini');

    // Determine mode: parallel if multiple providers, sequential otherwise
    const mode = updated.length > 1 ? 'parallel' : 'sequential';

    saveConfig({
      gemini: {
        enabled: geminiEnabled,
        timeout: config?.gemini?.timeout ?? 55,
      },
      selectedProviders: updated,
      mode,
      // Auto-enable if any provider is on
      enabled: updated.length > 0,
      // Set primary provider
      provider: (mcpProviders[0] as WebSearchConfig['provider']) || 'auto',
    });
  };

  // Parse JSON input and add custom MCP
  const addCustomMcp = () => {
    if (!mcpJsonInput.trim()) return;
    setMcpJsonError(null);

    // Try to parse JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(mcpJsonInput);
    } catch (_err) {
      // Check for common JSON issues
      const input = mcpJsonInput.trim();
      if (input.includes('//')) {
        setMcpJsonError('Remove comments (// ...) from JSON before pasting');
      } else if (!input.startsWith('{')) {
        setMcpJsonError('JSON must start with { - check for extra characters');
      } else if (!input.endsWith('}')) {
        setMcpJsonError('JSON must end with } - check for missing closing brace');
      } else {
        setMcpJsonError('Invalid JSON syntax. Check for missing quotes, commas, or braces.');
      }
      return;
    }

    // Validate it's an object
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      setMcpJsonError('Expected a JSON object { ... }, not an array or primitive');
      return;
    }

    const obj = parsed as Record<string, unknown>;
    const serversToAdd: CustomMcpConfig[] = [];

    // Format 1: { "mcpServers": { "name": { ... } } } - Full Claude/CCS format
    if (obj.mcpServers && typeof obj.mcpServers === 'object') {
      for (const [name, serverConfig] of Object.entries(
        obj.mcpServers as Record<string, unknown>
      )) {
        const cfg = serverConfig as Record<string, unknown>;
        if (cfg && typeof cfg === 'object') {
          serversToAdd.push({
            name,
            type: (cfg.type as 'http' | 'stdio') || 'http',
            url: cfg.url as string,
            headers: cfg.headers as Record<string, string>,
            command: cfg.command as string,
            args: cfg.args as string[],
            env: cfg.env as Record<string, string>,
          });
        }
      }
    }
    // Format 2: { "type": "http", "url": "..." } - Single server without name
    else if (obj.type && (obj.url || obj.command)) {
      setMcpJsonError(
        'Missing server name. Use format:\n{ "your-server-name": { "type": "http", "url": "..." } }'
      );
      return;
    }
    // Format 3: { "name": { ... } } - Direct server object (partial paste)
    else {
      for (const [name, value] of Object.entries(obj)) {
        const cfg = value as Record<string, unknown>;
        if (cfg && typeof cfg === 'object' && !Array.isArray(cfg)) {
          // Check if this looks like a server config
          if (cfg.type || cfg.url || cfg.command) {
            serversToAdd.push({
              name,
              type: (cfg.type as 'http' | 'stdio') || 'http',
              url: cfg.url as string,
              headers: cfg.headers as Record<string, string>,
              command: cfg.command as string,
              args: cfg.args as string[],
              env: cfg.env as Record<string, string>,
            });
          }
        }
      }
    }

    // Validate we found servers
    if (serversToAdd.length === 0) {
      setMcpJsonError(
        'No valid MCP server found. Expected format:\n{ "server-name": { "type": "http", "url": "..." } }'
      );
      return;
    }

    // Validate each server
    for (const server of serversToAdd) {
      if (!server.name) {
        setMcpJsonError('Server name is required');
        return;
      }
      if (server.type === 'http' && !server.url) {
        setMcpJsonError(`"${server.name}" is missing "url" field`);
        return;
      }
      if (server.type === 'stdio' && !server.command) {
        setMcpJsonError(`"${server.name}" is missing "command" field`);
        return;
      }
    }

    // Check for duplicates
    const existing = config?.customMcp || [];
    const duplicates = serversToAdd.filter((s) => existing.some((e) => e.name === s.name));
    if (duplicates.length > 0) {
      setMcpJsonError(`Server "${duplicates[0].name}" already exists`);
      return;
    }

    // Success - add the servers
    saveConfig({ customMcp: [...existing, ...serversToAdd] });
    setMcpJsonInput('');
    setShowAddMcp(false);
  };

  const removeCustomMcp = (name: string) => {
    const current = config?.customMcp || [];
    // Also remove from selectedProviders
    const selected = config?.selectedProviders || [];
    saveConfig({
      customMcp: current.filter((m) => m.name !== name),
      selectedProviders: selected.filter((p) => p !== name),
    });
  };

  const saveConfig = async (updates: Partial<WebSearchConfig>) => {
    if (!config) return;

    // Optimistic update - apply changes immediately to local state
    const optimisticConfig = { ...config, ...updates };
    setConfig(optimisticConfig);

    try {
      setSaving(true);
      setError(null);

      const res = await fetch('/api/websearch', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(optimisticConfig),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      const data = await res.json();
      setConfig(data.websearch);
      // Quick flash of success (shorter duration, less intrusive)
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1500);
      // Silently refresh raw config without loading state
      fetch('/api/config/raw')
        .then((r) => (r.ok ? r.text() : null))
        .then((text) => text && setRawConfig(text))
        .catch(() => {});
    } catch (err) {
      // Revert optimistic update on error
      setConfig(config);
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const activeProviders = config ? getActiveProviders() : [];
  const activeCount = activeProviders.length;

  if (loading) {
    return (
      <div className="h-[calc(100vh-100px)] flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="text-lg">Loading configuration...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-100px)]">
      <PanelGroup direction="horizontal" className="h-full">
        {/* Left Panel - WebSearch Controls */}
        <Panel defaultSize={40} minSize={30} maxSize={55}>
          <div className="h-full border-r flex flex-col bg-muted/30 relative">
            {/* Header */}
            <div className="p-5 border-b bg-background">
              <div className="flex items-center gap-3">
                <Globe className="w-6 h-6 text-primary" />
                <div>
                  <h1 className="text-lg font-semibold">WebSearch</h1>
                  <p className="text-sm text-muted-foreground">
                    Toggle providers • Multiple = parallel
                  </p>
                </div>
              </div>
            </div>

            {/* Toast-style alerts - absolute positioned, no layout shift */}
            <div
              className={`absolute left-5 right-5 top-20 z-10 transition-all duration-200 ease-out ${
                error || success
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 -translate-y-2 pointer-events-none'
              }`}
            >
              {error && (
                <Alert variant="destructive" className="py-2 shadow-lg">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-green-200 bg-green-50 text-green-700 shadow-lg dark:border-green-900/50 dark:bg-green-900/90 dark:text-green-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium">Saved</span>
                </div>
              )}
            </div>

            {/* Scrollable Content */}
            <ScrollArea className="flex-1">
              <div className="p-5 space-y-6">
                {/* Status Summary */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">
                      {activeCount === 0 && 'No providers enabled'}
                      {activeCount === 1 && '1 provider active'}
                      {activeCount > 1 && `${activeCount} providers (parallel)`}
                    </p>
                    {statusLoading ? (
                      <p className="text-sm text-muted-foreground">Checking status...</p>
                    ) : status?.readiness ? (
                      <p className="text-sm text-muted-foreground">{status.readiness.message}</p>
                    ) : null}
                  </div>
                  <Button variant="ghost" size="sm" onClick={fetchStatus} disabled={statusLoading}>
                    <RefreshCw className={`w-4 h-4 ${statusLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>

                {/* Built-in Providers */}
                <div className="space-y-3">
                  <h3 className="text-base font-medium">Providers</h3>
                  <div className="space-y-2">
                    {BUILTIN_PROVIDERS.map((provider) => {
                      const isActive = activeProviders.includes(provider.id);
                      const Icon = provider.icon;
                      const isGemini = provider.id === 'gemini';
                      const isInstalled = isGemini
                        ? status?.geminiCli.installed
                        : provider.isMcp
                          ? status?.mcpServers.ccsManaged.includes(provider.id) ||
                            status?.mcpServers.userAdded.includes(provider.id)
                          : true;

                      return (
                        <div
                          key={provider.id}
                          className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                            isActive
                              ? 'border-primary/50 bg-primary/5'
                              : 'border-border bg-background'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon
                              className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-mono font-medium">{provider.name}</p>
                                {isInstalled ? (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 font-medium">
                                    configured
                                  </span>
                                ) : (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 font-medium">
                                    not configured
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{provider.desc}</p>
                            </div>
                          </div>
                          <Switch
                            checked={isActive}
                            onCheckedChange={() => toggleProvider(provider.id)}
                            disabled={saving || !isInstalled}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Custom MCPs */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-medium">Custom MCPs</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddMcp(!showAddMcp)}
                      disabled={saving}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>

                  {showAddMcp && (
                    <div className="space-y-3 p-4 rounded-lg border bg-background">
                      <div>
                        <Label htmlFor="mcpJson" className="text-sm font-medium">
                          Paste MCP Server JSON
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1 mb-2">
                          Paste the JSON config from your MCP provider docs
                        </p>
                        <textarea
                          id="mcpJson"
                          placeholder={`// Full format (from Claude settings):
{
  "mcpServers": {
    "my-mcp": {
      "type": "http",
      "url": "https://api.example.com/mcp"
    }
  }
}

// Or just the server part:
{
  "my-mcp": {
    "type": "http",
    "url": "https://..."
  }
}`}
                          value={mcpJsonInput}
                          onChange={(e) => {
                            setMcpJsonInput(e.target.value);
                            setMcpJsonError(null);
                          }}
                          className="w-full min-h-[160px] max-h-[400px] p-3 font-mono text-sm border rounded-md bg-muted/50 resize-y focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        {mcpJsonError && (
                          <p className="text-sm text-destructive mt-2">{mcpJsonError}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={addCustomMcp}
                          disabled={!mcpJsonInput.trim() || saving}
                        >
                          Add
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowAddMcp(false);
                            setMcpJsonInput('');
                            setMcpJsonError(null);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Custom MCP list */}
                  {config?.customMcp && config.customMcp.length > 0 && (
                    <div className="space-y-2">
                      {config.customMcp.map((mcp) => {
                        const isActive = activeProviders.includes(mcp.name);
                        return (
                          <div
                            key={mcp.name}
                            className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                              isActive
                                ? 'border-primary/50 bg-primary/5'
                                : 'border-border bg-background'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <Server
                                className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="font-mono font-medium truncate">{mcp.name}</p>
                                <p className="text-sm text-muted-foreground truncate">{mcp.url}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Switch
                                checked={isActive}
                                onCheckedChange={() => toggleProvider(mcp.name)}
                                disabled={saving}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeCustomMcp(mcp.name)}
                                disabled={saving}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-4 border-t bg-background">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  fetchConfig();
                  fetchRawConfig();
                }}
                disabled={loading || saving}
                className="w-full"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </Panel>

        {/* Resize Handle */}
        <PanelResizeHandle className="w-2 bg-border hover:bg-primary/20 transition-colors cursor-col-resize flex items-center justify-center group">
          <GripVertical className="w-3 h-3 text-muted-foreground group-hover:text-primary" />
        </PanelResizeHandle>

        {/* Right Panel - Config Viewer */}
        <Panel defaultSize={60} minSize={35}>
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b bg-background flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileCode className="w-5 h-5 text-primary" />
                <div>
                  <h2 className="font-semibold">config.yaml</h2>
                  <p className="text-sm text-muted-foreground">~/.ccs/config.yaml</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard} disabled={!rawConfig}>
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchRawConfig}
                  disabled={rawConfigLoading}
                >
                  <RefreshCw className={`w-4 h-4 ${rawConfigLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>

            {/* Config Content - scrollable */}
            <div className="flex-1 overflow-auto">
              {rawConfigLoading ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                  Loading...
                </div>
              ) : rawConfig ? (
                <CodeEditor
                  value={rawConfig}
                  onChange={() => {}}
                  language="yaml"
                  readonly
                  minHeight="auto"
                  className="min-h-full"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <FileCode className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Config file not found</p>
                    <code className="text-sm bg-muted px-2 py-1 rounded mt-2 inline-block">
                      ccs migrate
                    </code>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
