import { FSWatcher, watch } from 'chokidar';
import { TreeWatcherOptions } from './types.ts';
import { generateTree } from './tree.ts';
import path from 'path';

export class TreeWatcher {
  private watcher: FSWatcher | null = null;
  private options: TreeWatcherOptions;
  private updateTimeout: NodeJS.Timeout | null = null;
  private isShuttingDown = false;

  constructor(options: TreeWatcherOptions) {
    this.options = options;
    console.log("OutputFile:",this.options.outputFile);
    console.log("Excluded Folders:", this.options.excludedFolders);
    this.setupWatcher();
    this.setupCleanup();
  }

  /**
   * Stops the file watcher.
   */
  stop() {
    if (this.watcher) {
      this.watcher.close();
    }
  }

  /**
   * Sets up the file watcher.
   * @private
   */
  private setupWatcher() {
    try {
      this.watcher = watch('.', {
        ignored: (filePath: string) => {
          // console.log("filePath:", filePath)
          if (filePath === this.options.outputFile) {
            console.log("Ignoring output file:", filePath)
            return true;
          }

          for (const excludedFolder of this.options.excludedFolders) {
            if (
              filePath.startsWith(excludedFolder + path.sep) ||
              filePath === excludedFolder
            ) {
              console.log("Ignoring excluded folder:", filePath)
              return true;
            }
          }
          // console.log("Not Ignoring:", filePath)
          return false;
        },
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
        .on('add', (path: string) => this.debounceUpdate('add', path))
        .on('unlink', (path: string) => this.debounceUpdate('unlink', path))
        .on('addDir', (path: string) => this.debounceUpdate('addDir', path))
        .on('unlinkDir', (path: string) => this.debounceUpdate('unlinkDir', path))
        .on('error', error => {
          console.error('Watch error:', error);
        });

    } catch (error) {
      console.error('Failed to initialize watcher:', error);
      process.exit(1);
    }
  }

  /**
   * Sets up cleanup handlers for process termination signals.
   * @private
   */
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

  /**
   * Debounces the update of the repository structure to avoid multiple updates in quick succession.
   * @private
   */
  private debounceUpdate(event: string, path: string) {
    if (this.isShuttingDown) return;
    
    console.log(`[${new Date().toLocaleTimeString()}] Event detected: ${event} on ${path}`);

    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }

    this.updateTimeout = setTimeout(() => {
      this.generateTree();
    }, 100);
  }

  /**
   * Generates the repository structure tree and logs a success message.
   * @private
   */
  private async generateTree() {
    try {
      generateTree({
        outputFile: this.options.outputFile,
        excludedFolders: this.options.excludedFolders,
        maxDepth: this.options.maxDepth ?? Infinity
      });
      console.log(`[${new Date().toLocaleTimeString()}] Repository structure updated!`);
    } catch (error) {
      console.error('Error generating tree:', error);
    }
  }
}

// Handle process termination
process.on('SIGINT', () => {
  process.exit(0);
}); 