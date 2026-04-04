const fs = require('fs');
const { LEMONADE_CACHE_DIR, LEMONADE_CONFIG_FILE } = require('./constants');

/**
 * Get the Lemonade Server config directory
 * @returns {string} Path to Lemonade cache directory
 */
function getLemonadeCacheDir() {
  return LEMONADE_CACHE_DIR;
}

/**
 * Get the Lemonade Server config file path
 * @returns {string} Path to config.json
 */
function getLemonadeConfigFile() {
  return LEMONADE_CONFIG_FILE;
}

/**
 * Load Lemonade Server configuration from config.json
 * @returns {Object} Configuration object or empty object if not found
 */
function loadConfig() {
  if (!fs.existsSync(LEMONADE_CONFIG_FILE)) {
    return {};
  }

  try {
    const configData = fs.readFileSync(LEMONADE_CONFIG_FILE, 'utf-8');
    return JSON.parse(configData);
  } catch (error) {
    console.warn(`Warning: Could not load Lemonade config file: ${error.message}`);
    return {};
  }
}

/**
 * Save Lemonade Server configuration to config.json
 * @param {Object} config - Configuration object to save
 */
function saveConfig(config) {
  if (!fs.existsSync(LEMONADE_CACHE_DIR)) {
    fs.mkdirSync(LEMONADE_CACHE_DIR, { recursive: true });
  }

  fs.writeFileSync(LEMONADE_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  console.log(`\n✓ Lemonade Server configuration saved to ${LEMONADE_CONFIG_FILE}`);
}

/**
 * Reset configuration to defaults
 */
function resetConfig() {
  if (fs.existsSync(LEMONADE_CONFIG_FILE)) {
    fs.unlinkSync(LEMONADE_CONFIG_FILE);
    console.log('Configuration reset successfully.');
  }
}

module.exports = {
  loadConfig,
  saveConfig,
  resetConfig,
  getLemonadeCacheDir,
  getLemonadeConfigFile
};
