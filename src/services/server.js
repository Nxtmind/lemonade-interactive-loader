const fs = require('fs');
const { execSync } = require('child_process');
const { LEMONADE_SERVER_DEFAULT_PATH } = require('../config/constants');
const { findLlamaServer } = require('../utils/system');
const { getLlamaServerPath } = require('./asset-manager');

/**
 * Build server command arguments
 * @param {Object} config - Server configuration
 * @returns {Array} Array of command arguments
 */
function buildServerArgs(config) {
  const { host, port, logLevel, modelDir, llamacppArgs } = config;
  const args = [
    'serve',
    '--log-level', logLevel || 'info',
    '--host', host,
    '--port', port.toString()
  ];
  
  if (modelDir && modelDir !== 'None') {
    args.push('--extra-models-dir', modelDir);
  }
  
  if (llamacppArgs) {
    args.push('--llamacpp-args', llamacppArgs);
  }
  
  return args;
}

/**
 * Format command for cross-platform display
 * @param {string} serverPath - Path to server binary
 * @param {Array} args - Command arguments
 * @param {Object} envVars - Environment variables
 * @returns {string} Formatted command string
 */
function formatCommand(serverPath, args, envVars = {}) {
  const isWindows = process.platform === 'win32';
  
  if (isWindows) {
    let cmd = '';
    for (const [key, value] of Object.entries(envVars)) {
      if (value) {
        cmd += `set ${key}="${value}" && `;
      }
    }
    
    const quotedPath = serverPath.includes(' ') ? `"${serverPath}"` : serverPath;
    const quotedArgs = args.map(arg => arg.includes(' ') ? `"${arg}"` : arg);
    
    return cmd + quotedPath + ' ' + quotedArgs.join(' ');
  } else {
    let cmd = '';
    for (const [key, value] of Object.entries(envVars)) {
      if (value) {
        cmd += `${key}="${value}" `;
      }
    }
    
    const quotedArgs = args.map(arg => arg.includes(' ') ? `"${arg}"` : arg);
    return cmd + serverPath + ' ' + quotedArgs.join(' ');
  }
}

/**
 * Launch lemonade-server with the specified configuration
 * @param {Object} config - Server configuration
 */
async function launchLemonadeServer(config) {
  const { 
    host, 
    port, 
    logLevel, 
    modelDir, 
    llamacppArgs,
    runMode,
    customLlamacppPath,
    customBackendType,
    customServerPath,
    backend
  } = config;
  
  console.log('\n=== Launching Lemonade Server ===\n');
  console.log(`Host: ${host}`);
  console.log(`Port: ${port}`);
  console.log(`Log Level: ${logLevel}`);
  console.log(`Backend: ${backend || 'auto'}`);
  console.log(`Model Directory: ${modelDir || 'default'}`);
  console.log(`Run Mode: ${runMode || 'headless'}`);
  if (llamacppArgs) {
    console.log(`llama.cpp Args: ${llamacppArgs}`);
  }
  if (customLlamacppPath) {
    console.log(`Custom llama.cpp: ${customLlamacppPath}`);
  }
  console.log('');
  
  const serverPath = LEMONADE_SERVER_DEFAULT_PATH;
  const args = buildServerArgs(config);
  
  let backendTypeToUse = customBackendType;
  if (!backendTypeToUse && backend && backend !== 'auto') {
    backendTypeToUse = backend;
  }
  
  let serverBinary = customServerPath;
  if (!serverBinary && customLlamacppPath) {
    serverBinary = findLlamaServer(customLlamacppPath);
  }
  
  const envVars = {};
  if (backendTypeToUse && backendTypeToUse !== 'auto' && serverBinary) {
    const backendEnvVar = `LEMONADE_LLAMACPP_${backendTypeToUse.toUpperCase()}_BIN`;
    envVars[backendEnvVar] = serverBinary;
  }
  
  if (!fs.existsSync(serverPath)) {
    console.error(`\n❌ Error: lemonade-server not found at ${serverPath}`);
    console.log('\n📋 Expected Location:');
    console.log(`   ${serverPath}`);
    console.log('\n📥 How to Install Lemonade Server:');
    console.log('   Visit: https://lemonade-server.ai');
    
    const command = formatCommand(serverPath, args, envVars);
    console.log('\n🔧 Once installed, this is the command that will be run:');
    console.log(`   ${command}`);
    
    if (Object.keys(envVars).length > 0) {
      console.log('\n💡 Environment Variable Set:');
      for (const [key, value] of Object.entries(envVars)) {
        console.log(`   ${key}=${value}`);
      }
    }
    
    console.log('\n💡 After installing lemonade-server, run this tool again to start the server.');
    console.log('');
    return;
  }
  
  for (const [key, value] of Object.entries(envVars)) {
    process.env[key] = value;
    console.log(`Set ${key}=${value}`);
  }
  
  if (Object.keys(envVars).length === 0) {
    console.log('Using default backend configuration');
  }
  
  console.log(`\nCommand: ${serverPath} ${args.join(' ')}`);
  console.log('\nStarting server...\n');
  
  try {
    const command = formatCommand(serverPath, args, {});
    execSync(command, {
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

module.exports = {
  buildServerArgs,
  formatCommand,
  launchLemonadeServer
};