const https = require('https');
const http = require('http');
const { GITHUB_RELEASES_URL, GITHUB_API_HEADERS } = require('../config/constants');

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
      headers: GITHUB_API_HEADERS
    };

    const protocol = https;
    const req = protocol.request(options, (res) => {
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
  const releases = await fetchAllReleases(1);
  
  if (releases.length === 0) {
    throw new Error('No releases found');
  }
  
  return releases[0];
}

module.exports = {
  fetchAllReleases,
  fetchLatestRelease
};