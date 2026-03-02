const fs = require('fs');
const { execSync, spawn } = require('child_process');
const kill = require('tree-kill');
const { LEMONADE_SERVER_DEFAULT_PATH } = require('../config/constants');
const { findLlamaServer } = require('../utils/system');
const { getLlamaServerPath } = require('./asset-manager');

// Track the server process for graceful shutdown
let serverProcess = null;
let isShuttingDown = false;
let hasExited = false;

/**
 * Build server command arguments
 * @param {Object} config - Server configuration
 * @returns {Array} Array of command arguments
 */
function buildServerArgs(config) {
  const { host, port, logLevel, modelDir, llamacppArgs, contextSize } = config;
  const args = [
    'serve',
    '--log-level', logLevel || 'info',
    '--host', host,
    '--port', port.toString()
  ];
  
  if (contextSize) {
    args.push('--ctx-size', contextSize.toString());
  }
  
  if (modelDir && modelDir !== 'None') {
    args.push('--extra-models-dir', modelDir);
  }
  
  if (llamacppArgs) {
    args.push('--llamacpp-args', `"${llamacppArgs}"`);
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
    contextSize,
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
  console.log(`Context Size: ${contextSize || 'default'}`);
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
    // Point to the actual binary, not the directory
    const binaryPath = findLlamaServer(customLlamacppPath || serverBinary);
    envVars[backendEnvVar] = binaryPath;
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
    // Build the command for spawning
    const commandStr = formatCommand(serverPath, args, {});
    
    // Parse the command into executable and arguments
    const parts = commandStr.trim().split(/\s+/);
    const executable = parts[0];
    const execArgs = parts.slice(1);
    
    console.log(`Spawning: ${executable} ${execArgs.join(' ')}`);
    
    // Spawn the server process
    serverProcess = spawn(executable, execArgs, {
      stdio: 'inherit',
      env: process.env
    });
    
    // Wait for the process to exit (blocking)
    await new Promise((resolve, reject) => {
      serverProcess.on('exit', (code, signal) => {
        // Only log if shutdown wasn't initiated by us
        if (!hasExited) {
          console.log(`\nServer exited with status ${code || 'None'} and signal ${signal || 'None'}`);
        }
        serverProcess = null;
        resolve(code);
      });
      
      serverProcess.on('error', (err) => {
        console.error(`Server process error: ${err.message}`);
        serverProcess = null;
        reject(err);
      });
    });
    
  } catch (error) {
    console.error(`Server exited with error: ${error.message}`);
    if (error.status !== null) {
      process.exit(error.status);
    }
  }
}

/**
 * Gracefully shutdown the lemonade server and all child processes
 */
function shutdownLemonadeServer() {
  // Prevent duplicate shutdown calls
  if (isShuttingDown) {
    console.log('Shutdown already in progress...');
    return;
  }
  
  if (!serverProcess || !serverProcess.pid) {
    console.log('No server process to shut down.');
    return;
  }
  
  isShuttingDown = true;
  hasExited = false;
  console.log('\n\nShutting down Lemonade Server and child processes...');
  
  // Check if process is still running
  try {
    // Sending signal 0 checks if process exists without actually sending a signal
    process.kill(serverProcess.pid, 0);
  } catch (err) {
    // Process is already dead
    console.log('Server process is already terminated.');
    serverProcess = null;
    isShuttingDown = false;
    return;
  }
  
  // Remove existing event listeners to prevent duplicates
  serverProcess.removeAllListeners('exit');
  serverProcess.removeAllListeners('error');
  
  // Try graceful shutdown first (SIGINT)
  serverProcess.on('exit', (code, signal) => {
    hasExited = true;
    console.log(`Server exited with status ${code || 'None'} and signal ${signal || 'None'}`);
    console.log('Server shut down successfully.');
    serverProcess = null;
    isShuttingDown = false;
  });
  
  serverProcess.on('error', (err) => {
    console.error(`Error shutting down server: ${err.message}`);
  });
  
  // Use tree-kill to terminate the process and all its children
  kill(serverProcess.pid, 'SIGINT', (err) => {
    if (err && !hasExited) {
      // Only log error if process hasn't already exited naturally
      if (err.code !== 'ESRCH') {
        console.log(`Note: Could not kill process tree: ${err.message}`);
      }
    }
  });
  
  // Force kill with SIGKILL after 3 seconds if still running
  setTimeout(() => {
    // Don't force kill if already exited
    if (hasExited || !isShuttingDown) return;
    
    // Check again if process is still running before force kill
    try {
      process.kill(serverProcess.pid, 0);
      // Process still exists, force kill it
      kill(serverProcess.pid, 'SIGKILL', (err) => {
        if (err && !hasExited) {
          // Only log error if process hasn't already exited naturally
          if (err.code !== 'ESRCH') {
            console.log(`Note: Could not force kill process: ${err.message}`);
          }
        }
      });
    } catch (err) {
      // Process has already exited
      console.log('Process has already exited.');
    }
  }, 3000);
}

// Set up signal handlers for graceful shutdown
function setupShutdownHandlers() {
  const shutdown = (signal) => {
    if (isShuttingDown) {
      console.log(`Received ${signal}, but shutdown already in progress...`);
      return;
    }
    
    console.log(`\n\nReceived ${signal}. Shutting down...`);
    shutdownLemonadeServer();
    setTimeout(() => process.exit(0), 2000);
  };
  
  process.on('SIGINT', () => shutdown('SIGINT')); // Ctrl+C
  process.on('SIGTERM', () => shutdown('SIGTERM')); // Termination signal
}

module.exports = {
  buildServerArgs,
  formatCommand,
  launchLemonadeServer,
  shutdownLemonadeServer,
  setupShutdownHandlers
};