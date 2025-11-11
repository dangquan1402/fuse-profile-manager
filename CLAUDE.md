# CLAUDE.md

Guidance for Claude Code when working with this repository.

## Project Overview

CCS (Claude Code Switch): CLI wrapper for instant switching between multiple Claude accounts (work, personal, team) and alternative models (GLM 4.6, Kimi). Built on v3.1 login-per-profile architecture with shared data support.

**Installation**:
- npm: `npm install -g @kaitranntt/ccs` (recommended)
- macOS/Linux: `curl -fsSL ccs.kaitran.ca/install | bash`
- Windows: `irm ccs.kaitran.ca/install | iex`

## Core Design Principles

- **YAGNI**: No features "just in case"
- **KISS**: Simple bash/PowerShell/Node.js, no complexity
- **DRY**: One source of truth (config.json)
- **CLI-First UX**: Command-line is primary interface

Tool does ONE thing: instant switching between Claude accounts and alternative models.

### CLI Documentation (CRITICAL)

**All functionality changes MUST update `--help` in ALL implementations:**
- `bin/ccs.js` - handleHelpCommand()
- `lib/ccs` - show_help()
- `lib/ccs.ps1` - Show-Help

Non-negotiable. If not in `--help`, it doesn't exist for users.

## Key Constraints

1. **NO EMOJIS** - ASCII only: [OK], [!], [X], [i]
2. **TTY-aware colors** - Respect NO_COLOR env var
3. **Install locations**:
   - Unix: `~/.local/bin` (auto PATH, no sudo)
   - Windows: `%USERPROFILE%\.ccs`
4. **Auto PATH config** - Detects bash/zsh/fish, adds automatically
5. **Idempotent installs** - Safe to run multiple times
6. **Non-invasive** - Never modify `~/.claude/settings.json`
7. **Cross-platform parity** - Identical behavior everywhere
8. **Graceful error handling** - See tests/edge-cases.sh

## Architecture

### v3.1 Features

**Login-Per-Profile**: Each profile = isolated Claude instance via `ccs auth create <profile>`. No credential copying/encryption.

**Profile Types**:
1. **Settings-based**: GLM, Kimi, default - uses `--settings` flag
2. **Account-based**: work, personal, team - uses `CLAUDE_CONFIG_DIR`

**Shared Data** (v3.1): commands/, skills/, agents/ symlinked from `~/.ccs/shared/`

**Concurrent Sessions**: Multiple profiles run simultaneously via isolated config dirs.

**Implementations**:
- npm package: Pure Node.js (bin/ccs.js) using child_process.spawn
- Traditional: bash (lib/ccs) or PowerShell (lib/ccs.ps1)

### File Structure

**Key Files**:
- `package.json`: npm manifest + postinstall
- `bin/ccs.js`: Node.js entry point
- `bin/instance-manager.js`: Instance orchestration
- `bin/shared-manager.js`: Shared data symlinks (v3.1)
- `scripts/postinstall.js`: Auto-creates configs (idempotent)
- `lib/ccs` / `lib/ccs.ps1`: Platform-specific executables
- `installers/*.sh` / `installers/*.ps1`: Install/uninstall scripts
- `VERSION`: Version source of truth (MAJOR.MINOR.PATCH)
- `.claude/`: Commands/skills for Claude Code

**Executables**:
- Unix: `~/.local/bin/ccs` → `~/.ccs/ccs`
- Windows: `%USERPROFILE%\.ccs\ccs.ps1`

**Config Directory** (v3.1):
```
~/.ccs/
├── ccs / ccs.ps1           # Executable
├── config.json             # Settings-based profiles
├── profiles.json           # Account-based profiles
├── shared/                 # Shared across all (v3.1)
│   ├── commands/           # Slash commands
│   ├── skills/             # Claude skills
│   └── agents/             # Agent configs
├── instances/              # Isolated per-profile
│   └── work/
│       ├── commands@ → shared/commands/  # Symlink
│       ├── skills@ → shared/skills/      # Symlink
│       ├── agents@ → shared/agents/      # Symlink
│       ├── settings.json   # Profile-specific
│       ├── sessions/       # Profile-specific
│       ├── todolists/      # Profile-specific
│       └── logs/           # Profile-specific
├── glm.settings.json       # GLM template
├── kimi.settings.json      # Kimi template
└── .claude/                # Integration
```

**v3.1 Data Structure**:
- **Shared**: commands/, skills/, agents/ → symlinked from `~/.ccs/shared/`
- **Profile-specific**: settings.json, sessions/, todolists/, logs/
- **Windows**: Copies dirs if symlinks fail (enable Developer Mode for symlinks)

### Technical Implementation

**Account-Based Profiles**:
```bash
# Create profile
ccs auth create work  # Opens Claude CLI for login

# Usage
CLAUDE_CONFIG_DIR=~/.ccs/instances/work claude [args]
```

**Shared Data** (v3.1):
```javascript
// bin/shared-manager.js
ensureSharedDirectories()      // Creates shared/{commands,skills,agents}
linkSharedDirectories(path)    // Symlinks instance to shared
migrateToSharedStructure()     // Auto-migrates v3.0 (idempotent)
```

**Migration** (v3.0 → v3.1):
1. Detect if `~/.ccs/shared/` exists (skip if present)
2. Create `~/.ccs/shared/{commands,skills,agents}`
3. Copy from `~/.claude/` (preserves data)
4. Symlink all instances to shared
5. Windows: Copy dirs if symlinks fail

**Settings-Based Profiles**:
```bash
claude --settings ~/.ccs/glm.settings.json [args]
```

**Profile Detection**:
1. Check `profiles.json` (account-based) → use `CLAUDE_CONFIG_DIR`
2. Check `config.json` (settings-based) → use `--settings`
3. Not found → show error + available profiles

## Development

### Version Management
```bash
./scripts/bump-version.sh [major|minor|patch]  # Updates VERSION, install scripts
cat VERSION                                     # Check version
```

### Testing
```bash
./tests/edge-cases.sh      # Unix
./tests/edge-cases.ps1     # Windows
```

### Local Development
```bash
./installers/install.sh    # Test local install
./ccs --version            # Verify

# Test npm package
npm pack && npm install -g @kaitranntt-ccs-*.tgz
ccs --version
npm uninstall -g @kaitranntt/ccs && rm *.tgz

rm -rf ~/.ccs              # Clean environment
```

### Publishing
```bash
# First-time: npm login, add NPM_TOKEN to GitHub Secrets

# Release workflow
./scripts/bump-version.sh patch
git add VERSION package.json lib/* installers/*
git commit -m "chore: bump version to X.Y.Z"
git tag vX.Y.Z
git push origin main && git push origin vX.Y.Z  # Triggers CI

# Manual
npm publish --dry-run && npm publish --access public
```

## Code Standards

### Bash
- Compatibility: bash 3.2+
- Quote vars: `"$VAR"` not `$VAR`
- Tests: `[[ ]]` not `[ ]`
- Shebang: `#!/usr/bin/env bash`
- Safety: `set -euo pipefail`
- Dependency: `jq` only

### Terminal Output
- TTY detect: `[[ -t 2 ]]` before colors
- Respect `NO_COLOR` env var
- ASCII only: [OK], [!], [X], [i]
- Errors: Box borders (╔═╗║╚╝)
- Colors: Disable when not TTY

### PowerShell
- Compatibility: PowerShell 5.1+
- `$ErrorActionPreference = "Stop"`
- Native JSON: ConvertFrom-Json / ConvertTo-Json
- No external dependencies

### Node.js
- Compatibility: Node.js 14+
- `child_process.spawn` for Claude CLI
- Handle SIGINT/SIGTERM
- `path` module for cross-platform paths

### Versioning
Update all three atomically via `./scripts/bump-version.sh`:
1. `VERSION`
2. `installers/install.sh` (CCS_VERSION)
3. `installers/install.ps1` ($CcsVersion)

## Implementation Details

### Profile Detection
- No args OR first arg starts with `-` → default profile
- First arg no `-` → profile name
- Special flags first: `--version`, `-v`, `--help`, `-h`
- `ccs auth create <profile>` → create account-based profile

### Installation Modes
- **Git**: Cloned repo (symlinks executables)
- **Standalone**: curl/irm (downloads from GitHub)
- Detection: Check if `ccs` exists in script dir/parent

### Idempotency
Install scripts safe to run multiple times:
- Check existing files before create
- Single backup: `config.json.backup` (no timestamps)
- Skip existing `.claude/` install
- Handle clean + existing installs

### Settings Format
```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.z.ai/api/anthropic",
    "ANTHROPIC_AUTH_TOKEN": "key",
    "ANTHROPIC_MODEL": "glm-4.6",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-4.6",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-4.6",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-4.6"
  }
}
```
All values = strings (not booleans/objects) to prevent PowerShell crashes.

### Profile Files

**profiles.json** (account-based):
```json
{"profiles": {"work": "~/.ccs/instances/work"}}
```

**config.json** (settings-based):
```json
{"profiles": {"glm": "~/.ccs/glm.settings.json"}}
```

## Common Tasks

### New Feature
1. Verify YAGNI/KISS/DRY alignment
2. Implement for bash/PowerShell/Node.js
3. **Update `--help` in ALL three** (bin/ccs.js, lib/ccs, lib/ccs.ps1) - REQUIRED
4. Test on macOS/Linux/Windows
5. Update tests/edge-cases.*
6. Update CONTRIBUTING.md if needed
7. Update README.md if user-facing

### Bug Fix
1. Add test case reproducing bug
2. Fix in bash/PowerShell/Node.js
3. Verify no regression
4. Test all platforms

### Release
1. `./scripts/bump-version.sh [major|minor|patch]`
2. Review VERSION, install scripts
3. Test git + standalone modes
4. Run full test suite
5. `git tag v<VERSION> && git push origin main && git push origin v<VERSION>`

## Testing Checklist

Before PR:
- [ ] macOS (bash)
- [ ] Linux (bash)
- [ ] Windows (PowerShell)
- [ ] Windows (Git Bash)
- [ ] Edge cases pass
- [ ] Idempotent install
- [ ] ASCII only (no emojis)
- [ ] Version + install location correct
- [ ] TTY colors, disabled when piped
- [ ] NO_COLOR respected
- [ ] Auto PATH (bash/zsh/fish)
- [ ] Shell reload instructions shown
- [ ] No PATH duplication
- [ ] Manual PATH instructions clear
- [ ] Concurrent sessions work
- [ ] Instance isolation (no contamination)
- [ ] `--help` updated in bin/ccs.js, lib/ccs, lib/ccs.ps1 (if feature changed)
- [ ] `--help` consistent across all three

## Claude Code Integration

`.claude/` contains:
- `/ccs` command: Task delegation to different models
- `ccs-delegation` skill: Delegation patterns

## Error Handling

- Validate early, fail fast with clear messages
- Show available options on mistakes
- Suggest recovery steps
- Never leave broken state
- Guide to `ccs auth create` if profile missing
