const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const tar = require('tar');
const AdmZip = require('adm-zip');
const { getAssetType } = require('../utils/system');

/**
 * Download a file from URL
 * @param {string} url - Download URL
 * @param {string} outputPath - Local output path
 * @returns {Promise<void>}
 */
function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    console.log(`Downloading: ${path.basename(outputPath)}`);
    
    const file = fs.createWriteStream(outputPath);
    
    const req = protocol.get(url, { headers: { 'User-Agent': 'lemonade-launcher' } }, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
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
 * @param {string} archivePath - Path to archive file
 * @param {string} extractDir - Directory to extract to
 * @returns {Promise<void>}
 */
async function extractArchive(archivePath, extractDir) {
  return new Promise((resolve, reject) => {
    const assetType = getAssetType(archivePath);
    
    console.log('Extracting archive...');
    
    if (assetType === 'tar') {
      tar.x({
        file: archivePath,
        cwd: extractDir,
        strip: 1
      }).then(() => {
        resolve();
      }).catch(reject);
    } else if (assetType === 'zip') {
      const zip = new AdmZip(archivePath);
      zip.extractAllTo(extractDir, true);
      resolve();
    } else {
      reject(new Error(`Unsupported archive type: ${assetType}`));
    }
  });
}

module.exports = {
  downloadFile,
  extractArchive
};