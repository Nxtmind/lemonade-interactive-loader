# Lemonade Launcher - Technical Documentation

> **Note:** For general usage information, please see the main [README.md](README.md).

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Module Documentation](#module-documentation)
- [API Reference](#api-reference)
- [Development Guide](#development-guide)
- [Cross-Platform Considerations](#cross-platform-considerations)
- [Configuration Schema](#configuration-schema)

---

## Architecture Overview

Lemonade Launcher follows a modular architecture pattern with clear separation of concerns:

```
┌─────────────────┐
│   Entry Point   │ index.js
└────────┬────────┘
         │
┌────────▼────────┐
│   Source Code   │ src/
│   (Modular)     │
└────────┬────────┘
         │
    ┌────┴────┬────────────┬──────────┬─────────┐
    │         │            │          │         │
┌───▼───┐ ┌──▼────┐  ┌────▼────┐ ┌───▼───┐
│ Config│ │Services│  │  Utils  │ │  CLI  │
└───────┘ └────────┘  └─────────┘ └───────┘
```

### Architecture Principles

1. **Separation of Concerns**: Each module has a single responsibility
2. **Dependency Injection**: Modules depend on abstractions, not concretions
3. **Cross-Platform**: All code works on Windows, Linux, and macOS
4. **Error Handling**: Proper error handling with informative messages
5. **Modularity**: Easy to test, maintain, and extend

---

## Project Structure

```
lemonade-llama-loader/
├── index.js                 # Main entry point (15 lines)
├── src/
│   ├── index.js             # Module exports and re-exports
│   ├── config/
│   │   ├── index.js         # Config persistence (load/save/reset)
│   │   └── constants.js     # App constants and defaults
│   ├── services/
│   │   ├── github.js        # GitHub API interactions
│   │   ├── download.js      # Download and extraction logic
│   │   ├── asset-manager.js # Build lifecycle management
│   │   └── server.js        # Server launch and management
│   ├── utils/
│   │   └── system.js        # System detection and utilities
│   └── cli/
│       ├── menu.js          # Main menu system
│       ├── prompts.js       # Interactive prompts
│       └── setup-wizard.js  # 8-question setup wizard
├── README.md                # User-facing documentation
├── TECHNICAL_README.md      # This file
└── package.json
```

---

## Module Documentation

### Config Module (`src/config/`)

#### `constants.js`

Centralized configuration for all application constants:

```javascript
// Configuration directories
USER_CONFIG_DIR: ~/.lemonade-launcher
USER_CONFIG_FILE: ~/.lemonade-launcher/config.json
DEFAULT_LLAMACPP_INSTALL_DIR: ~/.lemonade-launcher/llama-cpp

// GitHub API
GITHUB_RELEASES_URL: https://api.github.com/repos/ggml-org/llama.cpp/releases
GITHUB_API_HEADERS: { 'User-Agent': 'lemonade-launcher', ... }

// Backend types
BACKEND_TYPES: { AUTO, CPU, CUDA, ROCM, VULKAN, SYCL, OPENCL }

// Logging levels
LOG_LEVELS: { DEBUG, INFO, WARNING, ERROR }

// Run modes
RUN_MODES: { HEADLESS, SYSTEM_TRAY }

// Network configuration
HOSTS: { LOCALHOST, ALL_INTERFACES }

// Default values
DEFAULTS: { PORT: 8080, LOG_LEVEL: 'info', ... }
```

#### `index.js`

Configuration persistence functions:

- `loadConfig()`: Load configuration from file
- `saveConfig(config)`: Save configuration to file
- `resetConfig()`: Reset configuration to defaults

---

### Services Module (`src/services/`)

#### `github.js`

GitHub API interactions:

```javascript
async function fetchAllReleases(limit = 20): Promise<Array>
async function fetchLatestRelease(): Promise<Object>
```

#### `download.js`

File download and extraction:

```javascript
async function downloadFile(url: string, outputPath: string): Promise<void>
async function extractArchive(archivePath: string, extractDir: string): Promise<void>
```

Supports:
- `.tar.gz` archives (using `tar` library)
- `.zip` archives (using `adm-zip` library)
- Progress tracking during download
- Automatic redirect following

#### `asset-manager.js`

Build lifecycle management:

```javascript
function isAssetInstalled(version: string, assetName: string): boolean
function markAssetAsInstalled(version: string, assetName: string): void
function getAllInstalledAssets(): Array
function getLlamaServerPath(installPath: string): string|null
async function downloadAndExtractLlamaCpp(asset: Object, version: string): Promise<string>
function deleteInstalledAsset(installPath: string): boolean
```

#### `server.js`

Server launch and management:

```javascript
function buildServerArgs(config: Object): Array
function formatCommand(serverPath: string, args: Array, envVars: Object): string
async function launchLemonadeServer(config: Object): Promise<void>
```

---

### Utils Module (`src/utils/`)

#### `system.js`

System detection and utilities:

```javascript
function detectSystem(): { platform, arch, osType }
function formatBytes(bytes: number): string
function inferBackendType(assetName: string): string
function categorizeAsset(assetName: string): string
function getAssetType(assetName: string): 'zip'|'tar'|'unknown'
function filterServerAssets(assets: Array): Array
function findLlamaServer(extractDir: string): string|null
```

---

### CLI Module (`src/cli/`)

#### `menu.js`

Main menu system and command routing:

```javascript
async function showMainMenu(): Promise<string>
async function showManageMenu(): Promise<string>
async function handleCommand(command: string): Promise<void>
async function runCLI(): Promise<void>
```

#### `prompts.js`

Interactive prompts for user input:

```javascript
async function selectLlamaCppRelease(): Promise<Object>
async function selectAsset(release: Object): Promise<Object>
async function selectInstalledAssetPrompt(): Promise<Object|null>
async function askLaunchServer(): Promise<boolean>
function displayConfigSummary(config: Object): void
```

#### `setup-wizard.js`

8-question setup wizard:

```javascript
async function runSetupWizard(isEdit: boolean = false): Promise<Object>
```

Questions:
1. Local network exposure (yes/no)
2. Port selection (default: 8080)
3. Log level (info/debug/warning/error)
4. Custom model directory (optional)
5. Run mode (system-tray/headless)
6. Custom llama.cpp args (optional)
7. Custom build (yes/no)
8. Backend selection (auto/vulkan/rocm/cpu)

---

## API Reference

### Programmatic Usage

```javascript
const { 
  // Configuration
  loadConfig,
  saveConfig,
  resetConfig,
  
  // Services
  fetchAllReleases,
  fetchLatestRelease,
  downloadFile,
  extractArchive,
  getAllInstalledAssets,
  downloadAndExtractLlamaCpp,
  launchLemonadeServer,
  
  // Utils
  detectSystem,
  formatBytes,
  inferBackendType,
  categorizeAsset,
  findLlamaServer,
  
  // CLI
  runSetupWizard
} = require('./src/index');
```

### Example: Fetch and Download Build

```javascript
const { fetchAllReleases, downloadAndExtractLlamaCpp } = require('./src/index');

async function downloadLatest() {
  const releases = await fetchAllReleases(1);
  const release = releases[0];
  
  // Filter for server binaries
  const serverAssets = release.assets.filter(a => 
    a.name.includes('bin') && (a.name.endsWith('.zip') || a.name.endsWith('.tar.gz'))
  );
  
  // Download first asset
  await downloadAndExtractLlamaCpp(serverAssets[0], release.tag_name);
}
```

---

## Development Guide

### Adding New Features

1. **Identify the appropriate module**:
   - Configuration changes → `src/config/`
   - Business logic → `src/services/`
   - Utilities → `src/utils/`
   - User interface → `src/cli/`

2. **Create the new module/file**:
   ```bash
   # Example: Adding a new service
   touch src/services/new-service.js
   ```

3. **Export from main index**:
   ```javascript
   // src/index.js
   module.exports = {
     // ... existing exports
     newFunction: require('./services/new-service').newFunction
   };
   ```

4. **Update documentation**:
   - Add to TECHNICAL_README.md
   - Update README.md if user-facing

### Code Style Guidelines

- Use ES6+ syntax (const/let, arrow functions, async/await)
- Write JSDoc comments for public APIs
- Use meaningful variable and function names
- Keep functions small and focused (single responsibility)
- Handle errors gracefully with informative messages
- Write cross-platform code (use `path` module, avoid platform-specific assumptions)

### Testing Strategy

When adding tests:

```javascript
// Example test structure
const { loadConfig, saveConfig, resetConfig } = require('./config');

describe('Config Module', () => {
  beforeEach(() => {
    resetConfig();
  });
  
  test('should save and load configuration', () => {
    const config = { port: 9090, logLevel: 'debug' };
    saveConfig(config);
    
    const loaded = loadConfig();
    expect(loaded.port).toBe(9090);
    expect(loaded.logLevel).toBe('debug');
  });
});
```

---

## Cross-Platform Considerations

### File Paths

```javascript
// ✅ Good - Uses path module
const configPath = path.join(os.homedir(), '.lemonade-launcher', 'config.json');

// ❌ Bad - Hardcoded path separators
const configPath = '~/.lemonade-launcher/config.json';
```

### Command Execution

```javascript
// ✅ Good - Cross-platform command formatting
function formatCommand(serverPath, args, envVars) {
  if (process.platform === 'win32') {
    // Windows: set VAR=value && command
    return buildWindowsCommand(serverPath, args, envVars);
  } else {
    // Unix: VAR=value command
    return buildUnixCommand(serverPath, args, envVars);
  }
}
```

### Executable Extensions

```javascript
// ✅ Good - Platform-aware executable detection
const candidates = process.platform === 'win32' 
  ? ['llama-server.exe'] 
  : ['llama-server'];
```

### Environment Variables

```javascript
// ✅ Good - Always use process.env
process.env.LEMONADE_LLAMACPP_CPU_BIN = '/path/to/binary';

// ❌ Bad - Shell-specific syntax
execSync('export VAR=value'); // Won't work on Windows
```

---

## Configuration Schema

### Configuration File Structure

```json
{
  "exposeToNetwork": false,
  "host": "127.0.0.1",
  "port": 8080,
  "logLevel": "info",
  "backend": "auto",
  "modelDir": "None",
  "runMode": "system-tray",
  "llamacppArgs": "",
  "customLlamacppPath": "",
  "customBackendType": "",
  "customServerPath": "",
  "createdAt": "2026-03-01T12:00:00.000Z",
  "updatedAt": "2026-03-01T12:00:00.000Z"
}
```

### Field Descriptions

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `exposeToNetwork` | boolean | No | false | Whether to bind to 0.0.0.0 |
| `host` | string | No | 127.0.0.1 | Server bind address |
| `port` | number | No | 8080 | Server port |
| `logLevel` | string | No | "info" | Logging verbosity |
| `backend` | string | No | "auto" | Backend type |
| `modelDir` | string | No | "None" | Custom model directory |
| `runMode` | string | No | "system-tray" | System tray or headless |
| `llamacppArgs` | string | No | "" | Additional llama.cpp args |
| `customLlamacppPath` | string | No | "" | Custom build path |
| `customBackendType` | string | No | "" | Backend type of custom build |
| `customServerPath` | string | No | "" | Server binary path |

### Valid Values

- **logLevel**: `"debug"`, `"info"`, `"warning"`, `"error"`
- **backend**: `"auto"`, `"cpu"`, `"cuda"`, `"rocm"`, `"vulkan"`, `"sycl"`
- **runMode**: `"headless"`, `"system-tray"`

---

## Troubleshooting

### Common Development Issues

#### Module Not Found

```javascript
// Ensure correct relative path
const { loadConfig } = require('./config'); // From src/config/index.js
```

#### Cross-Platform Path Issues

```javascript
// Always use path.join
const correctPath = path.join(baseDir, 'subdir', 'file.txt');
```

#### Async/Await Errors

```javascript
// Always use async/await for async functions
async function main() {
  const releases = await fetchAllReleases(10);
  // ...
}
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (when available)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Review Checklist

- [ ] Code follows established patterns
- [ ] Cross-platform compatibility verified
- [ ] Error handling is appropriate
- [ ] Documentation is updated
- [ ] No console.log statements (use proper logging)

---

## License

ISC