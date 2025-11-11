# Why Session Sharing Fails Across Profiles: Technical Analysis

## Overview

Claude CLI sessions cannot be directly shared across CCS profiles due to authentication architecture constraints. When a user starts a thread on a "work" profile and the account expires, resuming from a "personal" profile fails despite the local session file being present.

**Core Problem**: Thread IDs stored locally, but API-side validation requires matching OAuth credentials. Session "ownership" bound to account that created it, preventing cross-account continuation.

## Technical Architecture: How Claude CLI Sessions Work

### Session Storage Structure

```
~/.claude/
├── .credentials.json          # OAuth tokens (access, refresh, expiry)
├── projects/
│   └── <project-hash>/
│       └── <sessionId>.jsonl  # Thread conversation history
├── session-env/               # Ephemeral runtime state (empty dirs)
└── todos/                     # Task tracking
```

### Session File Format (JSONL)

Each thread stored as newline-delimited JSON:

```jsonl
{"type":"user","sessionId":"<uuid>","message":{"role":"user","content":"..."},"uuid":"<msg-id>","timestamp":"..."}
{"type":"assistant","sessionId":"<uuid>","message":{"role":"assistant","content":[...]},"requestId":"req_...","uuid":"<msg-id>","timestamp":"..."}
```

**Key Fields**:
- `sessionId`: Thread UUID (e.g., `58921318-0aed-4238-b6cb-d0d6222fc095`)
- `message`: User/assistant conversation turns
- `requestId`: API request ID (server-generated, scoped to original auth)
- **No embedded auth tokens**: Credentials stored separately in `.credentials.json`

### OAuth 2.0 Authentication Model

**Credential File** (`~/.claude/.credentials.json`):
```json
{
  "claudeAiOauth": {
    "accessToken": "sk-ant-oat01-...",
    "refreshToken": "sk-ant-ort01-...",
    "expiresAt": 1762851849221,
    "scopes": ["user:inference", "user:profile"],
    "subscriptionType": "max"
  }
}
```

**Flow**:
1. User runs `claude --resume <sessionId>`
2. CLI reads `~/.claude/projects/<project>/<sessionId>.jsonl`
3. CLI reconstructs full conversation history
4. CLI submits request to API with OAuth token from `.credentials.json`
5. **API validates token + session ownership (inferred)**
6. API responds (session context maintained client-side only)

### API-Side Validation

Claude API is stateless. "Sessions" are client-side constructs:
- Thread ID alone does NOT authorize continuation
- Each request requires valid OAuth token
- Server likely validates session creator identity (undocumented but inferred from org ID headers)
- No server-side session state tied to thread IDs

## Why Direct Sharing Fails: Core Technical Blockers

| Component | Transferable? | Blocker |
|-----------|--------------|---------|
| Session JSONL file | ✅ Yes | None (plain text) |
| Thread ID (UUID) | ✅ Yes | None (identifier only) |
| Conversation history | ✅ Yes | None (embedded in JSONL) |
| OAuth token | ❌ No | Account-specific, expires |
| API authorization | ❌ No | Server-side session ownership validation |

### OAuth Token Mismatch

- Work profile session created with `work_oauth_token`
- Personal profile uses `personal_oauth_token`
- API rejects requests where token doesn't match session creator (inferred)

### Organization ID Boundaries

Anthropic returns `anthropic-organization-id` header in responses. Sessions may be scoped to:
- User account ID
- Organization ID (for team accounts)
- Subscription tier

Cross-account access would violate organizational isolation.

### Session Ownership Enforcement

No documented API for "transferring" session ownership. Thread ID is identifier, not authorization:
- Like a file path: knowing the path doesn't grant read access
- Requires matching credentials to prove ownership
- No "share session" endpoint exists in Claude API

### Documentation Gaps

- No cross-account access docs in official Claude API documentation
- No session sharing/transfer APIs in CLI or Agent SDK
- Security model not explicitly documented (inferred from OAuth behavior)

## Security Implications: Why This Is By Design

### Risks if Session Sharing Were Possible

| Risk | Impact |
|------|--------|
| Context Leak | Conversation history exposed to unintended accounts |
| Privilege Escalation | Lower-tier account accessing higher-tier sessions |
| Organizational Data Breach | Work conversations leaked to personal accounts |
| Audit Trail Corruption | Session actions attributed to wrong user |

### Current Security Posture

- **Credential Isolation**: OAuth tokens stored per-profile (CCS architecture)
- **POSIX Permissions**: `~/.claude/` readable only by user (`700` permissions)
- **No Session Encryption**: JSONL files plain text (relies on OS security)
- **Profile Separation**: CCS v3.0 login-per-profile prevents credential mixing

### Design Intent

Session isolation prevents:
1. **Cross-account context leakage**: Alice's work threads stay with work account
2. **Subscription boundary violations**: Free account can't "resume" Pro sessions
3. **Organizational data governance**: Company data stays within company accounts

## Alternative Approaches: What Works Instead

### Manual JSONL Copy (Workaround, Not Recommended)

**Process**:
1. Copy session file: `~/.ccs/instances/work/.claude/projects/<project>/<sessionId>.jsonl`
2. Generate new UUID: `new_id=$(uuidgen | tr '[:upper:]' '[:lower:]')`
3. Replace `sessionId` in JSONL: `sed 's/<old_id>/<new_id>/g' file.jsonl > new.jsonl`
4. Place in personal profile: `~/.ccs/instances/personal/.claude/projects/<project>/<new_id>.jsonl`
5. Resume: `ccs personal` → `claude --resume <new_id>`

**Issues**:
- Fragile (breaks if JSONL structure changes)
- No UUID regeneration for `parentUuid`, message `uuid` fields
- Risk of malformed JSON breaking CLI
- Manual process prone to errors

### Context Export/Import (PARTIALLY FEASIBLE, Not Implemented)

**Concept**:
```bash
# Work profile (before expiration)
ccs export-context --session <id> --output work-context.json

# Personal profile (after expiration)
ccs import-context work-context.json --new-session
```

**Process**:
1. **Export**: Read JSONL → extract message history → strip metadata → save portable JSON
2. **Import**: Parse JSON → generate new session UUID → reconstruct JSONL with personal auth context
3. **Resume**: Use new session ID with personal OAuth token

**Advantages**:
- ✅ Preserves conversation history
- ✅ New session = clear ownership (personal account)
- ✅ No cross-account authorization issues
- ✅ Explicit user action (no silent credential sharing)
- ✅ Audit-friendly (new session ID)

**Status**: DEFERRED (not implemented in CCS v3.0)

### User Experience Flow (Proposed)

```
$ ccs export-session 58921318-0aed-4238-b6cb-d0d6222fc095
✓ Exported 47 messages to ~/ccs-export-58921318.json

[Account expires]

$ ccs personal
$ ccs import-session ~/ccs-export-58921318.json
✓ Imported as new thread: a1b2c3d4-5678-9012-3456-789012345678
✓ Resume with: claude --resume a1b2c3d4-5678-9012-3456-789012345678

$ claude --resume a1b2c3d4-5678-9012-3456-789012345678 "Continue from earlier"
[Claude continues with full context under personal auth]
```

## Recommendations: Clear Guidance

### REJECT: Direct Session Sharing

**Do NOT implement**:
- Copying session files between profiles without regeneration
- Reusing thread IDs across accounts
- "Resuming" sessions created by different OAuth tokens

**Reason**: Violates inferred security model; likely fails API-side validation.

### DEFER: Export/Import Feature

**Status**: Feasible but not critical for CCS v3.0.

**Priority**: Phase 3 (post-launch).

**Effort**: Medium (~3-5 days implementation + testing).

**Dependencies**:
- JSONL parsing/reconstruction logic
- UUID generation for new sessions
- Profile-aware file I/O

### Document: Manual Workaround

**For Advanced Users** (FAQ section):

1. Manually copy JSONL file
2. Edit `sessionId` fields (use `jq` or `sed`)
3. Regenerate UUIDs for messages (optional but safer)
4. Place in target profile's `.claude/projects/` directory
5. Resume with `claude --resume <new_id>`

**Warning**: Unsupported; may break with Claude CLI updates.

## Unresolved Questions

1. **Does Claude API enforce server-side session ownership?**
   Inferred from OAuth architecture; no official docs confirm. Would require API testing.

2. **What is `~/.claude/session-env/` used for?**
   Contains empty UUID directories; possibly ephemeral runtime state. Doesn't affect persistence.

3. **Can malformed JSONL crash Claude CLI?**
   Likely yes (JSON parsing errors). Manual editing risky without validation.

4. **What happens if imported session references inaccessible resources?**
   E.g., work git repo personal account can't access. Claude will continue but may request clarification.
