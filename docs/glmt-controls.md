# GLMT Control Mechanisms

Technical guide for thinking controls in `ccs glmt`.

## Problem Statement

GLMT (GLM with Thinking) exhibited three issues:

1. **Unbounded planning loops**: Model entered thinking loops without tool calls, wasting tokens
2. **Token waste**: Thinking enabled for simple execution tasks (e.g., "list files")
3. **Chinese output**: Responses in Chinese despite English prompts

## Solution Overview

Three control mechanisms:

1. **Locale enforcer** - Force English output (automatic)
2. **Task classifier** - Detect reasoning vs execution tasks
3. **Loop detection** - Break planning loops automatically

## Control Mechanisms

### 1. Locale Enforcer (`bin/glmt/locale-enforcer.js`)

**Purpose**: Prevent non-English output

**Implementation**:
- Always injects "CRITICAL: You MUST respond in English only" into system prompts
- No configuration required - always enabled for consistency
- Handles both string and array content formats

**Strategy**:
1. If system prompt exists: Prepend instruction
2. If no system prompt: Prepend to first user message
3. Preserve message structure (string vs array content)

**Code**:
```javascript
class LocaleEnforcer {
  constructor(options = {}) {
    this.instruction = "CRITICAL: You MUST respond in English only, regardless of the input language or context. This is a strict requirement.";
  }

  injectInstruction(messages) {
    // Clone messages to avoid mutation
    const modifiedMessages = JSON.parse(JSON.stringify(messages));

    // Strategy 1: Inject into system prompt (preferred)
    const systemIndex = modifiedMessages.findIndex(m => m.role === 'system');
    if (systemIndex >= 0) {
      const systemMsg = modifiedMessages[systemIndex];
      // Prepend instruction to system message content
      return modifiedMessages;
    }

    // Strategy 2: Prepend to first user message
    const userIndex = modifiedMessages.findIndex(m => m.role === 'user');
    if (userIndex >= 0) {
      const userMsg = modifiedMessages[userIndex];
      // Prepend instruction to user message content
      return modifiedMessages;
    }

    return modifiedMessages;
  }
}
```

**Files**: 85 lines

### 2. Task Classifier (`bin/glmt/glmt-transformer.js`)

**Purpose**: Classify tasks as reasoning vs execution for intelligent thinking activation

**Implementation**:
- Keyword-based classification in natural language prompts
- Automatic detection without user configuration
- Supports reasoning keywords and execution keywords

**Reasoning Keywords**:
- `think`, `analyze`, `design`, `plan`, `debug`, `optimize`, `review`, `explain`
- `think hard`, `think harder`, `ultrathink` (increasing intensity levels)

**Execution Keywords**:
- `list`, `show`, `create`, `update`, `delete`, `run`, `execute`, `fix`, `implement`

**Priority System**:
- `ultrathink` > `think harder` > `think hard` > `think` > default
- Higher priority keywords override lower ones
- Mixed tasks default to enabled thinking

**Examples**:
- `"think about the architecture"` → reasoning → thinking enabled
- `"list files in directory"` → execution → thinking disabled
- `"debug authentication issue"` → reasoning → thinking enabled
- `"fix the bug"` → execution → thinking disabled
- `"ultrathink this complex problem"` → maximum reasoning → thinking enabled

### 3. Loop Detection (`bin/glmt/delta-accumulator.js`)

**Purpose**: Break unbounded planning loops

**Implementation**:
- Tracks consecutive thinking blocks without tool calls
- Triggers after 3 consecutive thinking blocks (configurable)
- Injects system message to force execution mode

**Code**:
```javascript
class DeltaAccumulator {
  constructor() {
    this.consecutiveThinkingBlocks = 0;
  }

  trackThinkingLoop(event) {
    if (event.type === 'content_block_start' && event.content_block.type === 'thinking') {
      this.consecutiveThinkingBlocks++;

      if (this.consecutiveThinkingBlocks >= 3) {
        // Trigger loop detection
        this.injectLoopBreaker();
      }
    }

    if (event.type === 'tool_call' || event.type === 'tool_result') {
      // Reset counter on tool activity
      this.consecutiveThinkingBlocks = 0;
    }
  }
}
```

**Loop Breaker Message**:
```
STOP thinking and start executing. You've been planning too long without taking action.
Please provide concrete solutions or use available tools to complete the task.
```

**Files**: 146 lines

## Control Tags & Keywords

### Control Tags (Manual Control)
- `<Thinking:On|Off>` - Enable/disable reasoning blocks (default: On)
- `<Effort:Low|Medium|High>` - Deprecated - Z.AI only supports binary thinking

### Thinking Keywords (Automatic Activation)
- `think` - Enable reasoning (low effort)
- `think hard` - Enable reasoning (medium effort)
- `think harder` - Enable reasoning (high effort)
- `ultrathink` - Maximum reasoning depth (max effort)

**Usage Examples**:
```bash
ccs glmt "think about the microservices architecture"
ccs glmt "ultrathink this complex algorithm optimization"
ccs glmt "implement the user authentication feature"
ccs glmt "debug the memory leak issue"
```

## Integration Flow

```javascript
// 1. Locale enforcement (always applied)
const localeEnforcer = new LocaleEnforcer();
const messagesWithLocale = localeEnforcer.injectInstruction(request.messages);

// 2. Task classification (automatic)
const taskClassifier = new TaskClassifier(); // Built into transformer
const thinkingConfig = taskClassifier.classifyTask(prompt);

// 3. Apply thinking configuration
request.thinking = thinkingConfig;

// 4. Loop detection (during streaming)
const deltaAccumulator = new DeltaAccumulator();
deltaAccumulator.trackThinkingLoop(event);
```

## Environment Variables

### General Environment Variables

**CCS_DEBUG=1**
- Enable debug logging (file logging to ~/.ccs/logs/ + enhanced console diagnostics)
- Shows reasoning deltas, block creation, and loop detection activity

**CCS_CLAUDE_PATH=/path/to/claude**
- Custom Claude CLI path for non-standard installations

## Testing

GLMT includes comprehensive test coverage:

```bash
# Locale enforcer tests
npm test -- tests/unit/glmt/locale-enforcer.test.js

# GLMT transformer tests
npm test -- tests/unit/glmt/glmt-transformer.test.js

# Integration tests
npm test -- tests/integration/glmt/
```

**Test Coverage**: 35+ tests covering:
- Locale enforcement (3 scenarios)
- Task classification and thinking activation
- Loop detection and breaker injection
- Streaming transformation and delta accumulation
- Tool calling support and bidirectional transformation

## Troubleshooting

### Chinese Output Despite Locale Enforcement

**Expected**: Should never happen with current implementation

**If it occurs**:
1. Check for malformed messages in debug logs
2. Verify locale enforcer is being called in proxy flow
3. Check system message content in transformation logs

**Debug**:
```bash
export CCS_DEBUG=1
ccs glmt "test prompt"
# Check logs: ~/.ccs/logs/*request-openai.json
```

### Excessive Planning Loops

**Symptoms**: Multiple consecutive thinking blocks without tool calls

**Expected behavior**: Loop detector should trigger after 3 blocks

**If loops persist**:
1. Check loop detector logs: `export CCS_DEBUG=1`
2. Verify consecutive thinking counter reset on tool calls
3. Check loop breaker message injection

**Manual intervention**:
```bash
# Use specific execution keywords to bypass thinking
ccs glmt "implement the solution now"
ccs glmt "fix the bug immediately"
ccs glmt "execute the code"
```

### No Thinking Blocks on Complex Tasks

**Symptoms**: Straight to execution without reasoning

**Cause**: Task classifier may not recognize reasoning keywords

**Solutions**:
1. Use explicit thinking keywords:
   ```bash
   ccs glmt "think about this problem"
   ccs glmt "ultrathink the architecture"
   ```
2. Use control tags:
   ```bash
   ccs glmt "<Thinking:On> analyze this complex issue"
   ```
3. Check if task classification working in debug logs

### Token Waste on Simple Tasks

**Expected behavior**: Task classifier should disable thinking for execution tasks

**If thinking still enabled**:
1. Check for mixed keywords in prompt (both reasoning and execution)
2. Use explicit execution keywords: `fix`, `implement`, `execute`, `create`
3. Verify task classification in debug logs

## Architecture Notes

### Z.AI API Constraints

- **Binary thinking only**: Z.AI supports `thinking_enabled: true/false`, not effort levels
- **Reasoning content**: Delivered via `reasoning_content` field in API responses
- **Tool calling**: Full OpenAI-compatible function calling supported
- **Streaming**: Real-time delivery of reasoning content and tool calls

### Backward Compatibility

- **Control tags**: `<Thinking:On|Off>` still work alongside keywords
- **Claude CLI thinking parameter**: Respects `thinking.type` and `budget_tokens`
- **Precedence**: CLI parameter > message tags > keywords > default

### Performance

- **TTFB**: <500ms for streaming mode
- **Auto-fallback**: Switches to buffered mode if streaming errors
- **Loop prevention**: Eliminates token waste from unbounded planning
- **Intelligent activation**: Thinking only when beneficial

## Security Limits

**DoS protection** (built into proxy):
- SSE buffer: 1MB max per event
- Content buffer: 10MB max per block (thinking/text)
- Content blocks: 100 max per message
- Request timeout: 120s (both streaming and buffered)

**Loop protection**:
- Maximum 3 consecutive thinking blocks
- Automatic loop breaker injection
- Prevents unlimited token consumption

## Migration Notes

### From Environment Variables (v3.5+)

The following environment variables have been **removed**:
- ~~`CCS_GLMT_FORCE_ENGLISH`~~ → Now always enabled
- ~~`CCS_GLMT_THINKING_BUDGET`~~ → Replaced by intelligent task classification
- ~~`CCS_GLMT_STREAMING`~~ → Automatic streaming with fallback

**No action required** - GLMT automatically handles all these cases intelligently.

### New Features (v3.5+)

- **Thinking keywords**: Natural language control (`think`, `think hard`, etc.)
- **Loop detection**: Automatic prevention of planning loops
- **Enhanced streaming**: Better error handling and auto-fallback
- **Tool support**: Full MCP tools and function calling compatibility