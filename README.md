# FuseAPI CLI

Ultra-minimal CLI to use FuseAPI with Claude Code - no profile switching complexity.

**Forked from [kaitranntt/ccs](https://github.com/kaitranntt/ccs)** - stripped to bare essentials for FuseAPI only.

## Features

- ✓ Configure FuseAPI credentials once
- ✓ Launch Claude Code with FuseAPI
- ✓ Works alongside your existing Claude setup
- ✗ No multiple profiles (one user = one FuseAPI account)
- ✗ No UI/Dashboard
- ✗ No OAuth providers
- ✗ No CLIProxy

## Install

```bash
npm install -g @fuseapi/cli
```

## Quick Start

```bash
# Configure your FuseAPI credentials (one time)
fuseapi setup

# Launch Claude Code with FuseAPI
fuseapi

# Check configuration
fuseapi doctor
```

## Commands

### Setup (First Time Only)

```bash
fuseapi setup

# You'll be prompted for:
# - API Endpoint (default: https://api.fuseapi.app)
# - API Key (your FuseAPI key)
```

Or set directly:

```bash
fuseapi setup --endpoint https://api.fuseapi.app --api-key fuse_xxx
```

### Launch Claude Code

```bash
fuseapi

# Or with custom prompt
fuseapi "help me debug this code"
```

### Check Health

```bash
fuseapi doctor
```

### Show Config

```bash
fuseapi config
```

## How It Works

1. First time: Run `fuseapi setup` to store your FuseAPI credentials
2. Anytime: Run `fuseapi` to launch Claude Code with FuseAPI
3. Your default `claude` command remains unchanged

Configuration is stored in `~/.fuseapi/config.json`:

```json
{
  "endpoint": "https://api.fuseapi.app",
  "apiKey": "fuse_xxx"
}
```

When you run `fuseapi`, it:
1. Loads your FuseAPI credentials
2. Sets `ANTHROPIC_BASE_URL` and `ANTHROPIC_API_KEY`
3. Launches Claude Code

## Differences from Original CCS

This is a **micro fork** for FuseAPI users only:

| Feature | Original CCS | This Fork |
|---------|--------------|-----------|
| FuseAPI Support | ✗ | ✓ |
| Multiple Profiles | ✓ | ✗ (1 user = 1 profile) |
| OAuth Providers | ✓ | ✗ |
| Dashboard UI | ✓ | ✗ |
| CLIProxy | ✓ | ✗ |

If you need multiple profiles or OAuth providers, use the [original CCS](https://github.com/kaitranntt/ccs).

## License

MIT - Forked from [CCS](https://github.com/kaitranntt/ccs)
