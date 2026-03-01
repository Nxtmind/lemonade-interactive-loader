const fs = require('fs');
const path = require('path');
const { DEFAULT_LLAMACPP_INSTALL_DIR } = require('../config/constants');
const { inferBackendType, findLlamaServer } = require('../utils/system');
const { downloadFile, extractArchive } = require('./download');

/**
 * Check if a specific asset is already installed
 * @param {string} version - Release version
 * @param {string} assetName - Asset filename
 * @returns {boolean}
 */
function isAssetInstalled(version, assetName) {
  const installDir = path.join(
    DEFAULT_LLAMACPP_INSTALL_DIR, 
    version, 
    assetName.replace('.tar.gz', '').replace('.zip', '')
  );
  const markerFile = path.join(installDir, `.installed-${assetName}`);
  return fs.existsSync(markerFile);
}

/**
 * Mark an asset as installed
 * @param {string} version - Release version
 * @param {string} assetName - Asset filename
 */
function markAssetAsInstalled(version, assetName) {
  const archiveBaseName = assetName.endsWith('.tar.gz') 
    ? assetName.replace('.tar.gz', '')
    : assetName.replace('.zip', '');
  
  const installDir = path.join(DEFAULT_LLAMACPP_INSTALL_DIR, version, archiveBaseName);
  const markerFile = path.join(installDir, `.installed-${assetName}`);
  fs.writeFileSync(markerFile, new Date().toISOString(), 'utf-8');
}

/**
 * Get all installed assets sorted by install time (newest first)
 * @returns {Array} Array of installed asset info
 */
function getAllInstalledAssets() {
  const installedAssets = [];
  
  if (!fs.existsSync(DEFAULT_LLAMACPP_INSTALL_DIR)) {
    return installedAssets;
  }
  
  const versions = fs.readdirSync(DEFAULT_LLAMACPP_INSTALL_DIR);
  
  for (const version of versions) {
    const versionPath = path.join(DEFAULT_LLAMACPP_INSTALL_DIR, version);
    
    if (!fs.statSync(versionPath).isDirectory()) continue;
    
    const assetDirs = fs.readdirSync(versionPath);
    
    for (const assetDir of assetDirs) {
      const assetPath = path.join(versionPath, assetDir);
      
      if (!fs.statSync(assetPath).isDirectory()) continue;
      
      const entries = fs.readdirSync(assetPath);
      const markerFiles = entries.filter(e => e.startsWith('.installed-'));
      
      for (const markerFile of markerFiles) {
        const assetName = markerFile.replace('.installed-', '');
        const installTime = fs.readFileSync(path.join(assetPath, markerFile), 'utf-8');
        const backendType = inferBackendType(assetName);
        
        installedAssets.push({
          version,
          assetName,
          installPath: assetPath,
          installTime,
          backendType
        });
      }
    }
  }
  
  installedAssets.sort((a, b) => new Date(b.installTime) - new Date(a.installTime));
  
  return installedAssets;
}

/**
 * Get the llama-server binary path for an installed asset
 * @param {string} installPath - Installation directory path
 * @returns {string|null} Path to llama-server
 */
function getLlamaServerPath(installPath) {
  return findLlamaServer(installPath);
}

/**
 * Download and extract llama.cpp build to user directory
 * @param {Object} asset - Asset object from GitHub API
 * @param {string} version - Release version
 * @returns {Promise<string>} Installation directory path
 */
async function downloadAndExtractLlamaCpp(asset, version) {
  const archiveName = asset.name;
  const archiveBaseName = archiveName.endsWith('.tar.gz') 
    ? archiveName.replace('.tar.gz', '')
    : archiveName.replace('.zip', '');
  
  const installDir = path.join(DEFAULT_LLAMACPP_INSTALL_DIR, version, archiveBaseName);
  
  if (isAssetInstalled(version, asset.name)) {
    console.log(`\n✓ ${asset.name} is already installed at ${installDir}`);
    return installDir;
  }
  
  if (!fs.existsSync(installDir)) {
    fs.mkdirSync(installDir, { recursive: true });
  }
  
  const archivePath = path.join(installDir, archiveName);
  
  console.log(`\nDownloading ${archiveName}...`);
  await downloadFile(asset.browser_download_url, archivePath);
  
  console.log(`Extracting to ${installDir}...`);
  await extractArchive(archivePath, installDir);
  
  if (fs.existsSync(archivePath)) {
    fs.unlinkSync(archivePath);
  }
  
  markAssetAsInstalled(version, asset.name);
  
  console.log(`✓ ${asset.name} installed to ${installDir}`);
  return installDir;
}

/**
 * Delete an installed asset
 * @param {string} installPath - Installation directory path
 * @returns {boolean} Success status
 */
function deleteInstalledAsset(installPath) {
  try {
    fs.rmSync(installPath, { recursive: true, force: true });
    return true;
  } catch (error) {
    console.error(`Error deleting asset: ${error.message}`);
    return false;
  }
}

module.exports = {
  isAssetInstalled,
  markAssetAsInstalled,
  getAllInstalledAssets,
  getLlamaServerPath,
  downloadAndExtractLlamaCpp,
  deleteInstalledAsset
};