# Lemonade Launcher - Source Code Structure

> **Note:** For comprehensive technical documentation, API references, and development guides, please see the main [TECHNICAL_README.md](../TECHNICAL_README.md) in the project root.

This directory contains the modular source code for the Lemonade Launcher CLI tool.

## Directory Structure

```
src/
├── index.js              # Main entry point and module exports
├── config/               # Configuration management
│   ├── index.js          # Config load/save/reset functions
│   └── constants.js      # Application constants and defaults
├── services/             # Business logic services
│   ├── github.js         # GitHub API interactions
│   ├── download.js       # File download and extraction
│   ├── asset-manager.js  # Installed asset management
│   └── server.js         # Server launch and management
├── utils/                # Utility functions
│   └── system.js         # System detection and formatting
└── cli/                  # Command-line interface
    ├── menu.js           # Main menu and command handling
    ├── prompts.js        # Interactive prompts and selections
    └── setup-wizard.js   # Configuration setup wizard
```

## Module Overview

### Config (`config/`)
- **constants.js**: Centralized configuration for paths, defaults, and constants
- **index.js**: Configuration persistence (load, save, reset)

### Services (`services/`)
- **github.js**: Fetch releases from llama.cpp GitHub repository
- **download.js**: Download files and extract archives (zip/tar.gz)
- **asset-manager.js**: Manage installed llama.cpp builds
- **server.js**: Launch lemonade-server with configuration

### Utils (`utils/`)
- **system.js**: System detection, byte formatting, asset categorization

### CLI (`cli/`)
- **menu.js**: Main menu system and command routing
- **prompts.js**: Interactive prompts for release/asset selection
- **setup-wizard.js**: 8-question setup wizard

## Architecture Principles

1. **Separation of Concerns**: Each module has a single responsibility
2. **Dependency Injection**: Modules depend on abstractions, not concretions
3. **Cross-Platform**: All code works on Windows, Linux, and macOS
4. **Error Handling**: Proper error handling with informative messages
5. **Modularity**: Easy to test, maintain, and extend

## Usage

### As CLI Tool
```bash
node index.js
```

### As Module
```javascript
const { 
  loadConfig, 
  fetchAllReleases, 
  downloadAndExtractLlamaCpp,
  launchLemonadeServer 
} = require('./src/index');

// Use exported functions programmatically
```

## Adding New Features

1. Create new module in appropriate directory
2. Export functions from `src/index.js`
3. Update documentation
4. Add tests (when test framework is added)

## Code Style

- Use ES6+ syntax
- Async/await for asynchronous operations
- JSDoc comments for public APIs
- Consistent error handling patterns
- Modular and reusable code