# 🚀 FuseAPI CLI - Quick Start Guide

## Installation Status

✅ **Installed:** `@fuseapi/cli@1.2.0` (from npm)
✅ **OpenCode:** `opencode@1.1.48` (installed)
✅ **Configuration:** Already set up with fuse profile

## How to Start

### Option 1: Launch OpenCode (Recommended)

```bash
fuseapi opencode
```

This will:
1. Generate OpenCode config at `~/.fuseapi/opencode.json`
2. Launch OpenCode with 14 Gemini + Claude models available
3. Set default model to `fuse/claude-sonnet-4.5`

### Option 2: Launch Claude Code

```bash
fuseapi
```

This will:
1. Launch Claude Code with FuseAPI endpoint
2. Use environment variables for authentication
3. Single model: Claude Sonnet 4.5

## Available Models in OpenCode

Once OpenCode is running, use `/models` to switch between:

### Claude Family (5 models)
```
fuse/claude-sonnet-4.5       ⭐ Default - Best for coding
fuse/claude-opus-4.5         💎 Most capable
fuse/claude-haiku-4.5        ⚡ Fastest
fuse/claude-sonnet-4         📝 Previous version
fuse/claude-opus-4.1         🔧 Alternative
```

### Gemini Family (6 models)
```
fuse/gemini-2.5-pro          🧠 Most powerful
fuse/gemini-2.5-flash        ⚡ Fast & efficient (small_model)
fuse/gemini-2.5-flash-lite   🪶 Ultra lightweight
fuse/gemini-3-pro-preview    🔮 Preview version
fuse/gemini-3-flash-preview  🆕 Latest flash
fuse/gemini-3-pro-image-preview 🖼️ Image support
```

### Hybrid Models (3 models)
```
fuse/gemini-claude-sonnet-4-5           🤝 Combined power
fuse/gemini-claude-sonnet-4-5-thinking  🧠 Deep reasoning
fuse/gemini-claude-opus-4-5-thinking    💎 Ultimate reasoning
```

## Step-by-Step: First Run

### 1. Check Your Setup

```bash
fuseapi doctor
```

Expected output:
```
=== FuseAPI Health Check ===

[OK] Configuration exists
     Profiles: fuse
     Default: fuse

[OK] Claude CLI found
[OK] OpenCode CLI found

[OK] All checks passed!
```

### 2. View Your Configuration

```bash
fuseapi config
```

Expected output:
```
=== FuseAPI Configuration ===

Default Profile: fuse

Profiles:

  fuse (default)
    Endpoint: https://api.fuseapi.app
    API Key:  fuse_XTk3Qs6...

Config file: /Users/quandang/.fuseapi/config.json
```

### 3. Launch OpenCode

```bash
fuseapi opencode
```

Expected output:
```
[i] OpenCode configuration generated at /Users/quandang/.fuseapi/opencode.json
[i] Launching OpenCode with fuse profile...
[i] Available models: claude-sonnet-4.5, claude-opus-4.5, claude-haiku-4.5, ...

# OpenCode TUI will launch
```

### 4. Test with a Prompt

```bash
fuseapi opencode "create a simple REST API with Express"
```

OpenCode will launch with your prompt already loaded!

## Common Commands

### Basic Usage

```bash
# Health check
fuseapi doctor

# View config
fuseapi config

# Launch OpenCode (interactive)
fuseapi opencode

# Launch OpenCode with prompt
fuseapi opencode "help me refactor this code"

# Launch Claude Code
fuseapi

# Launch Claude Code with prompt
fuseapi "debug this function"
```

### Advanced Usage

```bash
# Setup new profile
fuseapi setup --profile prod --endpoint https://api.fuseapi.app --api-key fuse_xxx

# Use specific profile with OpenCode
fuseapi opencode prod "deploy to production"

# Interactive setup
fuseapi setup
```

## Inside OpenCode

Once OpenCode is running:

### Essential Commands

```bash
/help           # Show all commands
/models         # Switch models
/clear          # Clear conversation
/exit           # Exit OpenCode
```

### Switch Models

```bash
# Type this in OpenCode
/models

# Then select from:
# 1. fuse/claude-sonnet-4.5 (default)
# 2. fuse/claude-opus-4.5
# 3. fuse/gemini-2.5-pro
# 4. fuse/gemini-2.5-flash
# ... and 10 more
```

### Example Workflow

```
You: /models
OpenCode: [Shows list of 14 models]

You: Select 3 (gemini-2.5-pro)
OpenCode: Switched to fuse/gemini-2.5-pro

You: Create a Python web scraper
OpenCode: [Uses Gemini 2.5 Pro to generate code]

You: /models
You: Select 1 (claude-sonnet-4.5)

You: Review the code above and improve error handling
OpenCode: [Uses Claude Sonnet 4.5 to review]
```

## Configuration Files

### FuseAPI Config
Location: `~/.fuseapi/config.json`

```json
{
  "version": 1,
  "default": "fuse",
  "profiles": {
    "fuse": {
      "endpoint": "https://api.fuseapi.app",
      "apiKey": "fuse_XTk3Qs6Q9wqI__iWQcYR5VDYSkALVlkLNsw5tgqTWkA"
    }
  }
}
```

### OpenCode Config (Auto-generated)
Location: `~/.fuseapi/opencode.json`

Generated when you run `fuseapi opencode` - contains all 14 models.

## Troubleshooting

### OpenCode doesn't launch

```bash
# Check if OpenCode is installed
which opencode

# If not found, install it
npm install -g opencode-ai@latest

# Then run doctor
fuseapi doctor
```

### Want to use a different model by default?

Edit `~/.fuseapi/opencode.json`:

```json
{
  "model": "fuse/gemini-2.5-pro",        // Change this
  "small_model": "fuse/gemini-2.5-flash"  // Or this
}
```

### Reset configuration

```bash
rm ~/.fuseapi/opencode.json
fuseapi opencode  # Will regenerate
```

## Model Recommendations

| Use Case | Recommended Model | Why |
|----------|------------------|-----|
| **General Coding** | `claude-sonnet-4.5` | Best balance of speed/quality |
| **Complex Problems** | `claude-opus-4.5` | Most capable reasoning |
| **Quick Answers** | `gemini-2.5-flash` | Fastest responses |
| **Long Context** | `gemini-2.5-pro` | 1M context window |
| **Deep Reasoning** | `gemini-claude-opus-4-5-thinking` | Ultimate problem-solving |
| **Image Analysis** | `gemini-3-pro-image-preview` | Supports images |

## Tips

1. **Start with default** (`claude-sonnet-4.5`) - It's the best all-rounder
2. **Use `/models`** to experiment with different models
3. **Try Gemini** for long context or speed
4. **Try hybrid models** for complex reasoning tasks
5. **Use small_model** (`gemini-2.5-flash`) for quick iterations

## Next Steps

1. **Try it now:**
   ```bash
   fuseapi opencode
   ```

2. **Ask OpenCode to help you:**
   ```
   Show me how to use multiple models effectively
   ```

3. **Explore the models:**
   ```
   /models
   ```

4. **Build something:**
   ```
   Create a full-stack app with React and Node.js
   ```

---

**You're all set!** 🎉

Just run `fuseapi opencode` to get started!
