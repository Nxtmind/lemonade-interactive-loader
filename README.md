# 🍋 Lemonade Interactive Loader

[![npm version](https://badge.fury.io/js/lemonade-interactive-loader.svg)](https://www.npmjs.com/package/lemonade-interactive-loader)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)](https://nodejs.org/)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20macOS-lightgrey.svg)](#)

**The easiest way to manage llama.cpp builds and run Lemonade Server**

Lemonade Interactive Loader is a professional, cross-platform CLI tool that simplifies downloading llama.cpp builds and launching Lemonade Server with an intuitive interactive interface.

## 🚀 Quick Start

### Installation

**Option 1: Install globally via npm**
```bash
npm install -g lemonade-interactive-loader
```

**Option 2: Run without installing (via npx)**
```bash
npx lemonade-interactive-loader
```

**Option 3: Install from source**
```bash
git clone https://github.com/yourusername/lemonade-interactive-loader.git
cd lemonade-interactive-loader
npm install
```

### Running the Tool

```bash
# If installed globally
lemonade-loader

# Or via npx (no installation needed)
npx lemonade-interactive-loader

# From source
npm start
# or
node index.js
```

That's it! You'll be presented with a friendly menu to configure and run your server.

## 🎯 What You Can Do

### Interactive Menu Options

The main menu adapts based on whether you have a configuration saved:

**When NO configuration exists:**
```
? What would you like to do?
❯ 🚀 Setup - Configure Lemonade Server
  📦 Download Custom llama.cpp Builds
```

**When configuration EXISTS:**
```
? What would you like to do?
❯ ▶️  Start Server with Current Config
  ✏️  Edit Configuration
  👁️  View Configuration
  🔄 Reset Configuration
  ──────────────────────────────────────
  🚀 Setup - Configure Lemonade Server
  📦 Download Custom llama.cpp Builds
```

| Command | Description |
|---------|-------------|
| **▶️ Start Server** | Launch Lemonade Server with saved config (when config exists) |
| **✏️ Edit Configuration** | Update your saved settings interactively |
| **👁️ View Configuration** | See your current configuration and installed builds |
| **🔄 Reset Configuration** | Start fresh by resetting all settings |
| **🚀 Setup** | Run the 8-question setup wizard to configure everything |
| **📦 Download Builds** | View, delete, or download custom llama.cpp builds |

### The Setup Wizard

Just answer 8 simple questions:

1. **Network access?** Should the server be accessible from other devices?
2. **Port number?** Which port should it run on? (default: 8080)
3. **Logging level?** Choose from info, debug, warning, or error
4. **Model directory?** Point to existing models (like LM Studio) if needed
5. **Interface type?** System tray or headless mode
6. **Custom arguments?** Any additional llama.cpp parameters?
7. **Custom build?** Use a specific llama.cpp build from GitHub?
8. **Backend?** Choose auto, vulkan, rocm, or cpu

## ✨ Key Features

- **🎨 User-Friendly Interface** - Interactive menus, no command-line expertise needed
- **💾 Smart Configuration** - Save settings once, use them forever
- **📦 Build Management** - Browse, download, and manage multiple llama.cpp builds
- **🖥️ Backend Flexibility** - Support for CPU, CUDA, ROCm, Vulkan, and more
- **🌐 Network Ready** - Easily configure localhost or network access
- **🔄 Cross-Platform** - Works seamlessly on Windows, Linux, and macOS
- **🎯 Auto-Detection** - Automatically suggests the best builds for your system
- **⚡ Quick Launch** - Start your server with a single command

## 📖 Documentation

- **📚 [Usage Guide](#-quick-start)** - Get started quickly
- **🔧 [Technical Documentation](TECHNICAL_README.md)** - Deep dive into architecture and API
- **🛠️ [Troubleshooting](#-troubleshooting)** - Common issues and solutions

## 🎬 Usage Examples

### First-Time Setup

```bash
$ node index.js

╔════════════════════════════════════════════════════════╗
║            🍋 Lemonade Interactive Launcher            ║
╚════════════════════════════════════════════════════════╝

⚠️  No configuration found. Please run Setup first.

? What would you like to do?
❯ 🚀 Setup - Configure Lemonade Server
  📦 Download Custom llama.cpp Builds
```

### After Configuration

```bash
$ node index.js

╔════════════════════════════════════════════════════════╗
║            🍋 Lemonade Interactive Launcher            ║
╚════════════════════════════════════════════════════════╝

? What would you like to do?
❯ ▶️  Start Server with Current Config
  ✏️  Edit Configuration
  👁️  View Configuration
  🔄 Reset Configuration
  ──────────────────────────────────────
  🚀 Setup - Configure Lemonade Server
  📦 Download Custom llama.cpp Builds
```

### Downloading a Custom Build

1. Select **📦 Download Custom llama.cpp Builds**
2. Choose **⬇️ Download new build**
3. Pick a release from the list
4. Select the asset for your platform
5. Sit back while it downloads and extracts automatically

### Running with Custom Models

Point Lemonade Server to your existing model directory (like LM Studio's):

```
? Is there another model directory to use? (example: LM Studio) Yes
? Enter the model directory path: /home/user/.local/share/lmstudio/models
```

## 🛠️ Configuration

Configuration is automatically saved and loaded:

- **Location**: `~/.lemonade-launcher/config.json` (Linux/macOS) or `%USERPROFILE%\.lemonade-launcher\config.json` (Windows)
- **Format**: JSON
- **Auto-saved**: After every setup or edit

### Example Configuration

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
  "customLlamacppPath": ""
}
```

## 🌍 Cross-Platform Support

### Supported Systems

| Platform | Versions | Architecture |
|----------|----------|--------------|
| **Windows** | 10, 11 | x64, arm64 |
| **Linux** | Ubuntu, Debian, CentOS, etc. | x64, arm64, armv7l |
| **macOS** | 10.15+ (Catalina+) | x64, arm64 (Apple Silicon) |

### Automatic Platform Detection

Lemonade Launcher automatically:
- Detects your operating system and architecture
- Suggests the best matching llama.cpp builds
- Uses the correct file paths and command syntax
- Handles platform-specific quirks

## 📦 Programmatic Usage

Use Lemonade Launcher as a library in your own projects:

```javascript
const { 
  fetchAllReleases,
  downloadAndExtractLlamaCpp,
  loadConfig,
  saveConfig
} = require('./src/index');

// Fetch available releases
const releases = await fetchAllReleases(10);

// Download a specific build
await downloadAndExtractLlamaCpp(asset, version);

// Manage configuration
const config = loadConfig();
config.port = 9090;
saveConfig(config);
```

See the [Technical Documentation](TECHNICAL_README.md) for the full API reference.

## 🐛 Troubleshooting

### Common Issues

#### "Command not found" or "npm: command not found"
**Solution**: Ensure Node.js and npm are installed and in your PATH.

#### Permission denied errors (Linux/macOS)
```bash
chmod +x index.js
```

#### Permission denied errors (Windows)
Run Command Prompt or PowerShell as Administrator.

#### Build download fails
- Check your internet connection
- Ensure you have write permissions to `~/.lemonade-launcher/`
- Try downloading the asset manually from GitHub

#### Server won't start
- Verify lemonade-server is installed: [lemonade-server.ai](https://lemonade-server.ai)
- Check that the configuration is correct: `node index.js` → View Configuration
- Try running with debug logging: Set log level to "debug" in setup

### Getting Help

1. Check the [Technical Documentation](TECHNICAL_README.md)
2. Review the [Troubleshooting Guide](TECHNICAL_README.md#troubleshooting)
3. Open an issue on GitHub

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Make** your changes
4. **Test** thoroughly on your platform
5. **Commit** your changes (`git commit -m 'Add amazing feature'`)
6. **Push** to the branch (`git push origin feature/amazing-feature`)
7. **Open** a Pull Request

### Code of Conduct

- Be respectful and inclusive
- Follow the existing code style
- Write clear commit messages
- Document your changes

## 📚 Resources

- [Technical Documentation](TECHNICAL_README.md) - Architecture, API reference, and development guide
- [llama.cpp](https://github.com/ggml-org/llama.cpp) - The underlying inference engine
- [Lemonade Server](https://lemonade-server.ai) - The server being launched

## 📄 License

This project is licensed under the ISC License. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [llama.cpp](https://github.com/ggml-org/llama.cpp) team for the amazing inference engine
- [Lemonade Server](https://lemonade-server.ai) for the server implementation
- The Node.js community for the fantastic ecosystem

---

**Made with 🍋 by Nxtmind**

*Happy prompting!*