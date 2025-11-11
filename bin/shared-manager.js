'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * SharedManager - Manages symlinked shared directories for CCS
 * Phase 1: Shared Global Data via Symlinks
 *
 * Purpose: Eliminates duplication of commands/skills across profile instances
 * by symlinking to a single ~/.ccs/shared/ directory.
 */
class SharedManager {
  constructor() {
    this.homeDir = os.homedir();
    this.sharedDir = path.join(this.homeDir, '.ccs', 'shared');
    this.instancesDir = path.join(this.homeDir, '.ccs', 'instances');
    this.sharedDirs = ['commands', 'skills', 'agents'];
  }

  /**
   * Ensure shared directories exist
   */
  ensureSharedDirectories() {
    // Create shared directory
    if (!fs.existsSync(this.sharedDir)) {
      fs.mkdirSync(this.sharedDir, { recursive: true, mode: 0o700 });
    }

    // Create shared subdirectories
    for (const dir of this.sharedDirs) {
      const dirPath = path.join(this.sharedDir, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true, mode: 0o700 });
      }
    }
  }

  /**
   * Link shared directories to instance
   * @param {string} instancePath - Path to instance directory
   */
  linkSharedDirectories(instancePath) {
    this.ensureSharedDirectories();

    for (const dir of this.sharedDirs) {
      const linkPath = path.join(instancePath, dir);
      const targetPath = path.join(this.sharedDir, dir);

      // Remove existing directory/link
      if (fs.existsSync(linkPath)) {
        fs.rmSync(linkPath, { recursive: true, force: true });
      }

      // Create symlink
      try {
        fs.symlinkSync(targetPath, linkPath, 'dir');
      } catch (err) {
        // Windows fallback: copy directory if symlink fails
        if (process.platform === 'win32') {
          this._copyDirectory(targetPath, linkPath);
          console.log(`[!] Symlink failed for ${dir}, copied instead (enable Developer Mode)`);
        } else {
          throw err;
        }
      }
    }
  }

  /**
   * Migrate existing instances to shared structure
   * Idempotent: Safe to run multiple times
   */
  migrateToSharedStructure() {
    // Check if migration is needed (shared dirs exist but are empty)
    const needsMigration = !fs.existsSync(this.sharedDir) ||
      this.sharedDirs.every(dir => {
        const dirPath = path.join(this.sharedDir, dir);
        if (!fs.existsSync(dirPath)) return true;
        try {
          const files = fs.readdirSync(dirPath);
          return files.length === 0; // Empty directory needs migration
        } catch (err) {
          return true; // If we can't read it, assume it needs migration
        }
      });

    if (!needsMigration) {
      return; // Already migrated with content
    }

    // Create shared directories
    this.ensureSharedDirectories();

    // Copy from ~/.claude/ (actual Claude CLI directory)
    const claudeDir = path.join(this.homeDir, '.claude');

    if (fs.existsSync(claudeDir)) {
      // Copy commands to shared (if exists)
      const commandsPath = path.join(claudeDir, 'commands');
      if (fs.existsSync(commandsPath)) {
        this._copyDirectory(commandsPath, path.join(this.sharedDir, 'commands'));
      }

      // Copy skills to shared (if exists)
      const skillsPath = path.join(claudeDir, 'skills');
      if (fs.existsSync(skillsPath)) {
        this._copyDirectory(skillsPath, path.join(this.sharedDir, 'skills'));
      }

      // Copy agents to shared (if exists)
      const agentsPath = path.join(claudeDir, 'agents');
      if (fs.existsSync(agentsPath)) {
        this._copyDirectory(agentsPath, path.join(this.sharedDir, 'agents'));
      }
    }

    // Update all instances to use symlinks
    if (fs.existsSync(this.instancesDir)) {
      const instances = fs.readdirSync(this.instancesDir);

      for (const instance of instances) {
        const instancePath = path.join(this.instancesDir, instance);
        if (fs.statSync(instancePath).isDirectory()) {
          this.linkSharedDirectories(instancePath);
        }
      }
    }

    console.log('[OK] Migrated to shared structure');
  }

  /**
   * Copy directory recursively (fallback for Windows)
   * @param {string} src - Source directory
   * @param {string} dest - Destination directory
   * @private
   */
  _copyDirectory(src, dest) {
    if (!fs.existsSync(src)) {
      return;
    }

    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        this._copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

module.exports = SharedManager;
