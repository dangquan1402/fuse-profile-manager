#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * ClaudeDirInstaller - Manages copying .claude/ directory from package to ~/.ccs/.claude/
 * v4.1.1: Fix for npm install not copying .claude/ directory
 */
class ClaudeDirInstaller {
  constructor() {
    this.homeDir = os.homedir();
    this.ccsClaudeDir = path.join(this.homeDir, '.ccs', '.claude');
  }

  /**
   * Copy .claude/ directory from package to ~/.ccs/.claude/
   * @param {string} packageDir - Package installation directory (default: auto-detect)
   */
  install(packageDir) {
    try {
      // Auto-detect package directory if not provided
      if (!packageDir) {
        // Try to find package root by going up from this file
        packageDir = path.join(__dirname, '..', '..');
      }

      const packageClaudeDir = path.join(packageDir, '.claude');

      if (!fs.existsSync(packageClaudeDir)) {
        console.log('[!] Package .claude/ directory not found');
        console.log(`    Searched in: ${packageClaudeDir}`);
        console.log('    This may be a development installation');
        return false;
      }

      console.log('[i] Installing CCS .claude/ items...');

      // Remove old version before copying new one
      if (fs.existsSync(this.ccsClaudeDir)) {
        fs.rmSync(this.ccsClaudeDir, { recursive: true, force: true });
      }

      // Use fs.cpSync for recursive copy (Node.js 16.7.0+)
      // Fallback to manual copy for older Node.js versions
      if (fs.cpSync) {
        fs.cpSync(packageClaudeDir, this.ccsClaudeDir, { recursive: true });
      } else {
        // Fallback for Node.js < 16.7.0
        this._copyDirRecursive(packageClaudeDir, this.ccsClaudeDir);
      }

      console.log('[OK] Copied .claude/ items to ~/.ccs/.claude/');
      return true;
    } catch (err) {
      console.warn('[!] Failed to copy .claude/ directory:', err.message);
      console.warn('    CCS items may not be available');
      return false;
    }
  }

  /**
   * Recursively copy directory (fallback for Node.js < 16.7.0)
   * @param {string} src - Source directory
   * @param {string} dest - Destination directory
   * @private
   */
  _copyDirRecursive(src, dest) {
    // Create destination directory
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    // Read source directory
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        // Recursively copy subdirectory
        this._copyDirRecursive(srcPath, destPath);
      } else {
        // Copy file
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  /**
   * Check if ~/.ccs/.claude/ exists and is valid
   * @returns {boolean} True if directory exists
   */
  isInstalled() {
    return fs.existsSync(this.ccsClaudeDir);
  }
}

module.exports = ClaudeDirInstaller;
