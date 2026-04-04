const path = require('path');
const os = require('os');

// Configuration directories
// New Lemonade Server uses .cache/lemonade/config.json
function getLemonadeCacheDir() {
  if (process.platform === 'win32') {
    return path.join(os.homedir(), '.cache', 'lemonade');
  } else if (process.platform === 'darwin') {
    return '/Library/Application Support/lemonade/.cache';
  } else {
    // Linux (systemd) - use standard XDG cache dir
    const xdgCache = process.env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache');
    return path.join(xdgCache, 'lemonade');
  }
}

const LEMONADE_CACHE_DIR = getLemonadeCacheDir();
const LEMONADE_CONFIG_FILE = path.join(LEMONADE_CACHE_DIR, 'config.json');

// Legacy config location for migration
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
  PORT: 13305,  // Changed from 8080 to match Lemonade Server default
  LOG_LEVEL: LOG_LEVELS.INFO,
  HOST: HOSTS.LOCALHOST,
  EXPOSE_TO_NETWORK: false,
  RUN_MODE: RUN_MODES.HEADLESS,  // Lemonade Server runs as a service
  MODEL_DIR: 'None',
  BACKEND: BACKEND_TYPES.AUTO,
  CONTEXT_SIZE: CONTEXT_SIZES['4K'],

  // New Lemonade Server config fields
  GLOBAL_TIMEOUT: 300,
  MAX_LOADED_MODELS: 1,
  NO_BROADCAST: false,
  EXTRA_MODELS_DIR: '',
  MODELS_DIR: 'auto',
  OFFLINE: false,
  DISABLE_MODEL_FILTERING: false,
  ENABLE_DGPU_GTT: false,

  // Backend-specific defaults
  LLAMACPP_BACKEND: 'auto',
  LLAMACPP_ARGS: '',
  LLAMACPP_PREFER_SYSTEM: false,
  LLAMACPP_ROCM_BIN: 'builtin',
  LLAMACPP_VULKAN_BIN: 'builtin',
  LLAMACPP_CPU_BIN: 'builtin',

  WHISPERCPP_BACKEND: 'auto',
  WHISPERCPP_ARGS: '',
  WHISPERCPP_CPU_BIN: 'builtin',
  WHISPERCPP_NPU_BIN: 'builtin',

  SDCPP_BACKEND: 'auto',
  SDCPP_ARGS: '',
  SDCPP_STEPS: 20,
  SDCPP_CFG_SCALE: 7.0,
  SDCPP_WIDTH: 512,
  SDCPP_HEIGHT: 512,
  SDCPP_CPU_BIN: 'builtin',
  SDCPP_ROCM_BIN: 'builtin',
  SDCPP_VULKAN_BIN: 'builtin',

  FLM_ARGS: '',

  RYZENAI_SERVER_BIN: 'builtin',

  KOKORO_CPU_BIN: 'builtin'
};

module.exports = {
  USER_CONFIG_DIR,
  USER_CONFIG_FILE,
  LEMONADE_CACHE_DIR,
  LEMONADE_CONFIG_FILE,
  getLemonadeCacheDir,
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