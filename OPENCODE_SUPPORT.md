# OpenCode Support

@fuseapi/cli now supports launching OpenCode with FuseAPI profiles!

## Features

- ✅ Launch OpenCode with FuseAPI custom endpoint and API key
- ✅ Automatic `opencode.json` generation
- ✅ Multi-model support (Claude, Gemini, GPT-4)
- ✅ Profile management (same as Claude Code)
- ✅ Zero configuration needed after setup

## Quick Start

### 1. Setup FuseAPI Profile

```bash
fuseapi setup
```

Follow the prompts to configure your FuseAPI endpoint and API key.

### 2. Launch OpenCode

```bash
# Launch OpenCode with default profile
fuseapi opencode

# Launch with a specific prompt
fuseapi opencode "help me refactor this code"

# Launch with custom profile
fuseapi opencode myprofile "build a web scraper"
```

## Available Models

The CLI automatically configures the following models:

1. **claude-sonnet-4-5** - Claude Sonnet 4.5 (200K context)
2. **claude-haiku-4-5** - Claude Haiku 4.5 (200K context)
3. **gemini-2-5-pro** - Gemini 2.5 Pro (1M context)
4. **gpt-4o** - GPT-4o (128K context)

## Configuration

### Generated OpenCode Config

When you run `fuseapi opencode`, it generates `~/.fuseapi/opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "fuse": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "FuseAPI (fuse)",
      "options": {
        "baseURL": "https://api.fuseapi.app",
        "apiKey": "fuse_xxx..."
      },
      "models": {
        "claude-sonnet-4-5": {
          "name": "Claude Sonnet 4.5",
          "limit": {
            "context": 200000,
            "output": 8192
          }
        },
        "claude-haiku-4-5": {
          "name": "Claude Haiku 4.5",
          "limit": {
            "context": 200000,
            "output": 8192
          }
        },
        "gemini-2-5-pro": {
          "name": "Gemini 2.5 Pro",
          "limit": {
            "context": 1000000,
            "output": 8192
          }
        },
        "gpt-4o": {
          "name": "GPT-4o",
          "limit": {
            "context": 128000,
            "output": 16384
          }
        }
      }
    }
  },
  "model": "fuse/claude-sonnet-4-5",
  "small_model": "fuse/claude-haiku-4-5"
}
```

### Model Selection in OpenCode

In OpenCode, use `/models` command to switch between available models:

```
/models
```

Then select from:
- `fuse/claude-sonnet-4-5`
- `fuse/claude-haiku-4-5`
- `fuse/gemini-2-5-pro`
- `fuse/gpt-4o`

## Health Check

Check your setup with:

```bash
fuseapi doctor
```

This will verify:
- Configuration exists
- Profile setup is valid
- Claude CLI installation (optional)
- OpenCode CLI installation

## Examples

### Basic Usage

```bash
# Interactive setup
fuseapi setup

# Launch OpenCode
fuseapi opencode

# Launch with task
fuseapi opencode "create a REST API with Express"
```

### Multi-Profile Usage

```bash
# Setup production profile
fuseapi setup --profile prod --endpoint https://api.fuseapi.app --api-key fuse_prod_xxx

# Setup staging profile
fuseapi setup --profile staging --endpoint https://staging.fuseapi.app --api-key fuse_staging_xxx

# Use production profile
fuseapi opencode prod "deploy to production"

# Use staging profile
fuseapi opencode staging "test this feature"
```

## Architecture

### How It Works

1. **Profile Loading**: Reads credentials from `~/.fuseapi/config.json`
2. **Config Generation**: Generates OpenCode-compatible `opencode.json`
3. **Environment Setup**: Sets `OPENCODE_CONFIG` environment variable
4. **Launch**: Spawns `opencode` process with custom config

### File Locations

- **Profile Config**: `~/.fuseapi/config.json`
- **OpenCode Config**: `~/.fuseapi/opencode.json`

## Troubleshooting

### OpenCode Not Found

```
[!] Failed to launch OpenCode: opencode not found
```

**Solution**: Install OpenCode from https://opencode.ai

### Profile Not Found

```
[!] Profile "myprofile" not found
```

**Solution**: Run `fuseapi setup --profile myprofile` to create the profile

### No Configuration Found

```
[!] No configuration found
```

**Solution**: Run `fuseapi setup` to configure FuseAPI

## Comparison: Claude Code vs OpenCode

| Feature | Claude Code | OpenCode |
|---------|-------------|----------|
| Launch Command | `fuseapi` | `fuseapi opencode` |
| Config Location | Environment vars | `~/.fuseapi/opencode.json` |
| Multi-model | No | Yes |
| Profile Support | Yes | Yes |
| Custom Endpoint | Yes | Yes |

## Changelog

### v1.1.0
- ✨ Added OpenCode support
- ✨ Multi-model configuration
- ✨ Auto-generated `opencode.json`
- ✨ Enhanced `doctor` command with OpenCode check
- 📝 Updated help text and documentation

## License

MIT
