const inquirer = require('inquirer');
const { DEFAULTS, BACKEND_TYPES, LOG_LEVELS, RUN_MODES, HOSTS, CONTEXT_SIZES } = require('../config/constants');
const { loadConfig, saveConfig } = require('../config');
const { selectLlamaCppRelease, selectAsset, selectInstalledAssetPrompt, displayConfigSummary } = require('./prompts');
const { downloadAndExtractLlamaCpp } = require('../services/asset-manager');
const { inferBackendType } = require('../utils/system');

/**
 * Run the interactive setup wizard
 * @param {boolean} isEdit - If true, use saved values as defaults
 * @returns {Promise<Object>} Configuration object
 */
async function runSetupWizard(isEdit = false) {
  console.log(isEdit ? '🍋 Edit Configuration From Saved' : '🍋 Setup Configuration From Defaults');

  let existingConfig = isEdit ? loadConfig() : {};

  // Q1: Local network exposure
  const { exposeToNetwork } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'exposeToNetwork',
      message: 'Do you want to expose the server to the local network?',
      default: existingConfig.exposeToNetwork || DEFAULTS.EXPOSE_TO_NETWORK
    }
  ]);
  
  const host = exposeToNetwork ? HOSTS.ALL_INTERFACES : HOSTS.LOCALHOST;
  
  // Q2: Port selection
  const { port } = await inquirer.prompt([
    {
      type: 'input',
      name: 'port',
      message: 'What port would you like the server to run on?',
      default: existingConfig.port || DEFAULTS.PORT.toString(),
      validate: (input) => !isNaN(input) && parseInt(input) > 0 && parseInt(input) < 65536 || 'Invalid port number (must be 1-65535)'
    }
  ]);
  
  // Q3: Logging level
  const { logLevel } = await inquirer.prompt([
    {
      type: 'list',
      name: 'logLevel',
      message: 'What logging level do you want?',
      choices: [
        { name: 'info (default)', value: LOG_LEVELS.INFO },
        { name: 'debug (verbose)', value: LOG_LEVELS.DEBUG },
        { name: 'warning (warnings only)', value: LOG_LEVELS.WARNING },
        { name: 'error (errors only)', value: LOG_LEVELS.ERROR }
      ],
      default: existingConfig.logLevel || DEFAULTS.LOG_LEVEL
    }
  ]);
  
  // Q4: Context window size
  const savedContextSize = existingConfig.contextSize || DEFAULTS.CONTEXT_SIZE;
  const contextSizeChoices = [
    { name: '4K (4096 tokens) - Default', value: CONTEXT_SIZES['4K'] },
    { name: '8K (8192 tokens)', value: CONTEXT_SIZES['8K'] },
    { name: '16K (16384 tokens)', value: CONTEXT_SIZES['16K'] },
    { name: '32K (32768 tokens)', value: CONTEXT_SIZES['32K'] },
    { name: '64K (65536 tokens)', value: CONTEXT_SIZES['64K'] },
    { name: '128K (131072 tokens)', value: CONTEXT_SIZES['128K'] },
    { name: '256K (262144 tokens)', value: CONTEXT_SIZES['256K'] }
  ];
  
  // Find the index of the saved/default context size
  const defaultContextSizeIndex = contextSizeChoices.findIndex(choice => choice.value === savedContextSize);
  const defaultContextSize = defaultContextSizeIndex >= 0 ? defaultContextSizeIndex : 0;
  
  const { contextSize } = await inquirer.prompt([
    {
      type: 'list',
      name: 'contextSize',
      message: 'How big should the context window be?',
      choices: contextSizeChoices,
      default: defaultContextSize
    }
  ]);
  
  // Q5: Custom model directory
  const existingModelDir = existingConfig.modelDir;
  const hasExistingModelDir = existingModelDir !== undefined;
  
  const { useCustomModelDir } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'useCustomModelDir',
      message: 'Is there another model directory to use? (example: LM Studio)',
      default: hasExistingModelDir
    }
  ]);
  
  let finalModelDir;
  
  if (useCustomModelDir) {
    const modelDirAnswer = await inquirer.prompt([
      {
        type: 'input',
        name: 'modelDir',
        message: 'Enter the model directory path:',
        default: existingModelDir || './models'
      }
    ]);
    finalModelDir = modelDirAnswer.modelDir;
  } else {
    finalModelDir = DEFAULTS.MODEL_DIR;
  }
  
  // Q6: System tray vs headless
  const { runMode } = await inquirer.prompt([
    {
      type: 'list',
      name: 'runMode',
      message: 'Do you want a system tray or headless?',
      choices: [
        { name: 'system-tray (with system tray icon)', value: RUN_MODES.SYSTEM_TRAY },
        { name: 'headless (background service)', value: RUN_MODES.HEADLESS }
      ],
      default: existingConfig.runMode || DEFAULTS.RUN_MODE
    }
  ]);
  
  // Q7: Custom llama.cpp args
  const existingLlamacppArgs = existingConfig.llamacppArgs || '';
  const hasExistingArgs = existingLlamacppArgs.length > 0;
  
  let finalLlamacppArgs;
  
  const { useCustomArgs } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'useCustomArgs',
      message: 'Are there any llama.cpp args you need to set?',
      default: hasExistingArgs
    }
  ]);
  
  if (useCustomArgs) {
    const argsAnswer = await inquirer.prompt([
      {
        type: 'input',
        name: 'llamacppArgs',
        message: 'Enter llama.cpp arguments (comma-separated, e.g., --no-mmap,--batch-size 512):',
        default: existingLlamacppArgs
      }
    ]);
    finalLlamacppArgs = argsAnswer.llamacppArgs;
  } else {
    finalLlamacppArgs = '';
  }
  
  // Q8: Custom llama.cpp build
  const existingCustomPath = existingConfig.customLlamacppPath || '';
  const hasExistingBuild = existingCustomPath.length > 0;
  
  let customLlamacppPath;
  let customBackendType = existingConfig.customBackendType || '';
  let customServerPath = existingConfig.customServerPath || '';
  let backend = existingConfig.backend || DEFAULTS.BACKEND;
  
  const { useCustomBuild } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'useCustomBuild',
      message: 'Do you want to use a different build for llama cpp?',
      default: hasExistingBuild
    }
  ]);
  
  if (useCustomBuild) {
    const { useInstalled } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'useInstalled',
        message: 'Use an already installed custom build?',
        default: hasExistingBuild
      }
    ]);
    
    if (useInstalled) {
      const installedAsset = await selectInstalledAssetPrompt();
      
      if (installedAsset) {
        customLlamacppPath = installedAsset.installPath;
        customBackendType = installedAsset.backendType;
        customServerPath = installedAsset.serverPath;
        backend = customBackendType;
      } else {
        customLlamacppPath = '';
        customBackendType = '';
        customServerPath = '';
      }
    } else {
      console.log('\nFetching recent llama.cpp builds...');
      const release = await selectLlamaCppRelease();
      const asset = await selectAsset(release);
      
      const version = release.tag_name;
      customLlamacppPath = await downloadAndExtractLlamaCpp(asset, version);
      
      customBackendType = inferBackendType(asset.name);
      customServerPath = customLlamacppPath;
      
      console.log(`\n✓ Custom llama.cpp build installed at: ${customLlamacppPath}`);
      console.log(`  Backend Type: ${customBackendType.toUpperCase()}`);
    }
  } else {
    const { selectedBackend } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedBackend',
        message: 'Which llama.cpp backend to use?',
        choices: [
          { name: 'auto (automatically select best backend)', value: BACKEND_TYPES.AUTO },
          { name: 'vulkan (GPU acceleration)', value: BACKEND_TYPES.VULKAN },
          { name: 'rocm (AMD GPU acceleration)', value: BACKEND_TYPES.ROCM },
          { name: 'cpu (CPU only)', value: BACKEND_TYPES.CPU }
        ],
        default: existingConfig.backend || DEFAULTS.BACKEND
      }
    ]);
    
    backend = selectedBackend;
    customLlamacppPath = '';
    customBackendType = '';
    customServerPath = '';
  }

  // Save configuration to Lemonade Server config format
  const config = {
    exposeToNetwork,
    host,
    port: parseInt(port),
    logLevel,
    contextSize,
    backend,
    modelDir: finalModelDir,
    runMode,
    llamacppArgs: finalLlamacppArgs,
    customLlamacppPath,
    customBackendType,
    customServerPath,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const { saveConfiguration } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'saveConfiguration',
      message: 'Do you want to save this configuration for future use?',
      default: true
    }
  ]);

  if (saveConfiguration) {
    saveConfig(config);
  }

  displayConfigSummary(config);

  return config;
}

module.exports = {
  runSetupWizard
};