# CCS - Claude Code Switch

<div align="center">

![CCS Logo](docs/assets/ccs-logo-medium.png)

**Một lệnh, không downtime, nhiều tài khoản**

Chuyển đổi giữa nhiều tài khoản Claude, GLM, và Kimi ngay lập tức.<br>
Ngừng hitting rate limits. Làm việc liên tục.


[![License](https://img.shields.io/badge/license-MIT-C15F3C?style=for-the-badge)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-lightgrey?style=for-the-badge)]()
[![npm](https://img.shields.io/npm/v/@kaitranntt/ccs?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/@kaitranntt/ccs)
[![PoweredBy](https://img.shields.io/badge/PoweredBy-ClaudeKit-C15F3C?style=for-the-badge)](https://claudekit.cc?ref=HMNKXOHN)

**Ngôn ngữ**: [English](README.md) | [Tiếng Việt](README.vi.md) | [日本語](README.ja.md)

</div>

---

## 🚀 Bắt Đầu Nhanh

### 🔑 Điều Kiện Tiên Quyết

**Trước khi cài đặt CCS, hãy đảm bảo bạn đã đăng nhập vào Claude CLI với tài khoản subscription:**
```bash
claude /login
```

### Phương Pháp Cài Đặt Chính

#### Option 1: npm Package (Được khuyến nghị)

**macOS / Linux / Windows**
```bash
npm install -g @kaitranntt/ccs
```

Tất cả các trình quản lý package chính đều được hỗ trợ:

```bash
# yarn
yarn global add @kaitranntt/ccs

# pnpm (ít hơn 70% dung lượng đĩa)
pnpm add -g @kaitranntt/ccs

# bun (nhanh hơn 30x)
bun add -g @kaitranntt/ccs
```

#### Option 2: Cài Đặt Trực Tiếp (Truyền thống)

**macOS / Linux**
```bash
curl -fsSL ccs.kaitran.ca/install | bash
```

**Windows PowerShell**
```powershell
irm ccs.kaitran.ca/install | iex
```

> **💡 Mẹo hiệu năng**: Cài truyền thống bỏ qua Node.js routing để khởi động nhanh hơn, nhưng tôi ưu tiên cập nhật npm do triển khai dễ dàng hơn.

### Cấu Hình (Tự Tạo)

**CCS tự động tạo cấu hình trong quá trình cài đặt** (thông qua script postinstall của npm).

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

### Đường Dẫn Claude CLI Tùy Chỉnh

Nếu Claude CLI được cài đặt ở vị trí không chuẩn (ổ D, thư mục tùy chỉnh), đặt `CCS_CLAUDE_PATH`:

```bash
export CCS_CLAUDE_PATH="/path/to/claude"              # Unix
$env:CCS_CLAUDE_PATH = "D:\Tools\Claude\claude.exe"   # Windows
```

**Xem [Hướng dẫn Khắc phục Sự cố](./docs/vi/troubleshooting.vi.md#claude-cli-ở-vị-trí-không-chuẩn) để biết chi tiết cài đặt.**

### Hỗ Trợ Symlink Windows (Chế Độ Nhà Phát Triển)

**Người dùng Windows**: Bật Chế độ Nhà phát triển để có symlink thực sự (hiệu suất tốt hơn, đồng bộ hóa tức thì):

1. Mở **Settings** → **Privacy & Security** → **For developers**
2. Bật **Developer Mode**
3. Cài đặt lại CCS: `npm install -g @kaitranntt/ccs`

**Nếu không có Chế độ Nhà phát triển**: CCS tự động chuyển sang sao chép thư mục (hoạt động nhưng không đồng bộ tức thì trên các profile).

---

### Lần Chuyển Đổi Đầu Tiên

> **⚠️ Quan trọng**: Trước khi dùng GLM, GLMT hay Kimi profile, cập nhật API key trong file settings:
> - **GLM**: Chỉnh sửa `~/.ccs/glm.settings.json` và thêm GLM API key
> - **GLMT**: Chỉnh sửa `~/.ccs/glmt.settings.json` và thêm Z.AI API key (yêu cầu coding plan)
> - **Kimi**: Chỉnh sửa `~/.ccs/kimi.settings.json` và thêm Kimi API key

```bash
# Claude subscription mặc định
ccs "Lên kế hoạch kiến trúc microservices"

# Chuyển sang GLM (tối ưu chi phí)
ccs glm "Tạo REST API"

# GLM với thinking mode
ccs glmt "Giải quyết bài toán thuật toán"

# Kimi cho lập trình
ccs kimi "Viết integration tests"
```

---

## Điểm Đau Hàng Ngày Của Lập Trình Viên

Lập trình viên đối mặt nhiều kịch bản subscription hàng ngày:

1. **Phân Tách Account**: Tài khoản Claude công ty vs Claude cá nhân → bạn phải tự chuyển context để giữ công việc và cá nhân riêng biệt
2. **Hết Rate Limit**: Claude dừng giữa chừng project → bạn phải tự tay sửa `~/.claude/settings.json`
3. **Quản Lý Chi Phí**: 2-3 subscriptions Pro ($20/tháng) vs Claude Max với chi phí 5x ($100/tháng) → Tier Pro là ngưỡng thực tế cho hầu hết lập trình viên
4. **Lựa Chọn Model**: Tác vụ khác nhau hưởng lợi từ thế mạnh model khác nhau → chuyển đổi thủ công

Chuyển đổi context thủ công làm gián đoạn workflow. **CCS quản lý liền mạch**.

## Tại Sao CCS Thay Vì Chuyển Đổi Thủ Công?

<div align="center">

| Tính năng | Lợi ích |
|-----------|---------|
| **Phân Cách Account** | Giữ công việc riêng với cá nhân |
| **Tối Ưu Chi Phí** | 2-3 account Pro vs Max 5x chi phí |
| **Chuyển Đổi Tức Thì** | Một lệnh, không sửa file |
| **Không Downtime** | Không gián đoạn workflow |
| **Quản Lý Rate Limit** | Chuyển account khi hết limit |
| **Đa Nền Tảng** | macOS, Linux, Windows |

</div>

**Giải pháp**:
```bash
ccs cong-ty      # Dùng account Claude công ty
ccs ca-nhan      # Chuyển sang account Claude cá nhân
ccs glm          # Chuyển sang GLM cho tác vụ tối ưu chi phí
ccs kimi         # Chuyển sang Kimi cho lựa chọn thay thế
# Hết rate limit? Chuyển ngay:
ccs glm          # Tiếp tục làm việc với GLM
# Cần account công ty khác?
ccs cong-ty-2    # Chuyển sang account công ty thứ hai
```

---

## 🏗️ Tổng Quan Kiến Trúc

**v3.0 Mô hình Login-Per-Profile**: Mỗi profile là một Claude instance riêng biệt nơi người dùng đăng nhập trực tiếp. Không cần sao chép credentials hay vault encryption.

```mermaid
flowchart TD
    subgraph "Người Dùng Input"
        USER["User chạy: ccs &lt;profile&gt; [args...]"]
    end

    subgraph "Engine Phát Hiện Profile"
        DETECT[ProfileDetector]
        PROFILE_CHECK{Profile tồn tại?}

        subgraph "Loại Profile"
            SETTINGS["Settings-based<br/>glm, kimi, default"]
            ACCOUNT["Account-based<br/>work, personal, team"]
        end
    end

    subgraph "Xử Lý Core CCS"
        CONFIG["Đọc config.json<br/>và profiles.json"]

        subgraph "Profile Handlers"
            SETTINGS_MGR["SettingsManager<br/>→ --settings flag"]
            INSTANCE_MGR["InstanceManager<br/>→ CLAUDE_CONFIG_DIR"]
        end
    end

    subgraph "Thực Thi Claude CLI"
        CLAUDE_DETECT["Claude CLI Detection<br/>Hỗ trợ CCS_CLAUDE_PATH"]

        subgraph "Phương Thức Thực Thi"
            SETTINGS_EXEC["claude --settings &lt;path&gt;"]
            INSTANCE_EXEC["CLAUDE_CONFIG_DIR=&lt;instance&gt; claude"]
        end
    end

    subgraph "API Layer"
        API["API Response<br/>Claude Sonnet 4.5<br/>GLM 4.6<br/>Kimi K2 Thinking"]
    end

    %% Flow connections
    USER --> DETECT
    DETECT --> PROFILE_CHECK
    PROFILE_CHECK -->|Có| SETTINGS
    PROFILE_CHECK -->|Có| ACCOUNT

    SETTINGS --> CONFIG
    ACCOUNT --> CONFIG

    CONFIG --> SETTINGS_MGR
    CONFIG --> INSTANCE_MGR

    SETTINGS_MGR --> SETTINGS_EXEC
    INSTANCE_MGR --> INSTANCE_EXEC

    SETTINGS_EXEC --> CLAUDE_DETECT
    INSTANCE_EXEC --> CLAUDE_DETECT

    CLAUDE_DETECT --> API
```

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

> **[!] CẢNH BÁO: CHƯA SẴN SÀNG SẢN XUẤT**
>
> **GLMT là thử nghiệm và yêu cầu gỡ lỗi sâu rộng**:
> - Streaming và hỗ trợ công cụ vẫn đang phát triển
> - Có thể gặp lỗi, timeout, hoặc phản hồi không đầy đủ
> - Yêu cầu gỡ lỗi thường xuyên và can thiệp thủ công
> - **Không khuyến nghị cho quy trình quan trọng hoặc sử dụng sản xuất**
>
> **Phương án thay thế cho GLM Thinking**: Cân nhắc trải qua **CCR hustle** với **Transformer của Bedolla** (ZaiTransformer) để có triển khai ổn định hơn.
>
> **[!] Quan trọng**: GLMT yêu cầu cài đặt npm (`npm install -g @kaitranntt/ccs`). Không có trong phiên bản shell gốc (yêu cầu Node.js HTTP server).

### GLM vs GLMT

| Tính năng | GLM (`ccs glm`) | GLMT (`ccs glmt`) |
|-----------|-----------------|-------------------|
| **Endpoint** | Tương thích Anthropic | Tương thích OpenAI |
| **Thinking** | Không | Thử nghiệm (reasoning_content) |
| **Tool Support** | Cơ bản | **Không ổn định (v3.5+)** |
| **MCP Tools** | Giới hạn | **Lỗi (v3.5+)** |
| **Streaming** | Ổn định | **Thử nghiệm (v3.4+)** |
| **TTFB** | <500ms | <500ms (đôi khi), 2-10s+ (thường xuyên) |
| **Use Case** | Công việc đáng tin cậy | **Chỉ thử nghiệm gỡ lỗi** |

---

## ⚡ Tính Năng

- **Chuyển Đổi Ngay Lập Tức** - `ccs glm` chuyển sang GLM, không cần sửa config
- **Phiên Đồng Thời** - Chạy nhiều profile cùng lúc ở các terminal khác nhau
- **Instance Riêng Biệt** - Mỗi profile có config riêng (`~/.ccs/instances/<profile>/`)
- **Đa Nền Tảng** - macOS, Linux, Windows - hoạt động giống nhau
- **Không Downtime** - Chuyển đổi ngay lập tức, không gián đoạn workflow


---

## 💻 Ví Dụ Sử Dụng

```bash
ccs              # Claude subscription (mặc định)
ccs glm          # GLM (không thinking)
ccs glmt         # GLM với thinking
ccs kimi         # Kimi cho Coding
ccs --version    # Hiển thị phiên bản
```

### Phiên Đồng Thời (Multi-Account)
```bash
# Tạo nhiều tài khoản Claude
ccs auth create cong-ty    # Tài khoản công ty
ccs auth create ca-nhan    # Tài khoản cá nhân
ccs auth create team       # Tài khoản team

# Terminal 1 - Tài khoản công ty
ccs cong-ty "implement feature"

# Terminal 2 - Tài khoản cá nhân (chạy đồng thời)
ccs ca-nhan "review code"
```

---

### 🗑️ Gỡ Cài Đặt

**Package Managers**
```bash
# npm
npm uninstall -g @kaitranntt/ccs

# yarn
yarn global remove @kaitranntt/ccs

# pnpm
pnpm remove -g @kaitranntt/ccs

# bun
bun remove -g @kaitranntt/ccs
```

**Uninstaller Chính Thức**

**macOS / Linux**
```bash
curl -fsSL ccs.kaitran.ca/uninstall | bash
```

**Windows PowerShell**
```powershell
irm ccs.kaitran.ca/uninstall | iex
```

---

## 🎯 Triết Lý

- **YAGNI**: Không có tính năng "phòng hờ"
- **KISS**: Bash đơn giản, không phức tạp
- **DRY**: Một nguồn chân lý duy nhất (config)

---

## 📖 Tài Liệu

**Tài liệu đầy đủ trong [docs/](./docs/)**:
- [Hướng dẫn Cài đặt](./docs/en/installation.md)
- [Cấu hình](./docs/en/configuration.md)
- [Ví dụ Sử dụng](./docs/en/usage.md)
- [System Architecture](./docs/system-architecture.md)
- [GLMT Control Mechanisms](./docs/glmt-controls.md)
- [Khắc phục Sự cố](./docs/en/troubleshooting.md)
- [Đóng góp](./CONTRIBUTING.md)

---

## 🤝 Đóng Góp

Chúng tôi chào mừng đóng góp! Vui lòng xem [Hướng dẫn Đóng góp](./CONTRIBUTING.md) để biết chi tiết.

---

## 📄 Giấy Phép

CCS được cấp phép theo [Giấy phép MIT](LICENSE).

---

<div align="center">

**Được tạo với ❤️ cho những lập trình viên hay hết rate limit**

[⭐ Star repo này](https://github.com/kaitranntt/ccs) | [🐛 Báo cáo vấn đề](https://github.com/kaitranntt/ccs/issues) | [📖 Đọc tài liệu](./docs/en/)

</div>
