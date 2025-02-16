import { FSWatcher, watch } from 'chokidar';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

interface TreeWatcherOptions {
  outputFile: string;
  excludedFolders: string[];
  maxDepth?: number;
}

export class TreeWatcher {
  private watcher: FSWatcher;
  private options: TreeWatcherOptions;
  private updateTimeout: NodeJS.Timeout | null = null;

  constructor(options: TreeWatcherOptions) {
    this.options = options;

    // Initialize watcher with provided options
    this.watcher = watch('.', {
      ignored: [
        '**/node_modules/*/*/**',    // Ignore anything deeper than top-level packages
        '**/.git/*/**',              // Ignore .git contents beyond first level
        ...options.excludedFolders
          .filter(folder => !['node_modules', '.git'].includes(folder))
          .map(folder => `**/${folder}/**`),
        options.outputFile, // Ignore the output file
      ],
      persistent: true,
      ignoreInitial: true,  // Don't trigger events during initial scan
      depth: options.maxDepth ?? 99,
      ignorePermissionErrors: true,
    });

    // Do an initial scan of just the top level of node_modules
    this.scanNodeModulesTopLevel();
    this.setupWatchers();
  }

  private scanNodeModulesTopLevel() {
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    if (fs.existsSync(nodeModulesPath)) {
      const entries = fs.readdirSync(nodeModulesPath, { withFileTypes: true });
      entries.forEach(entry => {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          console.log(`Package found: ${entry.name}`);
        }
      });
    }
  }

  private generateTree() {
    const command = [
      'node --import tsx',
      path.join(process.cwd(), 'src/tree.ts'),
      `--output ${this.options.outputFile}`,
      `--exclude ${this.options.excludedFolders.join(' ')}`,
      this.options.maxDepth ? `--depth ${this.options.maxDepth}` : ''
    ].join(' ');

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error}`);
        return;
      }
      if (stderr) {
        console.error(`Stderr: ${stderr}`);
        return;
      }
      console.log('Repository structure updated!');
    });
  }

  private debounceGenerateTree() {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }
    
    this.updateTimeout = setTimeout(() => {
      this.generateTree();
      this.updateTimeout = null;
    }, 1000); // Wait 1 second after last change before updating
  }

  private setupWatchers() {
    this.watcher
      .on('add', (path: string) => {
        // Only log if not in node_modules
        if (!path.includes('node_modules/')) {
          console.log(`File ${path} has been added`);
        }
        this.debounceGenerateTree();
      })
      .on('unlink', (path: string) => {
        if (!path.includes('node_modules/')) {
          console.log(`File ${path} has been removed`);
        }
        this.debounceGenerateTree();
      })
      .on('addDir', (path: string) => {
        if (!path.includes('node_modules/')) {
          console.log(`Directory ${path} has been added`);
        }
        this.debounceGenerateTree();
      })
      .on('unlinkDir', (path: string)  => {
        if (!path.includes('node_modules/')) {
          console.log(`Directory ${path} has been removed`);
        }
        this.debounceGenerateTree();
      })
      .on('ready', () => {
        console.log('Initial scan complete. Watching for changes...');
        this.generateTree(); // Generate initial tree
      });
  }

  public stop() {
    this.watcher.close();
  }
}

// Handle process termination
process.on('SIGINT', () => {
  process.exit(0);
}); 