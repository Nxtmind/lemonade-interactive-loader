#!/usr/bin/env node

/**
 * Lemonade Config CLI - Manage Lemonade Server configuration
 *
 * This module provides a command-line interface for viewing and modifying
 * Lemonade Server configuration via the `lemonade config` command.
 */

const fs = require('fs');
const path = require('path');
const { getLemonadeConfigFile, getLemonadeCacheDir, loadConfig: loadLemonadeConfig, saveConfig: saveLemonadeConfig } = require('../config');

/**
 * Get the Lemonade config file path
 * @returns {string} Path to config.json
 */
function getConfigFile() {
  return getLemonadeConfigFile();
}

/**
 * Get the Lemonade cache directory
 * @returns {string} Path to cache directory
 */
function getCacheDir() {
  return getLemonadeCacheDir();
}

/**
 * Load the Lemonade Server configuration
 * @returns {Object} Configuration object
 */
function loadConfig() {
  return loadLemonadeConfig();
}

/**
 * Save the Lemonade Server configuration
 * @param {Object} config - Configuration object to save
 */
function saveConfig(config) {
  saveLemonadeConfig(config);
}

/**
 * View all current settings
 */
function viewConfig() {
  const config = loadConfig();
  const configFile = getConfigFile();

  if (Object.keys(config).length === 0) {
    console.log('No Lemonade Server configuration found.');
    console.log(`Config location: ${configFile}`);
    console.log('\nRun "lemonade config set" to create a configuration.');
    return;
  }

  console.log(`\nLemonade Server Configuration: ${configFile}\n`);
  console.log(JSON.stringify(config, null, 2));
  console.log('');
}

/**
 * Set one or more configuration values
 * @param {Array<string>} args - Array of key=value pairs
 */
function setConfig(args) {
  if (args.length === 0) {
    console.error('Error: No configuration values provided.');
    console.log('Usage: lemonade config set key=value [key=value ...]');
    process.exit(1);
  }

  const config = loadConfig();
  let hasChanges = false;

  for (const arg of args) {
    const parts = arg.split('=');
    if (parts.length !== 2) {
      console.error(`Error: Invalid format "${arg}". Use key=value.`);
      process.exit(1);
    }

    const key = parts[0];
    let value = parts[1];

    // Parse value types
    if (value === 'true') {
      value = true;
    } else if (value === 'false') {
      value = false;
    } else if (!isNaN(value) && value !== '') {
      value = Number(value);
    }

    // Handle dot notation for nested properties
    const keys = key.split('.');
    let current = config;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    const lastKey = keys[keys.length - 1];
    const oldValue = current[lastKey];
    current[lastKey] = value;

    console.log(`Set ${key}="${value}" (was: "${oldValue !== undefined ? oldValue : 'undefined'}")`);
    hasChanges = true;
  }

  if (hasChanges) {
    saveConfig(config);
    console.log('\nConfiguration saved successfully.');
  } else {
    console.log('\nNo changes made.');
  }
}

/**
 * Handle CLI arguments
 */
function handleArgs(args) {
  if (args.length === 0) {
    // Default: view config
    viewConfig();
    return;
  }

  const command = args[0];

  switch (command) {
    case 'set':
    case 'config set':
      setConfig(args.slice(1));
      break;

    case 'get':
    case 'config get':
      // TODO: Implement get command for single values
      console.log('Get command not yet implemented.');
      break;

    case 'view':
    case 'config view':
    default:
      viewConfig();
      break;
  }
}

/**
 * Main entry point
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Default: view config
    viewConfig();
    return;
  }

  handleArgs(args);
}

module.exports = {
  getConfigFile,
  getCacheDir,
  loadConfig,
  saveConfig,
  viewConfig,
  setConfig,
  handleArgs,
  main
};

// Run if executed directly
if (require.main === module) {
  main();
}
