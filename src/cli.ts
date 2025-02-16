#!/usr/bin/env node

import { Command } from 'commander';
import { TreeWatcher } from './watch.js';

const program = new Command();

program
  .name('tree-watch-cli')
  .description('Watch directory and generate tree structure')
  .version('1.0.0')
  .option('-o, --output <file>', 'output file name', 'tree.txt')
  .option('-e, --exclude <folders...>', 'folders to exclude', ['node_modules', '.git'])
  .option('-d, --max-depth <number>', 'maximum depth to traverse')
  .action((options) => {
    const maxDepth = options.maxDepth ? parseInt(options.maxDepth, 10) : undefined;
    
    const watcher = new TreeWatcher({
      outputFile: options.output,
      excludedFolders: options.exclude,
      maxDepth
    });

    // Handle process termination
    process.on('SIGINT', () => {
      watcher.stop();
      process.exit(0);
    });
  });

program.parse(); 