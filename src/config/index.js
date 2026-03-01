const fs = require('fs');
const { USER_CONFIG_DIR, USER_CONFIG_FILE } = require('./constants');

/**
 * Load user configuration from file
 * @returns {Object} Configuration object or empty object if not found
 */
function loadConfig() {
  if (!fs.existsSync(USER_CONFIG_FILE)) {
    return {};
  }

  try {
    const configData = fs.readFileSync(USER_CONFIG_FILE, 'utf-8');
    return JSON.parse(configData);
  } catch (error) {
    console.warn(`Warning: Could not load config file: ${error.message}`);
    return {};
  }
}

/**
 * Save user configuration to file
 * @param {Object} config - Configuration object to save
 */
function saveConfig(config) {
  if (!fs.existsSync(USER_CONFIG_DIR)) {
    fs.mkdirSync(USER_CONFIG_DIR, { recursive: true });
  }

  fs.writeFileSync(USER_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  console.log(`\n✓ Configuration saved to ${USER_CONFIG_FILE}`);
}

/**
 * Reset configuration to defaults
 */
function resetConfig() {
  if (fs.existsSync(USER_CONFIG_FILE)) {
    fs.unlinkSync(USER_CONFIG_FILE);
    console.log('Configuration reset successfully.');
  }
}

module.exports = {
  loadConfig,
  saveConfig,
  resetConfig
};