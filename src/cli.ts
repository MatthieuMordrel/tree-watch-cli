#!/usr/bin/env node

import { Command } from 'commander';
import { TreeWatcher } from './watch.js';
import { generateTree } from './tree.js';
import { TreeOptions } from './types.js';

// Create a new command instance
const program = new Command();

program
  .name('tree-watch-cli')
  .description('Watch directory and generate tree structure')
  .version('1.0.8')
  .option('-o, --output <file>', 'output file name', 'tree.txt')
  .option('-e, --exclude <folders...>', 'folders to exclude', ['node_modules', '.git'])
  .option('-d, --max-depth <number>', 'maximum depth to traverse')
  .action((options) => {
    // Create TreeOptions object from command line options
    const treeOptions: TreeOptions = {
      outputFile: options.output,
      excludedFolders: options.exclude,
      maxDepth: options.maxDepth ? parseInt(options.maxDepth, 10) : Infinity
    };

    // Generate initial tree structure
    generateTree(treeOptions);

    // Start watching for changes in the directory
    const watcher = new TreeWatcher(treeOptions);
    
    // Handle SIGINT signal to gracefully stop the watcher
    process.on('SIGINT', () => {
      watcher.stop();
      process.exit(0);
    });
  });

// Parse command line arguments
program.parse(); 