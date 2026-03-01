const os = require('os');
const path = require('path');
const fs = require('fs');

/**
 * Detect user's system for suggested asset
 * @returns {Object} System information
 */
function detectSystem() {
  const platform = process.platform;
  const arch = process.arch;
  
  let osType = 'unknown';
  let archType = arch;
  
  if (platform === 'win32') {
    osType = 'windows';
    if (arch === 'x64') archType = 'x64';
    else if (arch === 'arm64') archType = 'arm64';
    else if (arch === 'ia32') archType = 'x86';
  } else if (platform === 'darwin') {
    osType = 'macos';
    if (arch === 'arm64') archType = 'arm64';
    else if (arch === 'x64') archType = 'x64';
  } else if (platform === 'linux') {
    osType = 'linux';
    if (arch === 'x64') archType = 'x64';
    else if (arch === 'arm64') archType = 'arm64';
    else if (arch === 'arm') archType = 'armv7l';
  }
  
  return { platform, arch: archType, osType };
}

/**
 * Format bytes to human readable string
 * @param {number} bytes - Bytes to format
 * @returns {string} Formatted byte string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Infer backend type from asset name
 * @param {string} assetName - Asset filename
 * @returns {string} Backend type
 */
function inferBackendType(assetName) {
  const name = assetName.toLowerCase();
  
  if (name.includes('rocm') || name.includes('hip')) return 'rocm';
  if (name.includes('vulkan')) return 'vulkan';
  if (name.includes('cuda')) return 'cuda';
  if (name.includes('sycl')) return 'sycl';
  if (name.includes('opencl')) return 'opencl';
  if (name.includes('cpu')) return 'cpu';
  
  return 'cpu';
}

/**
 * Categorize asset based on its name
 * @param {string} assetName - Asset filename
 * @returns {string} Category
 */
function categorizeAsset(assetName) {
  const name = assetName.toLowerCase();
  
  if (name.includes('cuda')) return 'CUDA';
  if (name.includes('rocm') || name.includes('hip')) return 'ROCm';
  if (name.includes('vulkan')) return 'Vulkan';
  if (name.includes('sycl')) return 'SYCL';
  if (name.includes('opencl')) return 'OpenCL';
  if (name.includes('cpu')) return 'CPU';
  if (name.includes('macos') || name.includes('xcframework')) return 'macOS';
  if (name.includes('ubuntu') || name.includes('linux')) return 'Linux';
  if (name.includes('win') || name.includes('windows')) return 'Windows';
  
  return 'Other';
}

/**
 * Determine asset type (zip or tar.gz)
 * @param {string} assetName - Asset filename
 * @returns {string} 'zip', 'tar', or 'unknown'
 */
function getAssetType(assetName) {
  if (assetName.endsWith('.zip')) return 'zip';
  if (assetName.endsWith('.tar.gz')) return 'tar';
  return 'unknown';
}

/**
 * Filter assets for llama-server binaries only
 * @param {Array} assets - Array of asset objects
 * @returns {Array} Filtered assets
 */
function filterServerAssets(assets) {
  return assets.filter(asset => {
    const name = asset.name.toLowerCase();
    return name.includes('bin') && (name.endsWith('.zip') || name.endsWith('.tar.gz'));
  });
}

/**
 * Find the llama-server binary in extracted directory
 * @param {string} extractDir - Directory to search
 * @returns {string|null} Path to llama-server or null
 */
function findLlamaServer(extractDir) {
  const candidates = process.platform === 'win32' 
    ? ['llama-server.exe'] 
    : ['llama-server'];
  
  function searchDir(dir) {
    if (!fs.existsSync(dir)) return null;
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        const result = searchDir(fullPath);
        if (result) return result;
      } else if (entry.isFile() && candidates.includes(entry.name)) {
        return fullPath;
      }
    }
    
    return null;
  }
  
  return searchDir(extractDir);
}

module.exports = {
  detectSystem,
  formatBytes,
  inferBackendType,
  categorizeAsset,
  getAssetType,
  filterServerAssets,
  findLlamaServer
};