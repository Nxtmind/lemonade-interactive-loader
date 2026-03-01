# 🍋 Lemonade Llama Loader

An interactive CLI tool to download llama.cpp releases and launch Lemonade Server with a user-friendly setup wizard.

**Cross-platform support:** Windows, Linux, and macOS

## Features

- **🚀 Setup Wizard** - Interactive 8-question wizard to configure Lemonade Server
- **💾 Persistent Configuration** - Save and reuse your settings across sessions
- **🔄 Edit Configuration** - Update your settings anytime
- **🍋 Download llama.cpp Builds** - Browse, download, and extract llama.cpp releases
- **🖥️ Backend Selection** - Choose from auto, vulkan, rocm, or cpu backends
- **🌐 Network Configuration** - Easily configure local network exposure
- **📁 Custom Model Directories** - Point to existing model directories (e.g., LM Studio)
- **⚙️ Custom llama.cpp Args** - Pass additional arguments to llama.cpp
- **📦 Custom Builds** - Download specific llama.cpp builds from GitHub
- **🍋 Direct Server Launch** - Start lemonade-server with your saved configuration

## Installation

```bash
npm install
```

## Usage

### Interactive Mode

Run the CLI tool to access the main menu:

```bash
npm start
# or
node index.js
```

The tool will present you with the following options:

1. **🚀 Setup** - Run the interactive setup wizard (8 questions)
2. **🔄 Edit Configuration** - Update your saved configuration
3. **👁️ View Configuration** - View your current configuration
4. **🔄 Reset Configuration** - Reset all configuration to defaults
5. **🍋 Download Build Only** - Download a llama.cpp build without launching
6. **🚀 Start Server** - Launch lemonade-server with current configuration

### Setup Wizard

The setup wizard asks 8 questions:

1. **Local Network Exposure** - Should the server be accessible from other devices?
2. **Port** - Which port should the server run on? (default: 8080)
3. **Log Level** - info, debug, warning, or error
4. **Backend** - auto, vulkan, rocm, or cpu
5. **Custom Model Directory** - Path to existing models (e.g., LM Studio)
6. **Run Mode** - system-tray or headless
7. **llama.cpp Args** - Additional command-line arguments
8. **Custom Build** - Download a specific llama.cpp build from GitHub

### Commands

```bash
# Run the setup wizard
node index.js

# View current configuration
node index.js --view

# Reset configuration
node index.js --reset
```

### Configuration File

Configuration is stored at:
- **Linux/macOS**: `~/.lemonade/config.json`
- **Windows**: `%USERPROFILE%\.lemonade\config.json`

Example configuration:

```json
{
  "exposeToNetwork": false,
  "host": "127.0.0.1",
  "port": 8080,
  "logLevel": "info",
  "backend": "auto",
  "modelDir": "None",
  "runMode": "headless",
  "llamacppArgs": "",
  "customLlamacppPath": "",
  "createdAt": "2026-03-01T12:00:00.000Z",
  "updatedAt": "2026-03-01T12:00:00.000Z"
}
```

## Cross-Platform Support

### Supported Operating Systems

- ✅ **Windows** (x64, arm64)
- ✅ **Linux** (x64, arm64, armv7l)
- ✅ **macOS** (x64, arm64/Apple Silicon)

### Platform-Specific Behavior

#### File Paths
- **Linux/macOS**: Uses Unix-style paths (`/home/user/.lemonade/`)
- **Windows**: Uses Windows-style paths (`C:\Users\user\.lemonade\`)
- All paths are automatically handled by Node.js `path` module

#### Command Execution
- **Linux/macOS**: Uses standard shell command execution
- **Windows**: Uses `set VAR=value` syntax for environment variables
- Commands are automatically formatted for the current platform

#### Executable Extensions
- **Windows**: Automatically looks for `.exe` files (e.g., `llama-server.exe`)
- **Linux/macOS**: Uses standard executable files (e.g., `llama-server`)

### Installation Paths

| Platform | Config Directory | lemonade-server Path |
|----------|-----------------|---------------------|
| Linux | `~/.lemonade/` | `/usr/local/bin/lemonade-server` |
| macOS | `~/.lemonade/` | `/opt/homebrew/bin/lemonade-server` |
| Windows | `%USERPROFILE%\.lemonade\` | `%USERPROFILE%\AppData\Local\lemonade_server\bin\lemonade-server.exe` |

### llama.cpp Build Downloads

The tool automatically detects your platform and architecture to suggest the best matching builds:

- **Windows**: Downloads `.zip` archives with Windows binaries
- **Linux**: Downloads `.tar.gz` archives with Linux binaries
- **macOS**: Downloads macOS-specific builds

## Environment Variables

The tool sets one of the following environment variables based on your selected backend:

| Variable | Backend |
|----------|---------|
| `LEMONADE_LLAMACPP_CPU_BIN` | CPU backend |
| `LEMONADE_LLAMACPP_CUDA_BIN` | CUDA backend |
| `LEMONADE_LLAMACPP_ROCM_BIN` | ROCm backend |
| `LEMONADE_LLAMACPP_VULKAN_BIN` | Vulkan backend |
| `LEMONADE_LLAMACPP_SYCL_BIN` | SYCL backend |

### Custom Install Directory

llama.cpp builds are downloaded to platform-specific locations:

| Platform | Install Directory |
|----------|------------------|
| Linux | `~/.lemonade/llama-cpp/{version}/{archive-name}/` |
| macOS | `~/.lemonade/llama-cpp/{version}/{archive-name}/` |
| Windows | `%USERPROFILE%\.lemonade\llama-cpp\{version}\{archive-name}\` |

Each build is extracted into a subdirectory named after the archive (without extension).

Example: `llama-b8182-bin-ubuntu-x64.tar.gz` → `~/.lemonade/llama-cpp/b8182/llama-b8182-bin-ubuntu-x64/`

## Requirements

- **Node.js**: Version 14.0.0 or higher
- **npm**: Version 6.0.0 or higher

### Platform Requirements

#### Windows
- Windows 10 or later
- Visual C++ Redistributable (for native modules)
- PowerShell or Command Prompt

#### Linux
- glibc 2.17 or later
- Standard build tools (for native modules)
- Bash shell

#### macOS
- macOS 10.15 (Catalina) or later
- Xcode Command Line Tools (for native modules)

## Troubleshooting

### Windows-Specific Issues

#### "Permission Denied" Errors
Run Command Prompt or PowerShell as Administrator:
```cmd
npm install -g lemonade-loader
```

#### Path Issues
If you encounter path-related errors, ensure:
- No spaces in installation paths (or use quoted paths)
- Environment variables are properly set using `set` command

### Linux-Specific Issues

#### Missing Dependencies
Install required build tools:
```bash
# Ubuntu/Debian
sudo apt-get install build-essential

# CentOS/RHEL
sudo yum install gcc-c++ make
```

#### Permission Issues
Make the script executable:
```bash
chmod +x index.js
```

### Cross-Platform Issues

#### Environment Variables Not Set
- **Windows**: Use `set VAR=value` syntax
- **Linux/macOS**: Use `export VAR=value` syntax
- The tool automatically handles this, but manual setup may require platform-specific syntax

#### Archive Extraction Fails
- Ensure you have write permissions to the target directory
- Check available disk space
- Try downloading the archive manually and extracting with platform-native tools

## Programmatic Usage

Import the module to use individual functions:

```javascript
const { 
  fetchLatestRelease, 
  fetchAllReleases,
  downloadFile,
  extractArchive,
  findLlamaServer,
  categorizeAsset 
} = require('./index.js');

// Fetch releases
const releases = await fetchAllReleases(10);
console.log(releases[0].tag_name);

// Download and extract
await downloadFile(url, './download.zip');
await extractArchive('./download.zip', './extract-dir');

// Find the server binary
const serverPath = findLlamaServer('./extract-dir');
```

## Installation Directory

By default, binaries are stored in:
- **Linux/macOS**: `~/.lemonade-llamacpp/`
- **Windows**: `%USERPROFILE%\.lemonade-llamacpp\`

Each release is stored in its own subdirectory (e.g., `~/.lemonade-llamacpp/b8172/`).

## Environment Variable Reference

| Variable | Description |
|----------|-------------|
| `LEMONADE_LLAMACPP_ROCM_BIN` | Path to custom `llama-server` binary for ROCm backend |
| `LEMONADE_LLAMACPP_VULKAN_BIN` | Path to custom `llama-server` binary for Vulkan backend |
| `LEMONADE_LLAMACPP_CPU_BIN` | Path to custom `llama-server` binary for CPU backend |
| `LEMONADE_LLAMACPP_CUDA_BIN` | Path to custom `llama-server` binary for CUDA backend |
| `LEMONADE_LLAMACPP_DIR` | Custom installation directory for llama.cpp binaries |

## Dependencies

- Node.js 18+
- `inquirer` - Interactive CLI prompts
- `tar` - Tar archive extraction
- `unzipper` - ZIP archive extraction

## License

ISC