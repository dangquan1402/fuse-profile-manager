# CCS - Claude Code Switch

<div align="center">

![CCS Logo](docs/assets/ccs-logo-medium.png)

**One command, zero downtime, multiple accounts**

Switch between multiple Claude accounts, GLM, and Kimi instantly.<br>
Stop hitting rate limits. Keep working continuously.


[![License](https://img.shields.io/badge/license-MIT-C15F3C?style=for-the-badge)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-lightgrey?style=for-the-badge)]()
[![npm](https://img.shields.io/npm/v/@kaitranntt/ccs?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/@kaitranntt/ccs)
[![PoweredBy](https://img.shields.io/badge/PoweredBy-ClaudeKit-C15F3C?style=for-the-badge)](https://claudekit.cc?ref=HMNKXOHN)

**Languages**: [English](README.md) | [Tiếng Việt](README.vi.md) | [日本語](README.ja.md)

</div>

---

## 🚀 Quick Start

### 🔑 Prerequisites

**Before installing CCS, make sure you're logged into Claude CLI with your subscription account:**
```bash
claude /login
```

### Installation

#### Option 1: npm Package (Recommended)

**macOS / Linux / Windows**
```bash
npm install -g @kaitranntt/ccs
```

All major package managers are supported:

```bash
# yarn
yarn global add @kaitranntt/ccs

# pnpm (70% less disk space)
pnpm add -g @kaitranntt/ccs

# bun (30x faster)
bun add -g @kaitranntt/ccs
```

#### Option 2: Direct Install (Traditional)

**macOS / Linux**
```bash
curl -fsSL ccs.kaitran.ca/install | bash
```

**Windows PowerShell**
```powershell
irm ccs.kaitran.ca/install | iex
```

> **💡 Performance Tip**: Traditional installs bypass Node.js routing for faster startup, but I prioritize npm updates due to easier deployment automation.

### Configuration (Auto-created)

**CCS automatically creates configuration during installation** (via npm postinstall script).

**~/.ccs/config.json**:
```json
{
  "profiles": {
    "glm": "~/.ccs/glm.settings.json",
    "glmt": "~/.ccs/glmt.settings.json",
    "kimi": "~/.ccs/kimi.settings.json",
    "default": "~/.claude/settings.json"
  }
}
```

### Custom Claude CLI Path

If Claude CLI is installed in a non-standard location (D drive, custom directory), set `CCS_CLAUDE_PATH`:

```bash
export CCS_CLAUDE_PATH="/path/to/claude"              # Unix
$env:CCS_CLAUDE_PATH = "D:\Tools\Claude\claude.exe"   # Windows
```

**See [Troubleshooting Guide](./docs/en/troubleshooting.md#claude-cli-in-non-standard-location) for detailed setup instructions.**

### Windows Symlink Support (Developer Mode)

**Windows users**: Enable Developer Mode for true symlinks (better performance, instant sync):

1. Open **Settings** → **Privacy & Security** → **For developers**
2. Enable **Developer Mode**
3. Reinstall CCS: `npm install -g @kaitranntt/ccs`

**Without Developer Mode**: CCS automatically falls back to copying directories (works but no instant sync across profiles).

---

### Your First Switch

> **⚠️ Important**: Before using GLM/GLMT or Kimi profiles, update API keys in settings files:
> - **GLM**: Edit `~/.ccs/glm.settings.json` and add your GLM API key
> - **GLMT**: Edit `~/.ccs/glmt.settings.json` and add your Z.AI API key (requires coding plan)
> - **Kimi**: Edit `~/.ccs/kimi.settings.json` and add your Kimi API key

```bash
# Default Claude subscription
ccs "Plan microservices architecture"

# Switch to GLM (cost-optimized)
ccs glm "Create REST API"

# GLM with thinking mode
ccs glmt "Solve algorithmic problem"

# Kimi for coding
ccs kimi "Write integration tests"
```

---

## The Daily Developer Pain Point

Developers face multiple subscription scenarios daily:

1. **Account Separation**: Company Claude account vs personal Claude → you must manually switch contexts to keep work and personal separate
2. **Rate Limits Hit**: Claude stops mid-project → you manually edit `~/.claude/settings.json`
3. **Cost Management**: 2-3 Pro subscriptions ($20/month each) vs Claude Max at 5x cost ($100/month) → Pro tier is the practical ceiling for most developers
4. **Model Choice**: Different tasks benefit from different model strengths → manual switching

Manual context switching breaks your workflow. **CCS manages it seamlessly**.

## Why CCS Instead of Manual Switching?

<div align="center">

| Feature | Benefit |
|---------|---------|
| **Account Isolation** | Keep work separate from personal |
| **Cost Optimization** | 2-3 Pro accounts vs Max at 5x cost |
| **Instant Switching** | One command, no file editing |
| **Zero Downtime** | Never interrupt workflow |
| **Rate Limit Management** | Switch accounts when limits hit |
| **Cross-Platform** | macOS, Linux, Windows |

</div>

---

## Architecture

### Profile Types

**Settings-based**: GLM, GLMT, Kimi, default
- Uses `--settings` flag pointing to config files
- GLMT: Embedded proxy for thinking mode support

**Account-based**: work, personal, team
- Uses `CLAUDE_CONFIG_DIR` for isolated instances
- Create with `ccs auth create <profile>`

### Shared Data (v3.1)

Commands and skills symlinked from `~/.ccs/shared/` - no duplication across profiles.

```
~/.ccs/
├── shared/                  # Shared across all profiles
│   ├── agents/
│   ├── commands/
│   └── skills/
├── instances/               # Profile-specific data
│   └── work/
│       ├── agents@ → shared/agents/
│       ├── commands@ → shared/commands/
│       ├── skills@ → shared/skills/
│       ├── settings.json    # API keys, credentials
│       └── sessions/        # Conversation history
│       └── ...
```

**Shared**: commands/, skills/, agents/
**Profile-specific**: settings.json, sessions/, todolists/, logs/

**[i] Windows**: Copies dirs if symlinks unavailable (enable Developer Mode for true symlinks)

---

## GLM with Thinking (GLMT)

> **[!] Important**: GLMT requires npm installation (`npm install -g @kaitranntt/ccs`). Not available in native shell versions (requires Node.js HTTP server).

### GLM vs GLMT

| Feature | GLM (`ccs glm`) | GLMT (`ccs glmt`) |
|---------|-----------------|-------------------|
| **Endpoint** | Anthropic-compatible | OpenAI-compatible |
| **Thinking** | No | Yes (reasoning_content) |
| **Streaming** | Yes | No (buffered) |
| **Use Case** | Fast responses | Complex reasoning |

### How It Works

1. CCS spawns embedded HTTP proxy on localhost
2. Proxy converts Anthropic format → OpenAI format
3. Forwards to Z.AI with reasoning parameters
4. Converts `reasoning_content` → thinking blocks
5. Thinking appears in Claude Code UI

### Control Tags

- `<Thinking:On|Off>` - Enable/disable reasoning blocks (default: On)
- `<Effort:Low|Medium|High>` - Control reasoning depth (default: Medium)

### API Key Setup

```bash
# Edit GLMT settings
nano ~/.ccs/glmt.settings.json

# Set Z.AI API key (requires coding plan)
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "your-z-ai-api-key"
  }
}
```

### Debugging

**Enable verbose logging**:
```bash
ccs glmt --verbose "your prompt"
```

**Enable debug file logging**:
```bash
export CCS_DEBUG_LOG=1
ccs glmt --verbose "your prompt"
# Logs: ~/.ccs/logs/
```

**Check reasoning content**:
```bash
cat ~/.ccs/logs/*response-openai.json | jq '.choices[0].message.reasoning_content'
```

**If absent**: Z.AI API issue (verify key, account status)
**If present**: Transformation issue (check response-anthropic.json)

---

## Usage Examples

### Basic Switching
```bash
ccs              # Claude subscription (default)
ccs glm          # GLM (no thinking)
ccs glmt         # GLM with thinking
ccs kimi         # Kimi for Coding
ccs --version    # Show version
```

### Multi-Account Setup
```bash
# Create accounts
ccs auth create work
ccs auth create personal

# Terminal 1
ccs work "implement feature"

# Terminal 2 (concurrent)
ccs personal "review code"
```

### Custom Claude CLI Path

Non-standard installation location:
```bash
export CCS_CLAUDE_PATH="/path/to/claude"              # Unix
$env:CCS_CLAUDE_PATH = "D:\Tools\Claude\claude.exe"   # Windows
```

See [Troubleshooting Guide](./docs/en/troubleshooting.md#claude-cli-in-non-standard-location)

---

## Configuration

Auto-created during installation via npm postinstall script.

**~/.ccs/config.json**:
```json
{
  "profiles": {
    "glm": "~/.ccs/glm.settings.json",
    "glmt": "~/.ccs/glmt.settings.json",
    "kimi": "~/.ccs/kimi.settings.json",
    "default": "~/.claude/settings.json"
  }
}
```

Complete guide: [docs/en/configuration.md](./docs/en/configuration.md)

---

## Uninstall

**Package Managers**
```bash
npm uninstall -g @kaitranntt/ccs
yarn global remove @kaitranntt/ccs
pnpm remove -g @kaitranntt/ccs
bun remove -g @kaitranntt/ccs
```

**Official Uninstaller**
```bash
# macOS / Linux
curl -fsSL ccs.kaitran.ca/uninstall | bash

# Windows
irm ccs.kaitran.ca/uninstall | iex
```

---

## 🎯 Philosophy

- **YAGNI**: No features "just in case"
- **KISS**: Simple bash, no complexity
- **DRY**: One source of truth (config)

---

## 📖 Documentation

**Complete documentation in [docs/](./docs/)**:
- [Installation Guide](./docs/en/installation.md)
- [Configuration](./docs/en/configuration.md)
- [Usage Examples](./docs/en/usage.md)
- [System Architecture](./docs/system-architecture.md)
- [Troubleshooting](./docs/en/troubleshooting.md)
- [Contributing](./CONTRIBUTING.md)

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

---

## 📄 License

CCS is licensed under the [MIT License](LICENSE).

---

<div align="center">

**Made with ❤️ for developers who hit rate limits too often**

[⭐ Star this repo](https://github.com/kaitranntt/ccs) | [🐛 Report issues](https://github.com/kaitranntt/ccs/issues) | [📖 Read docs](./docs/en/)

</div>
