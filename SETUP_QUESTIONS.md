# Lemonade Server Setup Questions

This document outlines the questions we will ask users to configure their Lemonade Server setup. The answers will be persisted and can be updated later.

## Setup Questions

**Q1: Do you want to expose the server to the local network?**
- Options:
  - `yes` - Server will listen on `0.0.0.0` (accessible from other devices on the network)
  - `no` - Server will listen on `127.0.0.1` (localhost only)
- Default: `no`
- Description: Determines whether the server should be accessible from other devices on your network.

**Q2: What port would you like the server to run on?**
- Input: Number
- Default: `8080`
- Description: The port number for the HTTP server. Must be a valid port (1-65535).

**Q3: What logging level do you want?**
- Options:
  - `info` (default)
  - `debug`
  - `warning`
  - `error`
- Description: Controls the verbosity of log output.

**Q4: Which llama.cpp backend to use?**
- Options:
  - `auto` (default) - Automatically select the best backend
  - `vulkan` - Vulkan GPU acceleration
  - `rocm` - AMD GPU acceleration
  - `cpu` - CPU-only inference
- Description: Select the hardware backend for model inference.

**Q5: Is there another model directory to use? (example: LM Studio)**
- Input: Text path (optional)
- Default: `None`
- Description: Path to an existing model directory. Users can point to models from LM Studio or other sources. Leave empty or select "None" to use default.

**Q6: Do you want a system tray or headless?**
- Options:
  - `system-tray` - Run with a system tray icon for easy control
  - `headless` (default) - Run as a background service without UI
- Description: Choose between running with a system tray interface or as a headless service.

**Q7: Are there any llama.cpp args you need to set?**
- Input: Text (comma-separated arguments)
- Default: Empty
- Description: Additional command-line arguments to pass to llama.cpp. Example: `--ctx-size 4096,--batch-size 512`

**Q8: Do you want to use a different build for llama cpp? (download from GitHub)?**
- Options:
  - `yes` - Download a specific build from GitHub
  - `no` (default) - Use the bundled build
- Description: Allow users to download and use a custom llama.cpp build from GitHub releases.
- Condition: If "yes", show a list of recent GitHub builds, let user select one, download it automatically, and unzip to user directory (`~/.lemonade/llama-cpp/`).

## Configuration Storage

Configuration will be stored at **user-level only**:
- **Location**: `~/.lemonade/config.json`
- **Purpose**: Persist user preferences across all projects and sessions

## Commands

The CLI will support the following commands:

1. **`lemonade setup`** - Interactive setup wizard
2. **`lemonade config`** - View current configuration
3. **`lemonade config:edit`** - Update configuration interactively
4. **`lemonade config:reset`** - Reset configuration to defaults
5. **`lemonade serve`** - Start server with current configuration

## Next Steps

Once we align on these questions, we will:
1. Update `index.js` to implement the interactive CLI
2. Add configuration persistence logic
3. Add commands for viewing and editing configuration
4. Integrate with the `lemonade serve` command