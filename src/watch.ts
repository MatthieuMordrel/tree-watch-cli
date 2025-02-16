import { FSWatcher, watch } from 'chokidar';
import { exec } from 'child_process';
import path from 'path';

interface TreeWatcherOptions {
  outputFile: string;
  excludedFolders: string[];
  maxDepth?: number;
}

export class TreeWatcher {
  private watcher: FSWatcher;
  private options: TreeWatcherOptions;

  constructor(options: TreeWatcherOptions) {
    this.options = options;

    // Initialize watcher with provided options
    this.watcher = watch('.', {
      ignored: [
        /(^|[\/\\])\../,  // dot files
        ...options.excludedFolders.map(folder => `**/${folder}/**`),
        options.outputFile, // Ignore the output file
      ],
      persistent: true,
      ignoreInitial: false,
      depth: options.maxDepth ?? 99,
    });

    this.setupWatchers();
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

  private setupWatchers() {
    this.watcher
      .on('add', (path: string) => {
        console.log(`File ${path} has been added`);
        this.generateTree();
      })
      .on('unlink', (path: string) => {
        console.log(`File ${path} has been removed`);
        this.generateTree();
      })
      .on('addDir', (path: string) => {
        console.log(`Directory ${path} has been added`);
        this.generateTree();
      })
      .on('unlinkDir', (path: string)  => {
        console.log(`Directory ${path} has been removed`);
        this.generateTree();
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