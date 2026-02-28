const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const inquirer = require('inquirer');
const tar = require('tar');
const { execSync } = require('child_process');

const GITHUB_RELEASES_URL = 'https://api.github.com/repos/ggml-org/llama.cpp/releases';

// Configuration
const DEFAULT_INSTALL_DIR = path.join(os.homedir(), '.lemonade-llamacpp');

/**
 * Get default lemonade-server path based on OS
 */
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

/**
 * Detect user's system for suggested asset
 */
function detectSystem() {
  const platform = process.platform;
  const arch = process.arch;
  
  let osType = 'unknown';
  let archType = arch;
  
  if (platform === 'win32') {
    osType = 'windows';
  } else if (platform === 'darwin') {
    osType = 'macos';
    if (arch === 'arm64') archType = 'arm64';
  } else if (platform === 'linux') {
    osType = 'linux';
  }
  
  return { platform, arch: archType, osType };
}

/**
 * Fetch all releases from llama.cpp GitHub repository
 * @param {number} limit - Maximum number of releases to fetch
 * @returns {Promise<Array>} Array of release data
 */
async function fetchAllReleases(limit = 20) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/ggml-org/llama.cpp/releases?per_page=${limit}`,
      method: 'GET',
      headers: {
        'User-Agent': 'lemonade-llama-loader',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      if (res.statusCode !== 200) {
        reject(new Error(`Request failed with status code ${res.statusCode}`));
        res.resume();
        return;
      }

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(new Error(`Request error: ${e.message}`));
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });

    req.end();
  });
}

/**
 * Fetch the latest release from llama.cpp GitHub repository
 * @returns {Promise<Object>} The latest release data
 */
async function fetchLatestRelease() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: '/repos/ggml-org/llama.cpp/releases?per_page=1',
      method: 'GET',
      headers: {
        'User-Agent': 'lemonade-llama-loader',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      if (res.statusCode !== 200) {
        reject(new Error(`Request failed with status code ${res.statusCode}`));
        res.resume();
        return;
      }

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const releases = JSON.parse(data);
          if (releases && releases.length > 0) {
            resolve(releases[0]);
          } else {
            reject(new Error('No releases found'));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(new Error(`Request error: ${e.message}`));
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });

    req.end();
  });
}

/**
 * Format bytes to human readable string
 * @param {number} bytes 
 * @returns {string}
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Categorize asset based on its name
 * @param {string} assetName 
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
  
  return 'Other';
}

/**
 * Filter assets for llama-server binaries only
 * @param {Array} assets 
 * @returns {Array} Filtered assets
 */
function filterServerAssets(assets) {
  return assets.filter(asset => {
    const name = asset.name.toLowerCase();
    // Include assets that contain 'bin' and are zip/tar.gz
    return name.includes('bin') && (name.endsWith('.zip') || name.endsWith('.tar.gz'));
  });
}

/**
 * Determine asset type (zip or tar.gz)
 * @param {string} assetName 
 * @returns {string} 'zip' or 'tar'
 */
function getAssetType(assetName) {
  if (assetName.endsWith('.zip')) return 'zip';
  if (assetName.endsWith('.tar.gz')) return 'tar';
  return 'unknown';
}

/**
 * Download a file from URL
 * @param {string} url 
 * @param {string} outputPath 
 * @returns {Promise<void>}
 */
function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    console.log(`Downloading: ${path.basename(outputPath)}`);
    
    const file = fs.createWriteStream(outputPath);
    
    const req = protocol.get(url, { headers: { 'User-Agent': 'lemonade-llama-loader' } }, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        // Follow redirect
        downloadFile(res.headers.location, outputPath)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      if (res.statusCode !== 200) {
        reject(new Error(`Download failed with status ${res.statusCode}`));
        return;
      }
      
      const totalSize = parseInt(res.headers['content-length'], 10) || 0;
      let downloadedSize = 0;
      
      res.on('data', (chunk) => {
        downloadedSize += chunk.length;
        if (totalSize > 0) {
          const percent = ((downloadedSize / totalSize) * 100).toFixed(1);
          process.stdout.write(`\rProgress: ${percent}%`);
        }
      });
      
      res.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log('\rDownload complete!         ');
        resolve();
      });
    });
    
    req.on('error', (e) => {
      fs.unlink(outputPath, () => {});
      reject(new Error(`Download error: ${e.message}`));
    });
    
    req.setTimeout(300000, () => {
      req.destroy();
      fs.unlink(outputPath, () => {});
      reject(new Error('Download timed out'));
    });
  });
}

/**
 * Extract downloaded archive
 * @param {string} archivePath 
 * @param {string} extractDir 
 * @returns {Promise<void>}
 */
async function extractArchive(archivePath, extractDir) {
  return new Promise((resolve, reject) => {
    const assetType = getAssetType(archivePath);
    
    console.log(`Extracting archive...`);
    
    if (assetType === 'tar') {
      tar.x({
        file: archivePath,
        cwd: extractDir,
        strip: 1
      }).then(() => {
        resolve();
      }).catch(reject);
    } else if (assetType === 'zip') {
      // Use unzip or yauzl for cross-platform zip extraction
      const unzip = require('unzipper');
      fs.createReadStream(archivePath)
        .pipe(unzip.Extract({ path: extractDir }))
        .on('close', () => resolve())
        .on('error', reject);
    } else {
      reject(new Error(`Unsupported archive type: ${assetType}`));
    }
  });
}

/**
 * Find the llama-server binary in extracted directory
 * @param {string} extractDir 
 * @param {string} assetType 
 * @returns {string|null} Path to llama-server
 */
function findLlamaServer(extractDir, assetType) {
  const candidates = [];
  
  if (process.platform === 'win32') {
    candidates.push('llama-server.exe');
  } else {
    candidates.push('llama-server');
  }
  
  // Search recursively
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

/**
 * Set environment variable
 * @param {string} key 
 * @param {string} value 
 */
function setEnvVariable(key, value) {
  process.env[key] = value;
  console.log(`Environment variable set: ${key}=${value}`);
}

/**
 * Launch lemonade-server with the specified binary
 * @param {Object} config 
 */
function launchLemonadeServer(config) {
  const { serverPath, modelDir, llamacppArgs, logLevel, host, port, ctxSize } = config;
  
  if (!fs.existsSync(serverPath)) {
    console.error(`Error: lemonade-server not found at ${serverPath}`);
    console.log('Please ensure lemonade-server is installed.');
    return;
  }
  
  console.log('\n=== Launching Lemonade Server ===\n');
  
  const args = [
    'serve',
    '--log-level', logLevel,
    '--ctx-size', ctxSize.toString(),
    '--host', host,
    '--port', port.toString(),
    '--extra-models-dir', modelDir
  ];
  
  if (llamacppArgs) {
    args.push('--llamacpp-args', llamacppArgs);
  }
  
  console.log(`Server path: ${serverPath}`);
  console.log(`Arguments: ${args.join(' ')}`);
  console.log('');
  
  try {
    const output = execSync(`${serverPath} ${args.join(' ')}`, {
      stdio: 'inherit',
      env: process.env
    });
  } catch (error) {
    console.error(`Server exited with error code: ${error.status}`);
    if (error.status !== null) {
      process.exit(error.status);
    }
  }
}

/**
 * Main interactive CLI workflow
 */
async function main() {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     🍋 Lemonade Llama Loader - Interactive CLI         ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
  
  const systemInfo = detectSystem();
  console.log(`Detected system: ${systemInfo.osType} (${systemInfo.arch})`);
  console.log('');
  
  // Fetch releases
  console.log('Fetching available releases...');
  let releases;
  try {
    releases = await fetchAllReleases(10);
    console.log(`Found ${releases.length} releases.\n`);
  } catch (error) {
    console.error(`Error fetching releases: ${error.message}`);
    process.exit(1);
  }
  
  // Select release
  const releaseChoices = releases.map(release => ({
    name: `${release.tag_name} - ${new Date(release.published_at).toLocaleDateString()}`,
    value: release
  }));
  
  const { selectedRelease } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedRelease',
      message: 'Select a release:',
      choices: releaseChoices
    }
  ]);
  
  console.log(`\nSelected: ${selectedRelease.tag_name}`);
  
  // Filter and categorize assets
  const serverAssets = filterServerAssets(selectedRelease.assets);
  
  // Group assets by category
  const categorized = {};
  serverAssets.forEach(asset => {
    const category = categorizeAsset(asset.name);
    if (!categorized[category]) {
      categorized[category] = [];
    }
    categorized[category].push(asset);
  });
  
  // Create choices with categories
  const assetChoices = [];
  for (const [category, assets] of Object.entries(categorized)) {
    assetChoices.push({
      name: `── ${category} ──`,
      disabled: true
    });
    assets.forEach(asset => {
      const suggested = (
        (systemInfo.osType === 'windows' && asset.name.includes('win')) ||
        (systemInfo.osType === 'linux' && asset.name.includes('ubuntu')) ||
        (systemInfo.osType === 'macos' && asset.name.includes('macos'))
      );
      const marker = suggested ? ' ← Best match' : '';
      assetChoices.push({
        name: `${asset.name} (${formatBytes(asset.size)})${marker}`,
        value: asset
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
  
  console.log(`\nSelected: ${selectedAsset.name}`);
  
  // Setup install directory
  const installDir = process.env.LEMONADE_LLAMACPP_DIR || DEFAULT_INSTALL_DIR;
  const releaseDir = path.join(installDir, selectedRelease.tag_name);
  const archivePath = path.join(releaseDir, `${selectedAsset.name}`);
  
  // Ensure directory exists
  if (!fs.existsSync(releaseDir)) {
    fs.mkdirSync(releaseDir, { recursive: true });
  }
  
  // Download
  console.log(`\nDownload destination: ${releaseDir}`);
  
  if (!fs.existsSync(archivePath)) {
    await downloadFile(selectedAsset.browser_download_url, archivePath);
  } else {
    console.log('Archive already exists, skipping download.');
  }
  
  // Extract
  const extractDir = releaseDir;
  await extractArchive(archivePath, extractDir);
  
  // Find llama-server
  const serverBinary = findLlamaServer(extractDir, getAssetType(selectedAsset.name));
  
  if (!serverBinary) {
    console.error('\nError: Could not find llama-server binary in extracted files.');
    console.log(`Extraction directory: ${extractDir}`);
    process.exit(1);
  }
  
  console.log(`\n✓ Found llama-server: ${serverBinary}`);
  
  // Determine environment variable based on asset type
  const category = categorizeAsset(selectedAsset.name);
  let envVarName = 'LEMONADE_LLAMACPP_CPU_BIN';
  let envVarDesc = 'CPU';
  
  if (category === 'ROCm' || category === 'SYCL') {
    envVarName = 'LEMONADE_LLAMACPP_ROCM_BIN';
    envVarDesc = 'ROCm';
  } else if (category === 'Vulkan' || category === 'OpenCL') {
    envVarName = 'LEMONADE_LLAMACPP_VULKAN_BIN';
    envVarDesc = 'Vulkan';
  } else if (category === 'CUDA') {
    envVarName = 'LEMONADE_LLAMACPP_CUDA_BIN';
    envVarDesc = 'CUDA';
  }
  
  console.log(`\nEnvironment variable: ${envVarName} (${envVarDesc} backend)`);
  
  // Configure launch settings
  const launchConfig = await inquirer.prompt([
    {
      type: 'input',
      name: 'serverPath',
      message: 'Path to lemonade-server:',
      default: LEMONADE_SERVER_DEFAULT_PATH,
      validate: (input) => {
        if (fs.existsSync(input)) return true;
        return 'File does not exist. Continue anyway?';
      }
    },
    {
      type: 'input',
      name: 'modelDir',
      message: 'Model directory:',
      default: path.join(os.homedir, '.lmstudio', 'models')
    },
    {
      type: 'input',
      name: 'port',
      message: 'Server port:',
      default: '8000',
      validate: (input) => !isNaN(input) && parseInt(input) > 0 && parseInt(input) < 65536 || 'Invalid port number'
    },
    {
      type: 'input',
      name: 'host',
      message: 'Host to bind:',
      default: '0.0.0.0'
    },
    {
      type: 'input',
      name: 'ctxSize',
      message: 'Context size:',
      default: '131072',
      validate: (input) => !isNaN(input) && parseInt(input) > 0 || 'Invalid context size'
    },
    {
      type: 'list',
      name: 'logLevel',
      message: 'Log level:',
      choices: ['debug', 'info', 'warn', 'error'],
      default: 'debug'
    },
    {
      type: 'input',
      name: 'llamacppArgs',
      message: 'Extra llama.cpp arguments (optional):',
      default: '--no-mmap'
    },
    {
      type: 'confirm',
      name: 'setEnv',
      message: 'Set environment variable for this session?',
      default: true
    },
    {
      type: 'confirm',
      name: 'launch',
      message: 'Launch lemonade-server now?',
      default: true
    }
  ]);
  
  // Set environment variable if requested
  if (launchConfig.setEnv) {
    setEnvVariable(envVarName, serverBinary);
  }
  
  // Launch server if requested
  if (launchConfig.launch) {
    launchLemonadeServer({
      serverPath: launchConfig.serverPath,
      modelDir: launchConfig.modelDir,
      llamacppArgs: launchConfig.llamacppArgs,
      logLevel: launchConfig.logLevel,
      host: launchConfig.host,
      port: parseInt(launchConfig.port),
      ctxSize: parseInt(launchConfig.ctxSize)
    });
  } else {
    console.log('\n=== Summary ===');
    console.log(`llama-server binary: ${serverBinary}`);
    console.log(`Environment variable: ${envVarName}=${serverBinary}`);
    console.log(`Install directory: ${releaseDir}`);
    console.log('\nTo launch manually:');
    console.log(`  export ${envVarName}="${serverBinary}"`);
    console.log(`  ${launchConfig.serverPath} serve --log-level ${launchConfig.logLevel} --ctx-size ${launchConfig.ctxSize} --host ${launchConfig.host} --port ${launchConfig.port} --extra-models-dir "${launchConfig.modelDir}" --llamacpp-args "${launchConfig.llamacppArgs}"`);
  }
}

// Export functions for module use
module.exports = { 
  fetchLatestRelease, 
  fetchAllReleases,
  downloadFile,
  extractArchive,
  findLlamaServer,
  categorizeAsset,
  filterServerAssets
};

// Run main if executed directly
if (require.main === module) {
  main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}