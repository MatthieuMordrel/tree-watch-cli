import { FSWatcher, watch } from 'chokidar';
import path from 'path';
import { TreeWatcherOptions } from './types.ts';
import { generateTree } from './tree.ts';

export class TreeWatcher {
  private watcher: FSWatcher | null = null;
  private options: TreeWatcherOptions;
  private updateTimeout: NodeJS.Timeout | null = null;
  private isShuttingDown = false;

  constructor(options: TreeWatcherOptions) {
    this.options = options;
    this.setupWatcher();
    this.setupCleanup();
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
    }
  }

  private setupWatcher() {
    try {
      this.watcher = watch('.', {
        ignored: [
          // Completely ignore excluded folders
          ...this.options.excludedFolders.map(folder => `**/${folder}/**`),
          this.options.outputFile,
        ],
        persistent: true,
        ignoreInitial: true,
        depth: Math.min(this.options.maxDepth ?? 99, 20),
        ignorePermissionErrors: true,
        awaitWriteFinish: {
          stabilityThreshold: 2000,
          pollInterval: 100
        }
      });

      this.watcher
        .on('all', this.debounceUpdate.bind(this))
        .on('error', error => {
          console.error('Watch error:', error);
        });

    } catch (error) {
      console.error('Failed to initialize watcher:', error);
      process.exit(1);
    }
  }

  private setupCleanup() {
    const cleanup = async () => {
      this.isShuttingDown = true;
      if (this.updateTimeout) {
        clearTimeout(this.updateTimeout);
      }
      if (this.watcher) {
        await this.watcher.close();
      }
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('exit', cleanup);
  }

  private debounceUpdate() {
    if (this.isShuttingDown) return;
    
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }

    this.updateTimeout = setTimeout(() => {
      this.generateTree();
    }, 300);
  }

  private async generateTree() {
    try {
      generateTree({
        outputFile: this.options.outputFile,
        excludedFolders: this.options.excludedFolders,
        maxDepth: this.options.maxDepth ?? Infinity
      });
      console.log('Repository structure updated!');
    } catch (error) {
      console.error('Error generating tree:', error);
    }
  }
}

// Handle process termination
process.on('SIGINT', () => {
  process.exit(0);
}); 