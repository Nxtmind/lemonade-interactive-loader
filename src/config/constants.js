const path = require('path');
const os = require('os');

// Configuration directories
const USER_CONFIG_DIR = path.join(os.homedir(), '.lemonade-interactive-launcher');
const USER_CONFIG_FILE = path.join(USER_CONFIG_DIR, 'config.json');
const DEFAULT_LLAMACPP_INSTALL_DIR = path.join(os.homedir(), '.lemonade-interactive-launcher', 'llama-cpp');

// GitHub API
const GITHUB_RELEASES_URL = 'https://api.github.com/repos/ggml-org/llama.cpp/releases';
const GITHUB_API_HEADERS = {
  'User-Agent': 'lemonade-interactive-launcher',
  'Accept': 'application/vnd.github.v3+json'
};

// Default lemonade-server paths by platform
function getLemonadeServerDefaultPath() {
  if (process.platform === 'win32') {
    return path.join(os.homedir(), 'AppData', 'Local', 'lemonade_server', 'bin', 'lemonade-server.exe');
  } else if (process.platform === 'darwin') {
    return '/opt/homebrew/bin/lemonade-server';
  } else {
    return '/usr/local/bin/lemonade-server';
  }
}

const LEMONADE_SERVER_DEFAULT_PATH = getLemonadeServerDefaultPath();

// Supported backends
const BACKEND_TYPES = {
  AUTO: 'auto',
  CPU: 'cpu',
  CUDA: 'cuda',
  ROCM: 'rocm',
  VULKAN: 'vulkan',
  SYCL: 'sycl',
  OPENCL: 'opencl'
};

// Logging levels
const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error'
};

// Run modes
const RUN_MODES = {
  HEADLESS: 'headless',
  SYSTEM_TRAY: 'system-tray'
};

// Network configuration
const HOSTS = {
  LOCALHOST: '127.0.0.1',
  ALL_INTERFACES: '0.0.0.0'
};

// Context window sizes (in tokens)
const CONTEXT_SIZES = {
  '4K': 4096,
  '8K': 8192,
  '16K': 16384,
  '32K': 32768,
  '64K': 65536,
  '128K': 131072,
  '256K': 262144
};

// Default values
const DEFAULTS = {
  PORT: 8080,
  LOG_LEVEL: LOG_LEVELS.INFO,
  HOST: HOSTS.LOCALHOST,
  EXPOSE_TO_NETWORK: false,
  RUN_MODE: RUN_MODES.SYSTEM_TRAY,
  MODEL_DIR: 'None',
  BACKEND: BACKEND_TYPES.AUTO,
  CONTEXT_SIZE: CONTEXT_SIZES['4K']
};

module.exports = {
  USER_CONFIG_DIR,
  USER_CONFIG_FILE,
  DEFAULT_LLAMACPP_INSTALL_DIR,
  GITHUB_RELEASES_URL,
  GITHUB_API_HEADERS,
  LEMONADE_SERVER_DEFAULT_PATH,
  BACKEND_TYPES,
  LOG_LEVELS,
  RUN_MODES,
  HOSTS,
  CONTEXT_SIZES,
  DEFAULTS
};