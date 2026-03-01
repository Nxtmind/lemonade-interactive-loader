const inquirer = require('inquirer');
const { loadConfig } = require('../config');
const { getAllInstalledAssets, getLlamaServerPath, downloadAndExtractLlamaCpp, deleteInstalledAsset } = require('../services/asset-manager');
const { selectLlamaCppRelease, selectAsset, askLaunchServer } = require('./prompts');
const { runSetupWizard } = require('./setup-wizard');
const { launchLemonadeServer } = require('../services/server');
const { inferBackendType, formatBytes } = require('../utils/system');

/**
 * Display and handle main menu selection
 * @returns {Promise<string>} Selected command
 */
async function showMainMenu() {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║            🍋 Lemonade Interactive Launcher            ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
  
  const { command } = await inquirer.prompt([
    {
      type: 'list',
      name: 'command',
      message: 'What would you like to do?',
      choices: [
        { name: '🚀 Setup - Configure Lemonade Server', value: 'setup' },
        { name: '🔄 Edit Configuration', value: 'edit' },
        { name: '👁️  View Configuration', value: 'view' },
        { name: '🔄 Reset Configuration', value: 'reset' },
        { name: '📦 Manage llama.cpp Build Only', value: 'manage' },
        { name: '🚀 Start Server with Current Config', value: 'serve' }
      ]
    }
  ]);
  
  return command;
}

/**
 * Display and handle manage submenu selection
 * @returns {Promise<string>} Selected action
 */
async function showManageMenu() {
  const { manageAction } = await inquirer.prompt([
    {
      type: 'list',
      name: 'manageAction',
      message: 'What would you like to do?',
      choices: [
        { name: '👁️  View installed builds', value: 'view' },
        { name: '🗑️  Delete installed build', value: 'delete' },
        { name: '⬇️  Download new build', value: 'download' },
        { name: '← Back to main menu', value: 'back' }
      ]
    }
  ]);
  
  return manageAction;
}

/**
 * View all installed builds
 */
async function viewInstalledBuilds() {
  const installedAssets = getAllInstalledAssets();
  
  if (installedAssets.length === 0) {
    console.log('\nNo custom llama.cpp builds installed.');
    return;
  }
  
  console.log('\n=== Installed Custom Builds ===\n');
  installedAssets.forEach((asset, index) => {
    const serverPath = getLlamaServerPath(asset.installPath);
    console.log(`${index + 1}. ${asset.assetName}`);
    console.log(`   Path: ${asset.installPath}`);
    console.log(`   Backend: ${asset.backendType.toUpperCase()}`);
    console.log(`   Installed: ${new Date(asset.installTime).toLocaleString()}`);
    console.log(`   Server Binary: ${serverPath || 'Not found'}`);
    console.log('');
  });
}

/**
 * Delete installed builds interactively
 */
async function deleteInstalledBuild() {
  let continueDeleting = true;
  
  while (continueDeleting) {
    const installedAssets = getAllInstalledAssets();
    
    if (installedAssets.length === 0) {
      console.log('\nNo custom llama.cpp builds installed.');
      break;
    }
    
    const choices = installedAssets.map((asset, index) => ({
      name: `${asset.assetName} | Backend: ${asset.backendType.toUpperCase()} | ${new Date(asset.installTime).toLocaleDateString()}`,
      value: index
    }));
    
    choices.unshift({
      name: '← Cancel',
      value: -1
    });
    
    const { deleteIndex } = await inquirer.prompt([
      {
        type: 'list',
        name: 'deleteIndex',
        message: 'Select a build to delete:',
        choices: choices
      }
    ]);
    
    if (deleteIndex < 0) {
      break;
    }
    
    const assetToDelete = installedAssets[deleteIndex];
    const { confirmDelete } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmDelete',
        message: `Are you sure you want to delete "${assetToDelete.assetName}"? This cannot be undone.`,
        default: false
      }
    ]);
    
    if (confirmDelete) {
      const success = deleteInstalledAsset(assetToDelete.installPath);
      if (success) {
        console.log(`✓ Deleted: ${assetToDelete.assetName}`);
      }
    }
    
    const { deleteAnother } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'deleteAnother',
        message: 'Do you want to delete another build?',
        default: false
      }
    ]);
    
    if (!deleteAnother) {
      continueDeleting = false;
    }
  }
}

/**
 * Download a new build interactively
 */
async function downloadNewBuild() {
  console.log('\nFetching recent llama.cpp builds...');
  const release = await selectLlamaCppRelease();
  const asset = await selectAsset(release);
  const version = release.tag_name;
  const installPath = await downloadAndExtractLlamaCpp(asset, version);
  
  console.log(`\n✓ Build ready at: ${installPath}`);
  console.log(`  Backend Type: ${inferBackendType(asset.name).toUpperCase()}`);
  
  const { downloadAnother } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'downloadAnother',
      message: 'Do you want to download another build?',
      default: false
    }
  ]);
  
  if (downloadAnother) {
    await downloadNewBuild();
  }
}

/**
 * View current configuration
 */
async function viewConfiguration() {
  const config = loadConfig();
  
  if (Object.keys(config).length === 0) {
    console.log('No configuration found. Run "setup" to configure.');
    return;
  }
  
  console.log('\n=== Current Configuration ===\n');
  console.log(`Host: ${config.host}`);
  console.log(`Port: ${config.port}`);
  console.log(`Log Level: ${config.logLevel}`);
  console.log(`Backend: ${config.backend}`);
  console.log(`Model Directory: ${config.modelDir}`);
  console.log(`Run Mode: ${config.runMode}`);
  console.log(`llama.cpp Args: ${config.llamacppArgs || 'None'}`);
  
  if (config.customLlamacppPath) {
    console.log(`Custom llama.cpp Build: ${config.customLlamacppPath}`);
    console.log(`  Backend Type: ${config.customBackendType?.toUpperCase() || 'Unknown'}`);
    console.log(`  Server Binary: ${config.customServerPath || 'Not found'}`);
  } else {
    console.log(`Custom llama.cpp Build: Using bundled build`);
  }
  
  const installedAssets = getAllInstalledAssets();
  if (installedAssets.length > 0) {
    console.log('\n=== All Installed Custom Builds ===\n');
    installedAssets.forEach((asset, index) => {
      const serverPath = getLlamaServerPath(asset.installPath);
      console.log(`${index + 1}. ${asset.assetName}`);
      console.log(`   Path: ${asset.installPath}`);
      console.log(`   Backend: ${asset.backendType.toUpperCase()}`);
      console.log(`   Installed: ${new Date(asset.installTime).toLocaleString()}`);
      console.log(`   Server Binary: ${serverPath || 'Not found'}`);
      console.log('');
    });
  }
}

/**
 * Reset configuration
 */
async function resetConfiguration() {
  const { confirmReset } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmReset',
      message: 'Are you sure you want to reset all configuration? This cannot be undone.',
      default: false
    }
  ]);
  
  if (confirmReset) {
    const { resetConfig } = require('../config');
    resetConfig();
  }
}

/**
 * Handle main menu command
 * @param {string} command - Selected command
 */
async function handleCommand(command) {
  switch (command) {
    case 'setup':
      await runSetupWizard(false);
      if (await askLaunchServer()) {
        const config = loadConfig();
        if (Object.keys(config).length > 0) {
          await launchLemonadeServer(config);
        }
      }
      break;
      
    case 'edit':
      await runSetupWizard(true);
      if (await askLaunchServer()) {
        const config = loadConfig();
        if (Object.keys(config).length > 0) {
          await launchLemonadeServer(config);
        }
      }
      break;
      
    case 'view':
      await viewConfiguration();
      break;
      
    case 'reset':
      await resetConfiguration();
      break;
      
    case 'manage':
      let manageAction;
      do {
        manageAction = await showManageMenu();
        
        switch (manageAction) {
          case 'view':
            await viewInstalledBuilds();
            break;
          case 'delete':
            await deleteInstalledBuild();
            break;
          case 'download':
            await downloadNewBuild();
            break;
        }
      } while (manageAction !== 'back');
      break;
      
    case 'serve':
      const config = loadConfig();
      if (Object.keys(config).length === 0) {
        console.log('No configuration found. Please run "setup" first.');
        return;
      }
      await launchLemonadeServer(config);
      break;
  }
}

/**
 * Run the main CLI loop
 */
async function runCLI() {
  let continueRunning = true;
  
  while (continueRunning) {
    const command = await showMainMenu();
    await handleCommand(command);
    
    const { continueRunning: shouldContinue } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continueRunning',
        message: 'Would you like to return to the main menu?',
        default: true
      }
    ]);
    
    continueRunning = shouldContinue;
  }
  
  console.log('\n👋 Goodbye!\n');
}

module.exports = {
  showMainMenu,
  showManageMenu,
  handleCommand,
  runCLI
};