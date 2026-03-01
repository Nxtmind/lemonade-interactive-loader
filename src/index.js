#!/usr/bin/env node

/**
 * Lemonade Launcher - Interactive CLI for managing llama.cpp builds and Lemonade Server
 * 
 * A professional, modular CLI tool for downloading llama.cpp releases and launching
 * Lemonade Server with a user-friendly setup wizard.
 */

const { runCLI } = require('./cli/menu');

/**
 * Main entry point
 */
async function main() {
  try {
    await runCLI();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Export modules for programmatic use
module.exports = {
  // Config
  loadConfig: require('./config').loadConfig,
  saveConfig: require('./config').saveConfig,
  resetConfig: require('./config').resetConfig,
  
  // Services
  fetchAllReleases: require('./services/github').fetchAllReleases,
  fetchLatestRelease: require('./services/github').fetchLatestRelease,
  downloadFile: require('./services/download').downloadFile,
  extractArchive: require('./services/download').extractArchive,
  getAllInstalledAssets: require('./services/asset-manager').getAllInstalledAssets,
  downloadAndExtractLlamaCpp: require('./services/asset-manager').downloadAndExtractLlamaCpp,
  deleteInstalledAsset: require('./services/asset-manager').deleteInstalledAsset,
  launchLemonadeServer: require('./services/server').launchLemonadeServer,
  
  // Utils
  detectSystem: require('./utils/system').detectSystem,
  formatBytes: require('./utils/system').formatBytes,
  inferBackendType: require('./utils/system').inferBackendType,
  categorizeAsset: require('./utils/system').categorizeAsset,
  getAssetType: require('./utils/system').getAssetType,
  filterServerAssets: require('./utils/system').filterServerAssets,
  findLlamaServer: require('./utils/system').findLlamaServer,
  
  // CLI
  runSetupWizard: require('./cli/setup-wizard').runSetupWizard,
  runCLI: require('./cli/menu').runCLI
};

// Run if executed directly
if (require.main === module) {
  main();
}