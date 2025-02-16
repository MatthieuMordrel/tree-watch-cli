//Run with node tree.ts (requires node v23 or higher)

import fs from "fs";
import path from "path";

interface TreeOptions {
  outputFile: string;
  excludedFolders: string[];
  maxDepth: number;
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: TreeOptions = {
  outputFile: 'tree.txt',
  excludedFolders: ['node_modules'],
  maxDepth: Infinity
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--output':
      options.outputFile = args[++i];
      break;
    case '--exclude':
      options.excludedFolders = [];
      while (args[i + 1] && !args[i + 1].startsWith('--')) {
        options.excludedFolders.push(args[++i]);
      }
      break;
    case '--depth':
      options.maxDepth = parseInt(args[++i], 10);
      break;
  }
}

type FileNode = {
  name: string;
  children?: FileNode[];
};

/**
 * Lists all files and directories in the given directory up to the specified depth.
 * @param dir - The directory to list files from.
 * @param depth - The current depth of the directory.
 * @param maxDepth - The maximum depth to traverse.
 * @param excludedFolders - The list of folders to exclude.
 * @returns An array of objects representing the files and directories.
 */
function listFiles(dir: string, depth: number, maxDepth: number, excludedFolders: string[]): FileNode[] {
  if (depth > maxDepth) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries
    .filter(entry => !excludedFolders.includes(entry.name))
    .map((entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return {
          name: entry.name,
          children: listFiles(fullPath, depth + 1, maxDepth, excludedFolders),
        };
      } else {
        return { name: entry.name };
      }
    });
}

/**
 * Prints the tree structure of the given nodes to a string.
 * @param nodes - The nodes to print the tree structure for.
 * @param prefix - The prefix to use for the tree structure.
 * @param output - The output array to store the tree structure.
 * @returns An array of strings representing the tree structure.
 */
function printTree(nodes: FileNode[], prefix = "", output: string[] = []): string[] {
  nodes.forEach((node, index) => {
    const isLast = index === nodes.length - 1;
    output.push(`${prefix}${isLast ? "└──" : "├──"} ${node.name}`);
    if (node.children) {
      printTree(node.children, `${prefix}${isLast ? "    " : "│   "}`, output);
    }
  });
  return output;
}

const tree = listFiles(process.cwd(), 0, options.maxDepth, options.excludedFolders);
const treeOutput = [".", ...printTree(tree)];
fs.writeFileSync(options.outputFile, treeOutput.join("\n"), "utf-8");
