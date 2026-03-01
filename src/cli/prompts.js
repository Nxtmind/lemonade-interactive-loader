const inquirer = require('inquirer');
const { DEFAULTS, BACKEND_TYPES, LOG_LEVELS, RUN_MODES, HOSTS } = require('../config/constants');
const { loadConfig } = require('../config');
const { detectSystem, formatBytes, filterServerAssets, inferBackendType } = require('../utils/system');
const { fetchAllReleases } = require('../services/github');
const { getAllInstalledAssets, getLlamaServerPath, downloadAndExtractLlamaCpp, selectInstalledAsset, isAssetInstalled } = require('../services/asset-manager');

/**
 * Select a llama.cpp release from list
 * @returns {Promise<Object>} Selected release
 */
async function selectLlamaCppRelease() {
  console.log('\nFetching available releases...');
  
  let releases;
  try {
    releases = await fetchAllReleases(20);
    console.log(`Found ${releases.length} releases.\n`);
  } catch (error) {
    console.error(`Error fetching releases: ${error.message}`);
    process.exit(1);
  }
  
  const releaseChoices = releases.map(release => {
    const serverAssets = filterServerAssets(release.assets);
    const installedCount = serverAssets.filter(asset => 
      isAssetInstalled(release.tag_name, asset.name)
    ).length;
    
    const totalAssets = serverAssets.length;
    let status = '';
    if (installedCount === totalAssets && totalAssets > 0) {
      status = ' ✓ All assets installed';
    } else if (installedCount > 0) {
      status = ` (${installedCount}/${totalAssets} installed)`;
    }
    
    return {
      name: `${release.tag_name} - ${new Date(release.published_at).toLocaleDateString()}${status}`,
      value: release
    };
  });
  
  const { selectedRelease } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedRelease',
      message: 'Select a release:',
      choices: releaseChoices
    }
  ]);
  
  return selectedRelease;
}

/**
 * Select an asset from a release
 * @param {Object} release - Release object
 * @returns {Promise<Object>} Selected asset
 */
async function selectAsset(release) {
  const systemInfo = detectSystem();
  const serverAssets = filterServerAssets(release.assets);
  
  const byPlatform = {};
  serverAssets.forEach(asset => {
    let platform = 'Other';
    const name = asset.name.toLowerCase();
    
    if (name.includes('win') || name.includes('windows')) platform = 'Windows';
    else if (name.includes('ubuntu') || name.includes('linux')) platform = 'Linux';
    else if (name.includes('macos') || name.includes('mac')) platform = 'macOS';
    else if (name.includes('rocm')) platform = 'ROCm (Linux)';
    else if (name.includes('cuda')) platform = 'CUDA (Linux)';
    
    if (!byPlatform[platform]) {
      byPlatform[platform] = [];
    }
    byPlatform[platform].push(asset);
  });
  
  const assetChoices = [];
  for (const [platform, assets] of Object.entries(byPlatform)) {
    assetChoices.push({
      name: `── ${platform} ──`,
      disabled: true
    });
    
    assets.forEach(asset => {
      const name = asset.name.toLowerCase();
      let isCurrentPlatform = false;
      
      if (systemInfo.osType === 'windows' && platform === 'Windows') {
        if (systemInfo.arch === 'x64' && name.includes('x64')) isCurrentPlatform = true;
        else if (systemInfo.arch === 'arm64' && name.includes('arm64')) isCurrentPlatform = true;
        else if (!name.includes('x64') && !name.includes('arm64')) isCurrentPlatform = true;
      } else if (systemInfo.osType === 'linux' && platform === 'Linux') {
        if (systemInfo.arch === 'x64' && name.includes('x64')) isCurrentPlatform = true;
        else if (systemInfo.arch === 'arm64' && name.includes('aarch64')) isCurrentPlatform = true;
        else if (!name.includes('x64') && !name.includes('aarch64')) isCurrentPlatform = true;
      } else if (systemInfo.osType === 'macos' && platform === 'macOS') {
        if (systemInfo.arch === 'arm64' && (name.includes('arm64') || name.includes('aarch64'))) isCurrentPlatform = true;
        else if (systemInfo.arch === 'x64' && name.includes('x64')) isCurrentPlatform = true;
        else if (!name.includes('arm64') && !name.includes('x64')) isCurrentPlatform = true;
      } else if (systemInfo.osType === 'linux' && platform.includes('ROCm')) {
        if (systemInfo.arch === 'x64') isCurrentPlatform = true;
      } else if (systemInfo.osType === 'linux' && platform.includes('CUDA')) {
        if (systemInfo.arch === 'x64') isCurrentPlatform = true;
      }
      
      const version = release.tag_name;
      const isInstalled = isAssetInstalled(version, asset.name);
      
      let marker = '';
      if (isInstalled) {
        marker = ' ✓ Already installed';
      } else if (isCurrentPlatform) {
        marker = ' ← Best match';
      }
      
      assetChoices.push({
        name: `${asset.name} (${formatBytes(asset.size)})${marker}`,
        value: asset,
        disabled: false
      });
    });
  }
  
  const { selectedAsset } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedAsset',
      message: 'Select the asset to download:',
      choices: assetChoices
    }
  ]);
  
  return selectedAsset;
}

/**
 * Select from installed assets
 * @returns {Promise<Object|null>} Selected asset or null
 */
async function selectInstalledAssetPrompt() {
  const installedAssets = getAllInstalledAssets();
  
  if (installedAssets.length === 0) {
    console.log('\nNo custom llama.cpp builds installed.');
    return null;
  }
  
  const choices = installedAssets.map((asset, index) => {
    const installDate = new Date(asset.installTime).toLocaleString();
    const backendType = asset.backendType.toUpperCase();
    const serverPath = getLlamaServerPath(asset.installPath);
    const hasServer = serverPath ? '✓' : '✗';
    
    return {
      name: `[${index + 1}] ${asset.assetName} | Backend: ${backendType} | Installed: ${installDate} | Server: ${hasServer}`,
      value: asset
    };
  });
  
  choices.unshift({
    name: '── Skip - Use bundled build ──',
    value: null,
    disabled: false
  });
  
  const { selectedInstalled } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedInstalled',
      message: 'Select an installed custom build (or skip):',
      choices: choices
    }
  ]);
  
  if (selectedInstalled) {
    const serverPath = getLlamaServerPath(selectedInstalled.installPath);
    if (!serverPath) {
      console.log('\n⚠️  Warning: llama-server binary not found in this installation.');
      console.log('   If you selected "auto" backend, it may not use this binary.');
    } else {
      console.log(`\n✓ Selected: ${selectedInstalled.assetName}`);
      console.log(`  Backend Type: ${selectedInstalled.backendType.toUpperCase()}`);
      console.log(`  Server Binary: ${serverPath}`);
      
      return {
        ...selectedInstalled,
        serverPath
      };
    }
  }
  
  return null;
}

/**
 * Ask if user wants to launch the server
 * @returns {Promise<boolean>}
 */
async function askLaunchServer() {
  const { launchNow } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'launchNow',
      message: 'Would you like to launch the server now?',
      default: true
    }
  ]);
  
  return launchNow;
}

/**
 * Display configuration summary
 * @param {Object} config - Configuration object
 */
function displayConfigSummary(config) {
  console.log('\n=== Configuration Summary ===\n');
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
  console.log('');
}

module.exports = {
  selectLlamaCppRelease,
  selectAsset,
  selectInstalledAssetPrompt,
  askLaunchServer,
  displayConfigSummary
};