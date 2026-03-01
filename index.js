#!/usr/bin/env node

/**
 * Lemonade Launcher - Main Entry Point
 * 
 * This file serves as the primary entry point for the CLI tool.
 * All functionality has been refactored into modular components under src/
 */

const { runCLI } = require('./src/index');

// Run the CLI
runCLI().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});