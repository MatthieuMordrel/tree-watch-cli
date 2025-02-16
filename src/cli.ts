#!/usr/bin/env node

import { Command } from 'commander';
import { TreeWatcher } from './watch.ts';
import { generateTree } from './tree.ts';
import { TreeOptions } from './types.ts';

const program = new Command();

program
  .name('tree-watch-cli')
  .description('Watch directory and generate tree structure')
  .version('1.0.0')
  .option('-o, --output <file>', 'output file name', 'tree.txt')
  .option('-e, --exclude <folders...>', 'folders to exclude', ['node_modules', '.git'])
  .option('-d, --max-depth <number>', 'maximum depth to traverse')
  .option('--excluded-depth <number>', 'depth for excluded folders', '1')
  .action((options) => {
    const treeOptions: TreeOptions = {
      outputFile: options.output,
      excludedFolders: options.exclude,
      maxDepth: options.maxDepth ? parseInt(options.maxDepth, 10) : Infinity,
      excludedFoldersDepth: parseInt(options.excludedDepth, 10)
    };

    // Generate initial tree
    generateTree(treeOptions);

    // Start watching for changes
    const watcher = new TreeWatcher(treeOptions);
    
    process.on('SIGINT', () => {
      watcher.stop();
      process.exit(0);
    });
  });

program.parse(); 