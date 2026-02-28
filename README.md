# 🍋 Lemonade Llama Loader

An interactive CLI tool to download llama.cpp releases and launch Lemonade Server with the appropriate backend binary.

## Features

- **Interactive release selection** - Browse and select from the latest llama.cpp releases
- **Smart asset detection** - Automatically detects your system and suggests matching binaries
- **Backend categorization** - Organized by CPU, CUDA, ROCm, Vulkan, SYCL, and more
- **Automatic download & extraction** - Downloads and extracts the selected binary
- **Environment configuration** - Sets the appropriate `LEMONADE_LLAMACPP_*_BIN` environment variable
- **Direct server launch** - Launches lemonade-server with your chosen configuration

## Installation

```bash
npm install
```

## Usage

### Interactive Mode (Recommended)

Run the CLI tool to interactively select a release, download the binary, and launch the server:

```bash
npm start
# or
node index.js
```

The tool will:
1. Fetch available llama.cpp releases
2. Let you select a build version (e.g., `b8172`)
3. Choose the appropriate binary for your system (CPU, CUDA, ROCm, Vulkan, etc.)
4. Download and extract the archive
5. Configure environment variables
6. Launch lemonade-server

### Environment Variables

The tool sets one of the following environment variables based on your selected backend:

| Variable | Backend |
|----------|---------|
| `LEMONADE_LLAMACPP_CPU_BIN` | CPU backend |
| `LEMONADE_LLAMACPP_CUDA_BIN` | CUDA backend |
| `LEMONADE_LLAMACPP_ROCM_BIN` | ROCm backend |
| `LEMONADE_LLAMACPP_VULKAN_BIN` | Vulkan backend |
| `LEMONADE_LLAMACPP_SYCL_BIN` | SYCL backend |

### Custom Install Directory

Set the `LEMONADE_LLAMACPP_DIR` environment variable to customize where binaries are stored:

```bash
export LEMONADE_LLAMACPP_DIR=~/.custom-llamacpp
npm start
```

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